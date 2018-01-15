let fullName = "";
var remote = require('electron').remote;
var _arrClients = null;
var _input = null;
var _checkedObj = {};


//document ready
$(document).ready(function () {
    drawDesktops();
})

function drawDesktops() {
    var allDesktops = "";
    
    $.get(apiURL + "/api/getComputers", function(data) {

        $(data).each(function(i, pc) {
            var template = $("#computadora-tmp").html();
            template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
            allDesktops += template;
        })

        $("#divComputadoras").append(allDesktops);

        $.get(apiURL + "/api/getDesktopsInUse", function (inUse) {

            $(inUse).each(function (i, pc) {
                $("#stCompu-" + pc.idComputadora).trigger("click");
            });

            console.log(inUse);
        });
        
        if (sessionStorage.getItem('desktops')  === null)
            sessionStorage.setItem('desktops', JSON.stringify(data));
        else {
            sessionStorage.removeItem('desktops');
            sessionStorage.setItem('desktops', JSON.stringify(data));
        }

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
    _checkedObj = {};
    _checkedObj = getCheckboxDesktop($this)
    _input = _checkedObj.input;

    if(_checkedObj.isChecked) {
        $("#startOrStopDesktop").modal();
    } else {

        var message = {
            start: false,
            countDown: false,
            minutes: 0
        }

        // Detener reloj contador
        var client = getDesktopClient();
    
        if (!$.isEmptyObject(client))
            client.sock.write(JSON.stringify(message));

        _input.prop("checked", false);
        changeColorDesktopIcon();
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

//obtener the toggle checkbox input 
function getCheckboxDesktop(element) {
    var input = null;
    var isChecked = false;
    if(element.hasClass("ci-avatar")) {
        input = element.parent().find("div.c-info input[type='checkbox']");
        if(!input.is(":checked")) {
            isChecked = true;
        }        
    } else {
        input = element;
    }

    return { input: input, isChecked: isChecked };
}

//Canbiar color a la imagen de la computadora
function changeColorDesktopIcon() {
    var desktopIcon = _input.parent().parent().parent().find("a > i.fa")
    if(_input.is(":checked"))
        desktopIcon.attr("style", "color: #4caf50");
    else
        desktopIcon.attr("style", "color: #ccc");
    
}

//Iniciar o detener el reloj contador para la computadora seleccionada
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

    if(_checkedObj.isChecked) {
        _input.prop("checked", true);
        start = true;
    }
        

    var message = {
        start: start,
        countDown: countDown,
        minutes: minutes
    }

    if (!$.isEmptyObject(client))
        client.sock.write(JSON.stringify(message));
}

//Obtener las maquinas logueadas en el servidor
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

//show add product modal and fill out the fields
$('#showAddProductModal').click(function () {
    
    var $sDesktops = $('#sDesktops');
    $sDesktops.empty();

    //fill out computadora select element
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    $sDesktops.append($("<option />").val('0').text('Seleccione una computadora'));
    $.each(desktops, function() {
        $sDesktops.append($("<option />").val(this.idComputadora).text(this.nombre));
    });

    //populate dropdown product
    getProducts(); 

    //show modal
    $('#addTicketItem').modal('show');
});

//Seleccionar computadora, comprobar si existen productos asociados a la computadora seleccionada
//si existe, mostrarlos en el grid
$('#sDesktops').change(function () {
    createGridProduct();
});

