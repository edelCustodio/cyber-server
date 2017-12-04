var remote = require('electron').remote;
var arrClients = null;
$("#sendMessageToClient").click(function() {
    arrClients = remote.getGlobal('clients');
    if(arrClients.length > 0){
      arrClients[0].sock.write($("#message").val());
    }
});