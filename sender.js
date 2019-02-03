var io = require('socket.io-client');

var socket = io.connect("http://localhost:3000/", {
    reconnection: true
});

socket.on('connect', function () {
    console.log('connected to router');
    var seq = 1
    setInterval(function(){
        console.log("SENDING PACKET")
        socket.emit('send_packet', {
            "sequence_no" : seq ++,
            "destination" : "127.0.0.1",
            "port" : 4000,
            "crc" : 32,
            "total_packets" : 1,
            "packet_len" : 5,
            "packet_data" : "data"
    
        })

    }, 1000)
   
   
});