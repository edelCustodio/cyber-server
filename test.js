
$("#sendMessageToClient").click(function() {
    
    if(arrClients.length > 0){
      arrClients[0].sock.write($("#message").val());
    }
});