const sender_port = 5000

var nack_io = require('socket.io').listen(sender_port);
var io = require('socket.io-client');

//var socket = io.connect("http://192.168.1.14:3000/", {
var socket = io.connect("http://127.0.0.1:3000/", {
    reconnection: true
});

socket.on('connect', function () {
    console.log('connected to router');
    var seq = 1
    send_interval = setInterval(function(){
        console.log("Sending packet sequence_no: ", seq)
        socket.emit('send_packet', {
            "sequence_no" : seq ++,
            "source" : "127.0.0.1",
            "destination" : "127.0.0.1", //192.168.1.10
            "port" : 4000,
            "source_port" :sender_port,
            "crc" : 32,
            "total_packets" : 1,
            "nack_timeout" : 30,
            "packet_len" : 5,
            "packet_data" : "data"
    
        })
        if (seq > 500) {
            clearInterval(send_interval)
        }

    }, 100)
   
   

});

nack_io.on('connection', function(nack_socket) {
    nack_socket.on('nack_sender', function(nack_packet) {
        console.log("NACK RESEND packet #", nack_packet.sequence_no)
        socket.emit('send_packet', {
            "sequence_no" : nack_packet.sequence_no,
            "source" : "127.0.0.1",
            "destination" : "127.0.0.1", //192.168.1.10
            "port" : 4000,
            "source_port" :3000,
            "crc" : 32,
            "total_packets" : 1,
            "nack_timeout" : 30,
            "packet_len" : 5,
            "packet_data" : "data"
    
        })
        

    })
});