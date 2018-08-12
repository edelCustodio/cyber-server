let fullName = "";

var _input = null;
var _checkedObj = {};
var { ipcRenderer, remote } = require('electron');
const path = require('path'); 
const BrowserWindow = remote.BrowserWindow

//document ready
$(document).ready(function () {
    getProducts();
    getTicketsPending();
    getDesktopsAvailables();
});



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
$(document).off("click", ".contacts input[type='checkbox'], a.ci-avatar")
    .on("click", ".contacts input[type='checkbox'], a.ci-avatar", function () {
    var $this = $(this);
    _checkedObj = {};
    _checkedObj = getCheckboxDesktop($this)
    _input = _checkedObj.input;
    var id = parseInt(_input.attr("id").split("-")[1]);
    var desktops = sessionStorage.getItem('desktops') !== null ? JSON.parse(sessionStorage.getItem('desktops')) : [];
    var desktop = Enumerable.from(desktops).where(w => w.idComputadora === id).firstOrDefault();

    if(_checkedObj.isChecked) {
        $("#startOrStopDesktop").modal();
        $('#cbCountDown').attr('checked', false);
        $('#sCountdown').attr('disabled', true);
    } else {
        alertExecuteFunction('Detener ' + desktop.nombre, 'Estas seguro que deseas detener el uso de esta computadora?', 'warning', detenerComputadora);
    }
});

/**
 * 
 */
function detenerComputadora() {
    var message = { start: false, countDown: false, minutes: 0 };
    // Detener reloj contador
    var client = getDesktopClient();

    if (!$.isEmptyObject(client))
        client.sock.write(JSON.stringify(message));

    _input.prop("checked", false);
    changeColorDesktopIcon();
}

//Iniciar el reloj en la maquina seleccionada
$(document).off('click', '#btnClockStart').on('click', '#btnClockStart', function () {

    startDesktop();

    changeColorDesktopIcon();

    //habilitar o deshabilitar el timepicker countdown
    var cbCountDown = $('#cbCountDown');
    var sCountdown = $('#sCountdown');

    if(!cbCountDown.is(':checked')) {
        sCountdown.attr('disabled', true);
    }

    sCountdown.val('0');
    $("#startOrStopDesktop").modal('toggle');
})

/**
 * ckeckbox para habilitar o deshabilitar el timepicker count down input
 */
$(document).off('click', '#cbCountDown').on('click', '#cbCountDown', function () {
    
    var cbCountDown = $('#cbCountDown');
    var sCountdown = $('#sCountdown');
    var btnClockStart = $('#btnClockStart');

    if(cbCountDown.is(':checked')) {
        sCountdown.removeAttr('disabled');
        
        btnClockStart.attr('disabled', true);
    } else {
        sCountdown.attr('disabled', true);
        btnClockStart.attr('disabled', false);
    }

    // valor por default del dropdown de tiempo 
    sCountdown.val('0');
});

/**
 * Si se selecciona tiempo fijo para el uso de la maquina, se tiene
 * que seleccionar el dropdown para elegir el tiempo deseado, el boton de iniciar
 * solo se habilitara cuando se halla seleccionado una opcion de tiempo valido
 */
$(document).off('change', '#sCountdown').on('change', '#sCountdown', function () {
    var select = $(this);

    var btnClockStart = $('#btnClockStart');
    if(select.val() !== '0') {
        btnClockStart.attr('disabled', false);
    } else {
        btnClockStart.attr('disabled', true);
    }
})

/**
 * obtener the toggle checkbox input 
 * @param {*} element Input o Desktop icon de la maquina seleccionada
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
 * Iniciar o detener el reloj contador para la computadora seleccionada
 */
function startDesktop() {
    
    var start = false;
    var cbCountDown = $('#cbCountDown');
    var sCountDown = $('#sCountdown');
    var countDown = false;
    var minutes = 0;
    var idComputadora = parseInt(_input.attr('id').split('-')[1]);
    var stCompu = $("#stCompu-" + idComputadora);
    var client = getDesktopClient();
    
    if(cbCountDown.is(':checked')) {
        countDown = true;
        minutes = parseInt(sCountDown.val());
    }

    if(_checkedObj.isChecked) {
        _input.prop("checked", true);
        start = true;
    }

    const usuario = JSON.parse(sessionStorage.getItem('userLoggedIn'));
    const jwt = parseJwt(sessionStorage.token);
    const idUsuario = parseInt(jwt.nameid);

    var message = {
        start: start,
        countDown: countDown,
        minutes: minutes,
        idUsuario: idUsuario 
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

/**
 * Obtener el nombre de la computadora seleccionada
 */
function getDesktopNameSelected() {
    var idComputadora = parseInt(_input.attr('id').split('-')[1]);
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    var hostname = Enumerable.from(desktops).where(w => w.idComputadora === idComputadora).select(s => s.nombre).firstOrDefault();
    return hostname;
}



//show add product modal and fill out the fields
$('#showAddProductModal').click(function () {
    const isUsed = validateDesktopInUse();
    if(isUsed) {
        // populate desktop dropdown
        fillDesktopDropdown();
        //show modal
        $('#addTicketItem').modal('show');
    } else {
        notify('top', 'right', 'fa fa-comments', 'warning', 'Agregar productos, ', 'solo se puede agregar productos a computadoras en uso');
    }
});

/**
 * Validar si hay por lo menos un solo registro que indique
 * que una computadora esta en uso
 */
function validateDesktopInUse() {
    let isUsed = false;
    if (_recordsNoPay.length > 0) {
        _recordsNoPay.forEach(r => {
            if (r.fechaFin === null) {
                isUsed = true;
                return false;
            }
        });
    }

    return isUsed;
}

//Seleccionar computadora, comprobar si existen productos asociados a la computadora seleccionada
//si existe, mostrarlos en el grid
$('#sDesktops').change(function () {
    _idComputadora = parseInt($(this).val());
    if (_idComputadora > 0) {
        let ticket = null;
        const rec = Enumerable.from(_recordsNoPay).where(w => w.idComputadora === _idComputadora && w.fechaFin === null).firstOrDefault();
        if (rec !== null) {
            if (_tickets.length > 0) {
                ticket = Enumerable.from(_tickets).where(w => w.idRegistro === rec.idRegistro).firstOrDefault();
            }
        }

        if (ticket !== null) {
            _idTicket = ticket.idTicket;
            mostrarProductosEnGrid(ticket);
        }
        
    }
});


/**
 * Evento del boton cerrar de la modal de agregar productos
 */
$('#btnCerrar').click(function () {
    cleanGridAndProductControls();
});

/**
 * Obtiene las computadoras disponibles
 */
function getDesktopsAvailables() {
    ajaxHelper.get(apiURL + '/api/Desktop/getComputers', function (data, textStatus, jqXHR){
        drawDesktops(data);
        getRecordsNoPay(setGreenDesktopsUsed);
    }, errorAjaxHandler);
}