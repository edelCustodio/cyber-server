let fullName = "";
var _arrClients = null;
var _input = null;
var _checkedObj = {};
var { ipcRenderer, remote } = require('electron');
const path = require('path'); 
const BrowserWindow = remote.BrowserWindow

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
        var message = { start: false, countDown: false, minutes: 0 };
        // Detener reloj contador
        var client = getDesktopClient();
    
        if (!$.isEmptyObject(client))
            client.sock.write(JSON.stringify(message));

        _input.prop("checked", false);
        changeColorDesktopIcon();

        //Guardar informacion de la maquina para su posterior cobro
        var desktops = JSON.parse(sessionStorage.getItem('desktops'));
        var desktop = Enumerable.from(desktops).where(w => w.nombre === getDesktopNameSelected()).firstOrDefault();
        saveDesktopToPurchase(desktop);
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
    }

    iCountDown.val('');
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

/**
 * obtener the toggle checkbox input 
 * @param {*Input o Desktop icon de la maquina seleccionada} element 
 */
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

/**
 * Canbiar color a la imagen de la computadora
 */
function changeColorDesktopIcon() {
    var desktopIcon = _input.parent().parent().parent().find("a > i.fa")
    if(_input.is(":checked"))
        desktopIcon.attr("style", "color: #4caf50");
    else
        desktopIcon.attr("style", "color: #ccc");
    
}

/**
 * Iniciar o detener el reloj contador para la computadora seleccionada
 */
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

/**
 * Obtener la maquina logueada en el servidor cuando el usuario desea iniciar el contador del tiempo
 * de la maquina seleccionada
 */
function getDesktopClient() {
    return getClient(getDesktopNameSelected());
}

function getDesktopNameSelected() {
    var idComputadora = parseInt(_input.attr('id').split('-')[1]);
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    var hostname = Enumerable.from(desktops).where(w => w.idComputadora === idComputadora).select(s => s.nombre).firstOrDefault();
    return hostname;
}

/**
 * Devuelve el cliente Socket de una maquina logueada en el servidor
 * @param {*Nombre de la maquina} hostname 
 */
function getClient(hostname) {
    var client = {};
    _arrClients = remote.getGlobal('clients');

    for (var i = 0; i < _arrClients.length; i++) {
        if (_arrClients[i].data.hostname === hostname) {
            client = _arrClients[i];
        }
    }
    // Retorma cliente socket
    return client;
}

//show add product modal and fill out the fields
$('#showAddProductModal').click(function () {
    // populate desktop dropdown
    fillDesktopDropdown();

    //populate dropdown product
    //getProducts(); 

    //show modal
    $('#addTicketItem').modal('show');
});

//Seleccionar computadora, comprobar si existen productos asociados a la computadora seleccionada
//si existe, mostrarlos en el grid
$('#sDesktops').change(function () {
    var idComputadora = parseInt($(this).val());
    createGridProduct(idComputadora);
});


/**
 * Evento del boton cerrar de la modal de agregar productos
 */
$('#btnCerrar').click(function () {
    cleanGridAndProductControls();
});

/**
 * Guardar la informacion de la maquina para su posterior cobro
 * @param {*Objeto de la maquina a cobrar} desktop 
 */
function saveDesktopToPurchase(desktop) {
    if (sessionStorage.getItem('desktopsToPurchase') !== null) {
        var desktopToPurchase = JSON.parse(sessionStorage.getItem('desktopsToPurchase'));
        var findDesktop = Enumerable.from(desktopToPurchase).where(w => w.nombre === desktop.nombre).firstOrDefault();
        if (findDesktop === undefined) {
            desktopToPurchase.push(desktop);
            sessionStorage.setItem('desktopsToPurchase', JSON.stringify(desktopToPurchase));
        }
    } else {
        sessionStorage.setItem('desktopsToPurchase', JSON.stringify([desktop]));
    }
}