const port = 4000
const util = require('util')

var io = require('socket.io').listen(port);
var nack_io = require('socket.io-client');

var nack_status = {}; //Infinite window

io.on('connection', function (socket) {
    //console.log('ROUTER connected:', socket.client.id);

    //Accept packet and process
    //Receiver accept packet
    socket.on('receive_packet', function(packet) {
        //console.log("receive_packet packet : " , packet.sequence_no)
        //set the status
        nack_status[packet.sequence_no] = true;
        //Check NACK status
        //console.log(nack_status[packet.sequence_no - 1])   
        if (!(packet.sequence_no - 1 in nack_status)) {
            //Send NACK
            console.log("Sending NACK packet for :", packet.sequence_no - 1)
            var nack_socket = nack_io.connect("http://127.0.0.1:3000/", {
            reconnection: true
            });
            nack_socket.emit('nack_router',{
                "sequence_no" : packet.sequence_no - 1,
                "destination" : packet.source,
                "dest_port" : packet.source_port
            })

        }

    })
});