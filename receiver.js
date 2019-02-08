//command format is node receiver.js <receiver_port, default = 5000> <router_ip> <router_port>
//default values
var receiver_port = 5000
var router_ip = "127.0.0.1"
var router_port = 4000

if (process.argv.length == 5) {
    receiver_port = process.argv[2]
    router_ip = process.argv[3]
    router_port = process.argv[4]
}

var io = require('socket.io').listen(receiver_port)
var nack_io = require('socket.io-client')
var crc = require('crc')

console.log("RECEIVER started on port : " + receiver_port)
var nack_status = {}; //Infinite window
var num_verified_packets = 0;

function send_nack_packet(sequence_no, sender_ip, sender_port) {
    console.log("Sending NACK packet for :", sequence_no)
    var nack_socket = nack_io.connect("http://"+router_ip+":"+router_port+"/", {
                reconnection: true
    });

    //send packet to router
    nack_socket.emit('nack_router',{
                "nack_sequence_no" : sequence_no,
                "nack_destination" : sender_ip,
                "nack_destination_port" : sender_port
    })
}

io.on('connection', function (socket) {
    //console.log('ROUTER connected:', socket.client.id);
    //Accept packet and process
    //Receiver accept packet
    socket.on('receive_packet', function(packet) {
        
        //Check CRC send NACK if data is bad
        if (packet.packet_data_crc == crc.crc32(packet.packet_data)) {
            console.log("CRC check passed for packet sequence_no: " + packet.sequence_no +" CRC32: " + packet.packet_data_crc)
            nack_status[packet.sequence_no] = true;
            num_verified_packets++;
            
            //Check if we have received all packets, +1 is because we dont have nack status for 1st element in the protocol
            if (num_verified_packets == packet.total_packets) {
                console.log("All " + num_verified_packets + " packets receieved and verified CRC!!")
                num_verified_packets = 0
                nack_status = {}

                var stat_socket = nack_io.connect("http://"+router_ip+":"+router_port+"/", {
                    reconnection: true
                });
                stat_socket.emit('stats_end', {
                    "destination" : packet.sender_ip,
                    "port" : packet.sender_port
                })
                return
            }
        } else {
            console.log("CRC check FAILED for packet sequence_no:" + packet.sequence_no +" expected CRC: " + packet.packet_data_crc)
            //send NACK
            send_nack_packet(packet.sequence_no, packet.sender_ip, packet.sender_port)
            return;
        }
        
        //Check NACK status of last packet, if it not set, send NACK
        if (packet.sequence_no !=1 && !(packet.sequence_no - 1 in nack_status)) {
            //Send NACK
            send_nack_packet(packet.sequence_no - 1, packet.sender_ip, packet.sender_port)
       }
    })
});