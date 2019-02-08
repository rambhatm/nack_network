//command format is - node sender.js <num_packets> <sender_ip> <sender_port> <router_ip> <router_port> <receiver_ip> <receiver_port>
// default assumes (sender, router, receiver) runs on localhost and port (3000, 4000, 5000)
var data_size = 1024

var num_packets = process.argv[2]
var sender_ip = "127.0.0.1"
var sender_port = 3000
var router_ip = "127.0.0.1"
var router_port = 4000
var receiver_ip = "127.0.0.1"
var receiver_port = 5000

if (process.argv.length == 9) {
    sender_ip = process.argv[3]
    sender_port = process.argv[4]
    router_ip = process.argv[5]
    router_port = process.argv[6]
    receiver_ip = process.argv[7]
    receiver_port = process.argv[8]
}

var nack_io = require('socket.io').listen(sender_port);
var io = require('socket.io-client');
var random_data = require("randomstring")
var crc = require('crc')
var performance = require('perf_hooks').performance

//Stores the generated data, used to send nack_packet if needed
nack_window_data = {}
function generate_random_data_and_save(sequence_no, size_bytes) {
    data = random_data.generate(size_bytes)
    nack_window_data[sequence_no] = data
    return data
}

//send_packet
function send_data_packet(sequence_no, data, size_bytes) {
    data_crc = crc.crc32(data)
    console.log("Sending DATA packet ( sequence_no : " + sequence_no + " CRC32 : " + data_crc)
    socket.emit('send_packet', {
        "sequence_no" : sequence_no,
        "sender_ip" : sender_ip,
        "sender_port" :sender_port,
        "receiver_ip" : receiver_ip,
        "receiver_port" : receiver_port,                  
        "total_packets" : num_packets,
        "packet_len" : size_bytes,
        "packet_data_crc" : data_crc,
        "packet_data" : data    
    })
}

//Stats stuff
var num_nacks = 0 //total nacks received
var start_ms = 0 //start time of transfer in ms
var time_taken_ms = 0 //total time taken for transfer in ms

//connect to router
var socket = io.connect("http://" + router_ip + ":"+router_port +"/", {
    reconnection: true
});

//Start sending packets to router
socket.on('connect', function () {
    console.log('connected to router');
    var seq = 1
    start_ms = performance.now()
    /*
    do {
        //generate some random data
        data = generate_random_data_and_save(seq, 1024)
        //send_packet
        send_data_packet(seq, data, 1024)
    } while(++seq <= num_packets)
     */
    
    send_interval = setInterval(function(){
        //generate some random data
        data = generate_random_data_and_save(seq, data_size)
        //send_packet
        send_data_packet(seq, data, data_size)
        
        if (++seq > num_packets) {
            clearInterval(send_interval)
        }
    }, 10)

});

//respond to nack_sender to resending data packet using send_packet
nack_io.on('connection', function(nack_socket) {
    nack_socket.on('nack_sender', function(nack_packet) {
        console.log("NACK RESEND packet #", nack_packet.nack_sequence_no)
        num_nacks++
        //send_packet
        send_data_packet(nack_packet.nack_sequence_no, nack_window_data[nack_packet.nack_sequence_no], data_size)
    })

    nack_socket.on('stats_end', function(stats) {
        time_taken_ms = performance.now() - start_ms
        data_rate_mb_s = ( (data_size * (num_packets + num_nacks)) / (1024 * 1024) ) / (time_taken_ms / 1000) 
        console.log("Transferred: " + num_packets + " packets in: "+ time_taken_ms+ " ms data rate : ")
        console.log("Data rate(MBps) : "+data_rate_mb_s)
        console.log("Number of NACKS: "+num_nacks)
    })
});