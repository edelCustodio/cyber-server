const net = require('net');
const ip = require('ip');
const main = require('../../main');

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
                        clients[i] = client;
                        console.log('I just to update the client list for '+ client.sock.remoteAddress);
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
                var jsonData = JSON.parse(textData);

                if (jsonData.IP !== undefined) {
                    for(var i = 0; i < clients.length; i++) {
                        if(clients[i].sock.remoteAddress === jsonData.IP) {
                            clients[i].data = jsonData;
                        }
                    }
                } else if (jsonData.stopBy !== undefined) {
                    main.getMainWindow().webContents.send('time-off', jsonData.client);
                } else if (jsonData.idRegistro !== undefined) {
                    main.getMainWindow().webContents.send('record', textData);
                }


                //Actualizar estado computadora para saber si esta en linea o no.
                // Desktop.updateDesktopOnline(jsonData.idComputadora, true);

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
        var ipAddress = '';

        try {
            var ipEthernet = ip.address('Ethernet');
            ipAddress = ipEthernet;
        } catch (e) {
            
        }

        try {
            var ipWifi = ip.address('Wi-Fi');
            ipAddress = ipWifi;
        } catch (e) {
            
        }
        
        return ipAddress;
    }
}

module.exports = CyberControl;