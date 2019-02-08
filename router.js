//command format is - node router.js <router_port , default = 4000>
var router_port = 4000 //default
if (process.argv.length == 3) {
    router_port = process.argv[2]
}

var io = require('socket.io').listen(router_port)
var recv_io = require('socket.io-client')

console.log("ROUTER started on port : " + router_port)
//last digit of panther ID
const panther = 5

//Returns true of packet should be dropped based on pather id
function should_drop_packet(probability) {
    min = Math.ceil(0);
    max = Math.floor(1000);
    num =  Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    if (num < probability)
        return true
    return false
}

io.on('connection', function (socket) {
    console.log('SENDER connected:', socket.client.id);

    //Accept packet and process
    socket.on('send_packet', function (packet) {
        console.log('send_packet new packet:', packet);
        var recv_socket = recv_io.connect("http://"+packet.receiver_ip+":"+packet.receiver_port+"/", {
            reconnection: true
        });

        //drop packets based on probability (0.1 X panther)%
        if (should_drop_packet(panther)) {
            console.log("packet dropped sequence_no: ", packet.sequence_no)
        } else {
            recv_socket.emit('receive_packet', packet)
        }
    });  

    //Receive NACK
    socket.on('nack_router', function(nack_packet){
        var nack_socket = recv_io.connect("http://"+nack_packet.nack_destination+":"+nack_packet.nack_destination_port+"/", {
            reconnection: true
            });
            nack_socket.emit('nack_sender', nack_packet)
            console.log("Sent NACK to Source seq: ", nack_packet.nack_sequence_no)
    })

    socket.on('stats_end', function(stats) {
        var stat_socket = recv_io.connect("http://"+stats.destination+":"+stats.port+"/", {
            reconnection: true
        });
        stat_socket.emit('stats_end', stats)
            
    })
});