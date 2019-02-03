const port = 3000

var io = require('socket.io').listen(port);
var recv_io = require('socket.io-client');


io.on('connection', function (socket) {
    console.log('connected:', socket.client.id);

    //Accept packet and process
    socket.on('send_packet', function (packet) {
        console.log('new packet from client:', packet);
        var recv_socket = recv_io.connect("http://"+packet.destination+":"+packet.port+"/", {
            reconnection: true
        });
        recv_socket.emit('receive_packet', packet)
    });  
});