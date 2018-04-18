

var ipcRenderer = require('electron').ipcRenderer;
var pathConfigFile = '';
var hostname = '';

/**
 * Document Ready
 */
$(document).ready(function () {
    //getFileConfig();
})

ipcRenderer.on('replyIPServer', (event, arg) => {
    sessionStorage.setItem('hostnameInfo', arg);
    location.href = 'login.html';
});


$('#frIPAddress').validator().on('submit', function (e) {
    
    if (!e.isDefaultPrevented()) {
        // everything looks good!
        var ipServer = $("#ipServer").val();
        // var ipMachine = $("#ipMachine").val(); , ipMachine: ipMachine
        var ips = { ipServer: ipServer };
        ipcRenderer.send('sendIPServer', JSON.stringify(ips));
        sessionStorage.setItem('IPServer', ipServer);
    }

    e.preventDefault();
});