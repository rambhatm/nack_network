const port = 4000

var io = require('socket.io').listen(port);


io.on('connection', function (socket) {
    console.log('connected:', socket.client.id);

    //Accept packet and process
    //Receiver accept packet
    socket.on('receive_packet', function(packet) {
        console.log("receiver packet : " , packet)
    })
});