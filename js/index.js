

let apiURL = "http://localhost:6868";
let fullName = "";
var remote = require('electron').remote;
var _arrClients = null;
var _input = null;

//document ready
$(document).ready(function () {
    drawDesktops();
})

function drawDesktops() {
    var allDesktops = "";
    
    $.get(apiURL + "/getComputers", function(data) {

        $(data).each(function(i, pc) {
            var template = $("#computadora-tmp").html();
            template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
            allDesktops += template;
        })

        $("#divComputadoras").append(allDesktops);

        $.get(apiURL + "/getDesktopsInUse", function (inUse) {

            $(inUse).each(function (i, pc) {
                $("#stCompu-" + pc.idComputadora).trigger("click");
            });

            console.log(inUse);
        });
        
        console.log(data);
    });
}

$(window).load(function () {
    
    function notifyLogin(message, type){
        $.growl({
            message: message
        },{
            type: type,
            allow_dismiss: false,
            label: 'Cancel',
            className: 'btn-xs btn-inverse',
            placement: {
                from: 'bottom',
                align: 'right'
            },
            delay: 2500,
            animate: {
                    enter: 'animated fadeInRight',
                    exit: 'animated fadeOutRight'
            },
            offset: {
                x: 30,
                y: 30
            }
        });
    };

    if (!$('.login-content')[0]) {
        
        if(sessionStorage.getItem("userLoggedIn") !== null) {
            var userInfo = JSON.parse(sessionStorage.getItem("userLoggedIn"));
            fullName = userInfo.nombreCompleto
        }
        notifyLogin('Hola de nuevo ' + fullName, 'inverse');
    }
});

/**
 * Event to turn on/off the desktop
 */
$(document).off("click", ".contacts input[type='checkbox'], a.ci-avatar").on("click", ".contacts input[type='checkbox'], a.ci-avatar", function () {
    var $this = $(this);
    _input = getCheckboxDesktop($this);

    if(_input.is(":checked")) {
        $("#startOrStopDesktop").modal();
    } else {
        // Detener reloj contador
        var client = getDesktopClient();
        changeColorDesktopIcon();

        var message = {
            start: false,
            countDown: false,
            minutes: 0
        }
    
        client.sock.write(JSON.stringify(message));
    }
    
    
});

//Iniciar el reloj en la maquina seleccionada
$(document).off('click', '#btnClockStart').on('click', '#btnClockStart', function () {

    startDesktop();

    changeColorDesktopIcon();

    //habilitar o deshabilitar el timepicker countdown
    var cbCountDown = $('#cbCountDown');
    var iCountDown = $('#iCountDown')

    if(!cbCountDown.is(':checked')) {
        iCountDown.attr('disabled', true);
        iCountDown.val('');
    }

    $("#startOrStopDesktop").modal('toggle');
})

// ckeckbox para habilitar o deshabilitar el timepicker count down input
$(document).off('click', '#cbCountDown').on('click', '#cbCountDown', function () {
    
    var cbCountDown = $('#cbCountDown');
    var iCountDown = $('#iCountDown')

    if(cbCountDown.is(':checked')) {
        iCountDown.removeAttr('disabled');
    } else {
        iCountDown.attr('disabled', true);
    }

})

function getCheckboxDesktop(element) {
    var input = null;
    if(element.hasClass("ci-avatar")) {
        input = element.parent().find("div.c-info input[type='checkbox']");
        if(input.is(":checked")) {
            input.prop("checked", false);
        }
        else {
            input.prop("checked", true);
        }        
    } else {
        input = element;
    }

    return input;
}

function changeColorDesktopIcon() {
    var desktopIcon = _input.parent().parent().parent().find("a > i.fa")
    if(_input.is(":checked"))
        desktopIcon.attr("style", "color: #4caf50");
    else
        desktopIcon.attr("style", "color: #ccc");
    
}

function startDesktop() {
    
    var start = false;
    var cbCountDown = $('#cbCountDown');
    var iCountDown = $('#iCountDown');
    var countDown = false;
    var minutes = 0;
    var idComputadora = parseInt(_input.attr('id').split('-')[1]);
    var stCompu = $("#stCompu-" + idComputadora);
    var client = getDesktopClient();
    
    if(cbCountDown.is(':checked')) {
        countDown = true;
        minutes = parseInt(iCountDown.val());
    }

    if(_input.is(':checked'))
        start = true;

    var message = {
        start: start,
        countDown: countDown,
        minutes: minutes
    }

    client.sock.write(JSON.stringify(message));
}

function getDesktopClient() {
    var client = {};
    
    _arrClients = remote.getGlobal('clients');
    var idComputadora = parseInt(_input.attr('id').split('-')[1]);

    for (var i = 0; i < _arrClients.length; i++) {
        if (_arrClients[i].data.idComputadora === idComputadora) {
            client = _arrClients[i];
        }
    }

    return client;
}