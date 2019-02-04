const port = 3000

var io = require('socket.io').listen(port);
var recv_io = require('socket.io-client');


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
        var recv_socket = recv_io.connect("http://"+packet.destination+":"+packet.port+"/", {
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
        var nack_socket = recv_io.connect("http://"+nack_packet.destination+":"+nack_packet.dest_port+"/", {
            reconnection: true
            });
            nack_socket.emit('nack_sender', nack_packet)
            console.log("Sent NACK to Source seq: ", nack_packet.sequence_no)
    })
});