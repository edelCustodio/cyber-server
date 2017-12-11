const net = require('net');
const ip = require('ip');
let Desktop = require('../models/computadora')

global.clients = [];

var CyberControl = {
    createCyberServer: function () {
        var host = this.getIP();
        var port = 6969;
        
        // Create a server instance, and chain the listen function to it
        // The function passed to net.createServer() becomes the event handler for the 'connection' event
        // The sock object the callback function receives UNIQUE for each connection
        server = net.createServer(function(sock) {
            var client = {
                sock: sock,
                isOnline: true,
                data: {}
            };
            
            if (clients.length > 0) {
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].sock.remoteAddress === client.sock.remoteAddress) {
                        console.log('I already have this client on the list. '+ client.sock.remoteAddress);
                    }else{
                        clients.push(client);
                    }
                }
            } else {
                clients.push(client);
            }
        
            
            // We have a connection - a socket object is assigned to the connection automatically
            console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
            
            // Add a 'data' event handler to this instance of socket
            sock.on('data', function(data) {
                
                var textData = data.toString('utf8');
                var jsonData = JSON.parse(textData)[0];

                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].sock.remoteAddress === jsonData.IP){
                        clients[i].data = jsonData;
                    }
                }                

                //Actualizar estado computadora para saber si esta en linea o no.
                Desktop.updateDesktopOnline(jsonData.idComputadora, true);

            });
          
            // Add a 'close' event handler to this instance of socket
            sock.on('close', function(data) {
                var textData = data.toString('utf8');
                console.log(textData);
                //Desktop.updateDesktopOnline(jsonData.idComputadora, false);
                console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
            });
        
            sock.on('error', function(data){
                console.error('Error message: ' + data.message + '\n\nStack' + data.stack);
            });
        
            sock.on('clientError', function(data){
                console.error('Client Error message: ' + data.message + '\n\nStack' + data.stack);
            });
            
        });
      
        server.listen(port, host);
        
        console.log('Server listening on ' + host +':'+ port);
    },

    getIP: function () {
        return ip.address();
    }
}

module.exports = CyberControl;