const swal = require('sweetalert2')
let apiURL = '';
window.$ = window.jQuery = require('../libs/js/jquery.min.js');
const Enumerable = require('linq');
require('bootstrap-validator')
require('../libs/js/jquery.mCustomScrollbar')
var { ipcRenderer, remote } = require('electron');
var _newTicket = false;
var _idComputadora = 0;
var _idRegistro = 0;
var _arrClients = [];
var moment = require('moment');
var _tickets = [];
var _ticket = {};
var _recordsNoPay = [];
var _idTicket = 0;
var port = 8080; // 8080 51990


/*--------------------------------------
    Notifications & Dialogs
---------------------------------------*/
/*
* Notifications
*/
function notify(from, align, icon, type, title, message) {
    $.growl({
        icon: icon,
        title: title,
        message: message,
        url: ''
    },{
        element: 'body',
        type: type,
        allow_dismiss: true,
        placement: {
            from: from,
            align: align
        },
        offset: {
            x: 30,
            y: 30
        },
        spacing: 10,
        z_index: 1031,
        delay: 2500,
        timer: 1000,
        url_target: '_blank',
        mouse_over: false,
        icon_type: 'class',
        template: '<div data-growl="container" class="alert" role="alert">' +
        '<button type="button" class="close" data-growl="dismiss">' +
        '<span aria-hidden="true">&times;</span>' +
        '<span class="sr-only">Close</span>' +
        '</button>' +
        '<span data-growl="icon"></span>' +
        '<span data-growl="title"></span>' +
        '<span data-growl="message"></span>' +
        '<a href="#" data-growl="url"></a>' +
        '</div>'
    });
};

/**
 * Alerts
 */

function alertNotify(title, text, type) {
    swal({
        title: title,
        text: text,
        type: type,
        confirmButtonText: 'Ok'
    })
}

function alertExecuteFunction(title, text, type, functionHandle) {
    swal({
        title: title,
        text: text,
        type: type,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ok'
    }).then((result) => {
        if (result.value) {
            functionHandle();
        }
    });
}

$(document).ready(function () {
    
    if (sessionStorage.getItem('IPServer') !== null) {
        apiURL = 'http://' + sessionStorage.getItem('IPServer') + ':' + port + '/';
        // apiURL = 'http://localhost:' + port + '/';
    } else {
        ipcRenderer.send('goForIPServer', 1);
    }
    _arrClients = remote.getGlobal('clients');
});

/**
 * Listen for async message from renderer process
 */
ipcRenderer.on('getForIPServer', (event, arg) => {  
    var ips = JSON.parse(arg);
    sessionStorage.setItem('IPServer', ips.ipServer);
    apiURL = 'http://' + ips.ipServer + ':' + port + '/';
    // apiURL = 'http://localhost:' + port + '/';
    sessionStorage.setItem('IPServer', ips.ipServer);
});

/**
 * Mostrar las computadoras activas
 */
function drawDesktops(desktops) {
    
    _arrClients = remote.getGlobal('clients');

    if (desktops.length === 0 && _arrClients.length > 0) {
        _arrClients.forEach(cl => {
            getDesktopByName(cl);
        });
    } else {
        showDesktops(desktops);
    }    
}

function showDesktops(desktops) {
    var allDesktops = "";
    // recorrer las maquinas que estan en linea en base de datos
    const maquinasOrdenadas = Enumerable.from(desktops).orderBy(o => o.nombre).toArray(); 
    $("#divComputadoras").empty();

    maquinasOrdenadas.forEach(pc => {
        // comparar contra las maquinas que realmente tienen comunicacion
        // con la maquina de cobro
        if (_arrClients && _arrClients.length > 0) {
            _arrClients.forEach(cl => {
                // var hostname = cl.data.hostname;
                if (cl.data.hostname && cl.data.hostname.includes(pc.nombre)) {
                    var template = $("#computadora-tmp").html();
                    template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
                    // allDesktops += template;
                    $("#divComputadoras").append(template);
                }
            });
        }
    });

    sessionStorage.setItem('desktops', JSON.stringify(desktops));
}

/**
 * Codigo para agregar producto al ticket
 */

 /**
 * Once the dropdown is changed, this event is fired to populate the price
 */
$('#sProductos').change(function () {
    var sProductos = $(this);

    if (sProductos.val() === '0') {
        return;
    }

    if(_idComputadora === 0 && location.href.includes('index.html')) {
        //sweet alert
        alertNotify('Ups!', 'Por favor, seleccione una computadora', 'warning');
        //  chosen-default
        $('.chosen-single').addClass('chosen-default');
        $('.chosen-single span').html('Seleccione un producto...');
        sProductos.val(0);
    }

    if (_idTicket > 0 || location.href.includes('index.html')) {
        var sProductos = $(this);
        $("#iCantidad").val('');
        $('#iTotal').val('');
        var iPrecio = $('#iPrecio');
        
        // obtener producto
        var producto = getProductSelected(parseInt(sProductos.val()));

        if(producto.precio === 0) {
            iPrecio.removeAttr('disabled');
        } else {
            iPrecio.attr('disabled', true);
            //set precio
            iPrecio.val(producto.precio);
        }
    } else {
        if (location.href.includes('punto-venta.html')) {
            //sweet alert
            alertNotify('Ups!', 'Por favor, seleccione un ticket para poder agregar un producto.', 'warning');
            //  chosen-default
            $('.chosen-single').addClass('chosen-default');
            $('.chosen-single span').html('Seleccione un producto...');
            sProductos.val(0);
        }
    }

});

/**
 * hacer calculo de total en tiempo real cantidad * precio
 */
$( "#iCantidad" ).keyup(function() {

    var idProducto = parseInt($('#sProductos').val());
    var producto = getProductSelected(idProducto);

    if (producto.precio > 0) {
        if (idProducto > 0) {
            var cantidad = parseInt($("#iCantidad").val()); //get the value of input

            if (cantidad > 0) {
                var precio = parseFloat($('#iPrecio').val());
                var total = 0;
                
                if (cantidad <= producto.cantidad) {    
                    total = cantidad * precio;
                    $('#iTotal').val(total);      
                } else {
                    alertNotify('Ups!', 'La cantidad debe de ser menor o igual que lo disponible.', 'warning');  
                }
                
                $('#btnAgregarProducto').removeAttr('disabled');
            } else {
                $('#btnAgregarProducto').attr('disabled', true);
            }
        } else {
            alertNotify('Ups!', 'Por favor, seleccione un producto', 'warning');
        }
    }
});

/**
 * Existen productos que se les puede agregar el precio
 * a criterio del usuario, y aqui se hace el calculo del
 * total
 */
$('#iPrecio').keyup(function() {
    var precio = parseFloat($(this).val());
    var idProducto = parseInt($('#sProductos').val());
    var producto = getProductSelected(idProducto);
    var cantidad = $("#iCantidad").val();

    if (producto.precio === 0) {
        if (precio > 0) {
            var total = parseInt(cantidad) * parseFloat(precio);
            $('#iTotal').val(total);
            $('#btnAgregarProducto').removeAttr('disabled');
        } else {
            $('#btnAgregarProducto').attr('disabled', true);
        }
    }
});

/**
 * Obtener producto desde sessionStorage
 * @param {*} idProducto 
 */
function getProductSelected(idProducto) {
    var productos = JSON.parse(sessionStorage.getItem('products'));
    
    var producto = Enumerable.from(productos).where(w => w.idProducto === idProducto).firstOrDefault();

    return producto;
}

/**
 * Obtener productos desde base de datos
 */
function getProducts() {
    var $sProducts = $('#sProductos');
    $sProducts.empty();

    // var getProductsURL = apiURL + "/api/getProducts";
    var getProductsURL = apiURL + "/api/Product/getProducts";
     //get products
     ajaxHelper.get(getProductsURL, function(data) {
        var products = data;
        $sProducts.append($("<option />").val(0).text('Seleccione un producto...'));
        $.each(products, function() {
            if(this.idProducto > 1)
                $sProducts.append($("<option />").val(this.idProducto).text(this.nombre));
        });

        sessionStorage.setItem('products', JSON.stringify(products));

        if($('.chosen')[0]) {
            $('.chosen').chosen({
                width: '100%'
            });
        }
    
        $('.chosen-single').css('text-transform', 'none');
    }, errorAjaxHandler);

    
}

/**
 * Obtener los tickets pendientes por pagar
 */
function getTicketsPending(showGrid = false, showList = false) {
    var ticketsPendingURL = apiURL + "api/Ticket/getTicketsPending";
     ajaxHelper.get(ticketsPendingURL, function (response) {
        if (response) {
            _tickets = response;

            if (showGrid) {
                const ticket = Enumerable.from(_tickets).where(w => w.idTicket === _idTicket).firstOrDefault();
                mostrarProductosEnGrid(ticket);
            }

            if (showList && location.href.includes('punto-venta.html')) {
                fillComputerList();
            }
        }
    }, errorAjaxHandler);
}

/**
 * Obtener los tickets pendientes por pagar
 */
function getRecordsNoPay(callbackAfterResponse = undefined) {
    // var recordsNoPaid = apiURL + "/api/getRecordsNoPay";
    var recordsNoPaid = apiURL + "api/Record/getRecordsNoPay";
    ajaxHelper.get(recordsNoPaid, function(response) {
        if (response) {
            _recordsNoPay = response;

            if (location.href.includes('punto-venta.html')) {
                getTicketsPending(false, true);
            }

            if (callbackAfterResponse){
                callbackAfterResponse();
            }
        }
   }, errorAjaxHandler);
}

/**
 * Llenar el dropdown de productos en el modulo
 * de agregar producto al ticket
 */
function fillDesktopDropdown() {
    var $sDesktops = $('#sDesktops');
    $sDesktops.empty();
    //fill out computadora select element
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));

    if (_recordsNoPay.length > 0) {
        $sDesktops.append($("<option />").val(0).text('Seleccione una computadora'));
        $.each(_recordsNoPay.filter(w => w.fechaFin === null), function(i, r) {
            var recordTime = moment(r.fechaInicio);
            var desktop = Enumerable.from(desktops).where(w => w.idComputadora === r.idComputadora).firstOrDefault();
            $sDesktops.append($("<option />").val(desktop.idComputadora).text(desktop.nombre + ' - ' + recordTime.format('DD/MM/YYYY h:mm A')));
        });
    }
}


/**
 * Add product to the ticket
 */
$('#btnAgregarProducto').click(function () {
    
    var idProducto = $('#sProductos').val();
    
    if(idProducto == 0) {
        alertNotify('Ups!', 'Por favor, seleccione un producto', 'warning');
        return;
    }

    alertExecuteFunction('Agregar producto', 'Desea agregar el producto?', 'warning', addProductToTicket);
});

/**
 * eliminar registro del ticket, esto solo hace un borrado logico
 * en la base de datos
 */
$(document).off('click', 'button[id^="delete"]').on('click', 'button[id^="delete"]', function () {
    
    var btn = $(this);
    var tr = btn.parent().parent();
    var idTicketDetalle = parseInt(btn.attr('id').split('-')[1]);
    
    swal({
        title: 'Eliminar producto',
        text: 'Desea eliminar el producto?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ok'
    }).then((result) => {
        if (result.value) {
            eliminarTicketDetalle(idTicketDetalle);
        }
    });
});

/**
 * Agregar productos al ticket con la computadora seleccionada
 */
function addProductToTicket() {

    var idProducto = parseInt($('#sProductos').val());
    var nombre = $('#sProductos option:selected').text();
    var cantidad = parseInt($('#iCantidad').val());
    var precio = parseFloat($('#iPrecio').val());
    var total = parseFloat($('#iTotal').val());
    if (_idComputadora === 0) {
        _idComputadora = $('#sDesktops').val() !== undefined ? parseInt($('#sDesktops').val()) : _idComputadora;
    }

    const ticket = Enumerable.from(_tickets).where(w => w.idTicket === _idTicket).firstOrDefault();
    const found = Enumerable.from(ticket.Detalle).where(w => w.idProducto === idProducto).firstOrDefault();

    // Insertar nuevo registro
    if (found === null) {
        var producto = getProductSelected(idProducto);

        // detalle del ticket
        var ticketDetalle = {
            idTicket: ticket.idTicket,
            idProducto: idProducto,
            cantidad: cantidad,
            precio: producto.precio === 0 ? precio : null
        }

        // insertar registro del detalle del ticket
        insertTicketDetalle(ticketDetalle);
    } else {
        // actualizar registro existente
        actualizarTicketDetalle(found.idTicketDetalle, cantidad);
    }
    
    // muestra el nombre del ticket
    mostrarNombreTicket(ticket);
    
    // clean controls
    $('#iCantidad').val('');
    $('#iPrecio').val('');
    $('#iTotal').val('');
    
    // dropdown product
    $('.chosen-single').addClass('chosen-default');
    $('.chosen-single span').html('Seleccione un producto...');
    $('#sProductos').val(0);
    $('#btnAgregarProducto').attr('disabled', true);
}

/**
 * Mostrar nombre en el grid del detalle del ticket
 * @param {*} ticket ticket que sera mostrado
 */
function mostrarNombreTicket(ticket) {
    // colocar titulo al grid
    var ticketTitle = '';
    if (ticket.idRegistro !== null) {
        var desktops = JSON.parse(sessionStorage.getItem('desktops'));
        var record = Enumerable.from(_recordsNoPay).where(w => w.idRegistro === ticket.idRegistro).firstOrDefault();
        if (record !== null) {
            var desktopName = Enumerable.from(desktops).where(w => w.idComputadora === record.idComputadora).select(s => s.nombre).firstOrDefault();
            var recordTime = moment(record.fechaInicio);
            if (desktopName === null) {
                desktopName = 'Ticket No. ' + _idTicket;
            }
            ticketTitle = desktopName  + ', ' + recordTime.format('DD/MM/YYYY h:mm A');
        } else {
            const fecha = moment(ticket.fecha);
            ticketTitle = 'Ticket No. ' + _idTicket + ', ' + fecha.format('DD/MM/YYYY h:mm A');
        }        
    } else {
        const fecha = moment(ticket.fecha);
        ticketTitle = 'Ticket No. ' + _idTicket + ', ' + fecha.format('DD/MM/YYYY h:mm A');
    }

    // mostrar titulo arriba del grid de los productos
    $('#hDesktopName').html(ticketTitle);
}


/**
 * Construye el grid para los tickets que no estan asociados
 * a una maquina en uso
 * @param {*} ticket Arreglo detalle del ticket
 */
function mostrarProductosEnGrid(ticket) {
    $('#tbListProducts').empty();

    var gridProduct = '';
    const productos = JSON.parse(sessionStorage.getItem('products'));
    var totalTicket = 0;
    var tieneRentaEquipo = false;
    if (ticket !== null) {
        $.each(ticket.Detalle, function (i, d) {
            var rowTemplate = $('#trRowGridTicket').html();
            const producto = Enumerable.from(productos).where(w => w.idProducto === d.idProducto).firstOrDefault();
            let total = 0;
            if (_recordsNoPay.length > 0 && ticket.idRegistro !== null) {
                if (d.idProducto === 1360) {
                    const record = Enumerable.from(_recordsNoPay).where(w => w.idRegistro === ticket.idRegistro).firstOrDefault();
                    if (record !== null) {
                        total = record.totalPagar === null ? 0 : record.totalPagar;
                        rowTemplate = rowTemplate.replace('{precio}', total);
                        tieneRentaEquipo = true;
                        idTicketDetalle = d.idTicketDetalle;
                    } else {
                        if(producto.precio === 0) {
                            total = d.precio * d.cantidad;
                            rowTemplate = rowTemplate.replace('{precio}', d.precio);
                        } else {
                            total = producto.precio * d.cantidad;
                            rowTemplate = rowTemplate.replace('{precio}', producto.precio);
                        }
                    }
                } else {
                    if(producto.precio === 0) {
                        total = d.precio * d.cantidad;
                        rowTemplate = rowTemplate.replace('{precio}', d.precio);
                    } else {
                        total = producto.precio * d.cantidad;
                        rowTemplate = rowTemplate.replace('{precio}', producto.precio);
                    }
                }
            } else {
                if(producto.precio === 0) {
                    total = d.precio * d.cantidad;
                    rowTemplate = rowTemplate.replace('{precio}', d.precio);
                } else {
                    total = producto.precio * d.cantidad;
                    rowTemplate = rowTemplate.replace('{precio}', producto.precio);
                }
            }

            rowTemplate = rowTemplate.replace('{idTicketDetalle}', d.idTicketDetalle);
            rowTemplate = rowTemplate.replace('{contador}', i + 1);
            rowTemplate = rowTemplate.replace('{nombre}', producto.nombre);
            
            rowTemplate = rowTemplate.replace('{cantidad}', d.cantidad);
            rowTemplate = rowTemplate.replace('{total}', total);
            totalTicket = totalTicket + total;
            gridProduct += rowTemplate;
        });
    
        var rowTotal = $('#trRowGridTicketTotal').html();
        rowTotal = rowTotal.replace('{Total}', totalTicket);
        gridProduct += rowTotal;
    
        $('#tbListProducts').append(gridProduct);
    
        // eliminar boton de borrar para los registros
        // de renta de equipo
        if (tieneRentaEquipo) {
            $('button[id="delete-'+ idTicketDetalle +'"]').remove();
        }
    }
}

/**
 * Crear la lista de computadoras pendientes por cobrar
 */
function fillComputerList() {
    var computerList = $('#computerList');
    
    computerList.empty();
    $.each(Enumerable.from(_tickets).orderByDescending(o => new Date(o.fecha)).toArray(), function (i, tick) {
        var itemComputerListTemplate = $('#itemComputerList').html();
        itemComputerListTemplate = itemComputerListTemplate.replace('{idTicket}', tick.idTicket);
        itemComputerListTemplate = itemComputerListTemplate.replace('{idTicket}', tick.idTicket);
        
        if (tick.idRegistro !== null) {
            const record = Enumerable.from(_recordsNoPay).where(w => w.idRegistro === tick.idRegistro).firstOrDefault();
            if (record != null && record.fechaFin !== null) {
                var name = getDesktopName(record.idComputadora);
                if (name === '') {
                    name = 'Ticket No. ' + tick.idTicket;
                }
                itemComputerListTemplate = itemComputerListTemplate.replace('{computerName}', name);
                const startTime = moment(record.fechaInicio);
                itemComputerListTemplate = itemComputerListTemplate.replace('{hora}', startTime.format('DD/MM/YYYY h:mm A'));
            } 
            else {
                itemComputerListTemplate = '';
            }
            // else {
            //     // Esto no debe de pasar
            //     itemComputerListTemplate = itemComputerListTemplate.replace('{computerName}', 'Ticket No. ' + tick.idTicket);
            //     const startTime = moment(tick.fecha);
            //     itemComputerListTemplate = itemComputerListTemplate.replace('{hora}', startTime.format('DD/MM/YYYY h:mm A'));
            // }
        } else {
            itemComputerListTemplate = itemComputerListTemplate.replace('{computerName}', 'Ticket No. ' + tick.idTicket);
            const startTime = moment(tick.fecha);
            itemComputerListTemplate = itemComputerListTemplate.replace('{hora}', startTime.format('DD/MM/YYYY h:mm A'));
        }
        
        itemComputerListTemplate = itemComputerListTemplate.replace('{products}',  tick.Detalle.length + (tick.Detalle.length === 1 ? ' producto' : ' productos'));

        computerList.append(itemComputerListTemplate);
    });
}


/**
 * Crear ticket
 * @param {*} ticket 
 */
function crearTicket(ticket) {
    var createTicketURL = apiURL + 'api/Ticket/createTicket';
    ajaxHelper.post(createTicketURL, ticket, function (data) {
        if (data) {
            // Obtener tickets pendientes por cobrar
            getTicketsPending(true, true);

            _idTicket = data.idTicket;
        }
    }, errorAjaxHandler);
}

/**
 * Insertar detalle del ticket
 * @param {*} ticketDetalle objeto del registro que sera insertado
 */
function insertTicketDetalle(ticketDetalle) {
    const insert = buildTicketDetailInsert(ticketDetalle);
    var insertTicketDetalleURL = apiURL + 'api/Ticket/createTicketDetalle';
    ajaxHelper.post(insertTicketDetalleURL, { strInsert: insert }, function(data) {
        if (data) {
            getTicketsPending(true, true);
        }
    }, errorAjaxHandler);
}

/**
 * Insertar detalle del ticket
 * @param {*} ticketDetalle objeto del registro que sera insertado
 */
function actualizarTicketDetalle(idTicketDetalle, cantidad, precio = null) {
    var actualizarTicketDetalleURL = apiURL + 'api/Ticket/updateTicketDetalle';
    const tDetalle = { idTicketDetalle: idTicketDetalle, cantidad: cantidad, precio: precio };
    ajaxHelper.post(actualizarTicketDetalleURL, tDetalle, function(data) {
        if (data) {
            getTicketsPending(true, true);
        }
    }, errorAjaxHandler);
}


/**
 * Eliminado logico de la tabla ticketDetalle, solo
 * actualiza el campo eliminado a 1
 * @param {*} idTicketDetalle IdTicketDetalle
 */
function eliminarTicketDetalle(idTicketDetalle) {
    ajaxHelper.post(apiURL + 'api/Ticket/deleteTicketDetalle', { idTicketDetalle: idTicketDetalle }, function(data) {
        if (data) {
            getTicketsPending(true, true);
            // mensaje de elimar producto
            notify('top', 'right', 'fa fa-comments', 'success', ' Producto eliminado, ', 'el producto fue eliminado satisfactoriamente.');
        }
    }, errorAjaxHandler);
}

/**
 * Eliminado logico de la tabla ticketDetalle, solo
 * actualiza el campo eliminado a 1
 * @param {*} idTicketDetalle IdTicketDetalle
 */
function eliminarTicket(idTicket) {
    ajaxHelper.post(apiURL + 'api/Ticket/deleteTicket', { idTicket: idTicket }, function(data) {
        if (data) {
            getTicketsPending(true, true);

            notify('top', 'right', 'fa fa-comments', 'success', ' Ticket eliminado, ', 'el ticket fue eliminado satisfactoriamente.');
        }
    }, errorAjaxHandler);
}

/**
 * Construye el insert para el detalle del ticket
 * @param {array} ticketDetalle objeto del registro que sera insertado
 */
function buildTicketDetailInsert(ticketDetalle) {
    if (ticketDetalle.precio === null) {
        return `INSERT INTO Entidad.TicketDetalle (idTicket, idProducto, cantidad) 
                        VALUES (` + ticketDetalle.idTicket + `, ` + ticketDetalle.idProducto + `, ` + ticketDetalle.cantidad + `)`;
    } else {
        return `INSERT INTO Entidad.TicketDetalle (idTicket, idProducto, cantidad, precio) 
                        VALUES (` + ticketDetalle.idTicket + `, ` + ticketDetalle.idProducto + `, ` + ticketDetalle.cantidad + `, ` + ticketDetalle.precio + `)`;
    }
}


/**
 * Crea un nuevo ticket para venta en mostrador
 */
function crearNuevoTicket(idRegistro = 0, limpiarGrid = true) {
    if (limpiarGrid) {
        cleanGridAndProductControls();
    }    
    
    const jwt = parseJwt(sessionStorage.token);
    const idUsuario = parseInt(jwt.nameid);

    let ticket = {
        total: 0,
        pago: 0,
        cambio: 0,
        idRegistro: idRegistro,
        idUsuario: idUsuario
    }

    // crear nuevo ticket
    crearTicket(ticket);

    // Actualizar/limpiar valores
    if (location.href.includes('punto-venta.html')) {
        quitarSeleccionLista();
    }     
}

/**
 * Suma el total del productos para un ticket de venta independiente
 */
function sumTotalSaleTicket(total) {
    if ($('#gridTotal').html()) {
        $('#gridTotal').remove();
    }

    var rowTotal = $('#trRowGridTicketTotal').html();
    rowTotal = rowTotal.replace('{Total}', total);
    return rowTotal;
}

/**
 * limpiar todos los controles del grid
 */
function cleanGridAndProductControls() {
    // Limpiar el grid
    $('#sDesktops').val(0);
    $('#tbListProducts').empty();
    $('#iCantidad').val('');
    $('#iPrecio').val('');
    $('#iTotal').val('');
    $('#iPago').val('');
    $('#iCambio').val('');
    $('#hDesktopName').html('');
    
    // dropdown product
    $('.chosen-single').addClass('chosen-default');
    $('.chosen-single span').html('Seleccione un producto...');
    $('#sProductos').val(0)

    // close the modal
    $('#addTicketItem').modal('toggle');
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
 * Poner en color verde las computadoras que estan siendo usadas
 * con respecto a los registros no pagados de las maquinas y que
 * la fecha de fin sea nula
 */
function setGreenDesktopsUsed() {
    if(_recordsNoPay && _recordsNoPay.length > 0) {
        _recordsNoPay.forEach(d => {
            if (d.fechaFin === null) {
                _input = $('#stCompu-'+ d.idComputadora);
                _input.prop("checked", true);
                changeColorDesktopIcon();
                const desktop = getDesktopInfoByIdFromStorage(d.idComputadora);
                if (desktop !== null && desktop !== undefined) {
                    var client = getClient(desktop.nombre);
                    if (!$.isEmptyObject(client)) {
                        var j = { init: true, record: d };
                        client.sock.write(JSON.stringify(j));
                    }
                }                    
            }
        });
    }
}

/**
 * Obtener el nombre de una computadora por id
 * @param {*} idComputadora id de la computadora
 */
function getDesktopName(idComputadora) {
    if (sessionStorage.getItem('desktops') !== null) {
        const desktops = JSON.parse(sessionStorage.getItem('desktops'));
        const desktop = Enumerable.from(desktops).where(w => w.idComputadora === idComputadora).firstOrDefault();
        return desktop !== null ? desktop.nombre : '';
    }
    return '';
}

/**
 * Cerrar sesion
 */
$('#logout').click(function () {
    const userInfo = JSON.parse(sessionStorage.getItem('userLoggedIn'));
    $.post(apiURL + 'api/logout', { idSesion: userInfo.idSesion }, function(data) {
        if(data.result) {
            const ipServer = sessionStorage.getItem('IPServer');
            sessionStorage.clear();
            sessionStorage.setItem('IPServer', ipServer);
            document.location.href = "login.html";
        }
    })
});

/**
 * *********************************************************************
 * *********************************************************************
 * *********************************************************************
 * *********************************************************************
 * *********************************************************************
 */

/**
 * Evento que se ejecuta cuando el tiempo de alguna maquina se agota
 */
ipcRenderer.on('time-off', (event, arg) => {
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    var desktop = Enumerable.from(desktops).where(w => w.nombre === arg).firstOrDefault();
    _input = $('#stCompu-' + desktop.idComputadora);
    _input.prop("checked", false);
    changeColorDesktopIcon();

    /*
    const modalPath = path.join('file://', __dirname, '/modal.html')
    let win = new BrowserWindow({ width: 400, height: 320 })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.show();
    win.webContents.send('message', JSON.stringify(desktop));
    */
});

/**
 * Cuando alguna maquina cliente pierde conexion
 * necesitamos actualizar su estado en la base de datos
 * y quitarlo del array de sockets que tenemos en la 
 * maquina de cobro
 */
ipcRenderer.on('clientClosed', (event, arg) => {
    // ip de maquina desconectada
    const ipClient = arg;
    
    if (_arrClients && _arrClients.length > 0) {
        // recorrer arreglo de sockets
        _arrClients.forEach(cli => {
            // si la IP coincide, proceder con la actualizacion en BD
            if (ipClient.includes(cli.data.IP)) {
                // obtener objeto de la maquina a desconectar
                var desktop = getDesktopInfoByNameFromStorage(cli.data.hostname);

                if(desktop !== null && desktop.idComputadora) {
                    // valores para sacar de linea la maquina desconectada
                    var data = { idComputadora: desktop.idComputadora, enLinea: false };
                    setDesktopStatus(data);

                    // eliminar del arreglo de sockets la maquina desconectada
                    _arrClients = $.grep(_arrClients, function(r) {
                        return !ipClient.includes(r.data.IP);
                    });
                }
            }
        });
    }
});

/**
 * Actualizar el estado de una computadora, si ésta está
 * activa o no, y devuelve la lista de las computadoras activas
 * @param {*} data objeto para actualizar el estado de una computadora
 * por ejemplo: let d = { idComputadora: desktopInfo.idComputadora, enLinea: true };
 */
function setDesktopStatus(d) {
    var url = apiURL + 'api/Desktop/setDesktopOnline';

    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(d),
        contentType: "application/json",
        success: function (data, textStatus, jqXHR) {
            if (data) {
                console.log(data);
                showDesktops(data);
                setGreenDesktopsUsed();
            }
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

/**
 * Ajax call to get the desktop info data
 */
function getDesktopByName(client) {
    var desktop = {
        idComputadora: 0, 
        IP: client.sock.address().address,
        nombre: client.data.hostname,
        costoRenta: 0,
        enLinea: false
    }
    var url = apiURL + 'api/Desktop/getDesktopByName';
    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(desktop),
        contentType: "application/json",
        success: function (data, textStatus, jqXHR) {
            if (data) {
                let desktopInfo = data;
                setDesktopInfoToStorage(data);
                let d = { idComputadora: desktopInfo.idComputadora, enLinea: true };
                setDesktopStatus(d);
                // ipcRenderer.send('getSockets', desktopInfo);
                sendDesktopInfoFromSocket(desktopInfo);
            }
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

/**
 * Enviar el objeto computadora al cliente socket correspondiente
 * @param {*} desktopInfo Objeto que se enviara al cliente socket
 */
function sendDesktopInfoFromSocket(desktopInfo) {
    let client = getClient(desktopInfo.nombre);
    if (client) {        
        client.sock.write(JSON.stringify(desktopInfo));
    }
}

/**
 * Una vez que una maquina sea conectada, necesitamos mostrala
 * en el panel de control de las maquinas
 */
ipcRenderer.on('clientConnected', (event, arg) => {
    let cli = JSON.parse(arg);
    if(cli.connected) {
        _arrClients = remote.getGlobal('clients');
        _arrClients.forEach(cl => {
            if (cl.data.hostname === cli.hostname) {
                getDesktopByName(cl);
            }
        });
    }
});

/**
 * Actualiza en el Storage el objeto desktops
 * @param {*} desktop Objeto de la informacion de la computadora a actualizar
 */
function setDesktopInfoToStorage(desktop) {
    var desktops = [];
    if (sessionStorage.getItem('desktops') === null) {
        desktops.push(desktop);
    } else {
        var desktops = JSON.parse(sessionStorage.getItem('desktops'));
        desktops = $.grep(desktops, (e, i) => {
            return e.idComputadora !== desktop.idComputadora;
        });

        desktops.push(desktop);
    }

    if (desktops.length > 0) {
        sessionStorage.setItem('desktops', JSON.stringify(desktops));
        return desktops;
    } else {
        sessionStorage.removeItem('desktops');
        return null;
    }
}

/**
 * Obtiene el objeto computadora desde el local storage
 * @param {*} name nombre de la computadora
 */
function getDesktopInfoByNameFromStorage(name) {
    if (sessionStorage.getItem('desktops') !== null) {
        const desktops = JSON.parse(sessionStorage.getItem('desktops'));
        const desktopInfo = Enumerable.from(desktops).where(w => w.nombre === name).firstOrDefault();
        return desktopInfo;
    }

    return undefined;
}

function getDesktopInfoByIdFromStorage(id) {
    if (sessionStorage.getItem('desktops') !== null) {
        const desktops = JSON.parse(sessionStorage.getItem('desktops'));
        const desktopInfo = Enumerable.from(desktops).where(w => w.idComputadora === id).firstOrDefault();
        return desktopInfo;
    }

    return undefined;
}

ipcRenderer.on('sockets', (event, arg) => {  
    _arrClients = arg.clients;
    // mostrarComputadorasDisponibles();
});

/**
 * Devuelve el cliente Socket de una maquina logueada en el servidor
 * @param {*} hostname Nombre de la maquina 
 */
function getClient(hostname) {
    var client = {};
    _arrClients = remote.getGlobal('clients');
    // buscar maquina
    for (var i = 0; i < _arrClients.length; i++) {
        if (_arrClients[i].data.hostname === hostname) {
            client = _arrClients[i];
        }
    }
    // regresa socket de la maquina se esta buscando
    return client;
}

/**
 * 
 * @param {*} record 
 */
function setDesktopRecord(record) {

    var data = { idComputadora: record.idComputadora, fecha: record.fecha, minutos: record.minutos, idUsuario: record.idUsuario }
    ajaxHelper.post(apiURL + 'api/Record/desktopRecord', data, function(result) {
        console.log(result);
        getRecordsNoPay();
        getTicketsPending();
    }, errorAjaxHandler);
}

/**
 * Obtener el registro de uso de una computadora en especifico
 * @param {*} idRegistro id registro
 */
function getDesktopRecordById(idRegistro) {
    if (_recordsNoPay.length > 0) {
        const record = Enumerable.from(_recordsNoPay).where(w => w.idRegistro === idRegistro).firstOrDefault();
        return record;
    }

    return undefined;
}

/**
 * Obtener los registros del tiempo de uso de cada computadora 
 * y almacenarlo en el sessionStorage
 */
ipcRenderer.on('record', (event, arg) => {
    var records = [];
    var record = JSON.parse(arg);

    setDesktopRecord(record);    
});

/**
 * Solicita la informacion del nombre de la maquina
 */
ipcRenderer.on('requestDesktopInfo', (event, arg) => {
    const desktop = getDesktopInfoByNameFromStorage(arg);
    if (desktop !== null && desktop !== undefined) {
        var client = getClient(desktop.nombre);
        if (!$.isEmptyObject(client)) {
            client.sock.write(JSON.stringify(desktop));
        }
    }
});

/**
 * Comunicacion entre el cliente y la maquina de cobro para
 * solicitar informacion de los registros de uso, 
 */
ipcRenderer.on('requestDesktopRecord', (event, arg) => {
    const desktop = getDesktopInfoByNameFromStorage(arg);
    const record = Enumerable.from(_recordsNoPay).where(w => w.idComputadora === desktop.idComputadora && w.fechaFin === null).firstOrDefault();
    var client = getClient(desktop.nombre);
    var j = { init: true, record: record };
    client.sock.write(JSON.stringify(j));
});


function lockDesktop() {
    var client = _arrClients[0];
    client.sock.write(JSON.stringify({ window: { lock: true } }));
}





/**         AJAX CALLS
 * --------------------------------------------------------------
 * --------------------------------------------------------------
 * --------------------------------------------------------------
 * --------------------------------------------------------------
 */

/**
 * 
 * @param {*} data Error data
 * @param {*} textStatus text status
 * @param {*} jqXHR http response
 */
function errorAjaxHandler(data, textStatus, jqXHR) {
    console.log('Data: ');
    console.log(data);
    console.log('\n status: ' + textStatus + '\n xhr: ' + jqXHR);
}

function httpHeaders() {
    return { "Authorization": sessionStorage.getItem('token') };
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
};

var ajaxHelper = {
    get: function(url, fnSuccess, fnError) {
        $.ajax({
            url: url,
            type: "GET",
            contentType: "application/json",
            headers: httpHeaders(),
            success: function (data, textStatus, jqXHR) { fnSuccess(data, textStatus, jqXHR); },
            error: function (data, textStatus, jqXHR) { errorAjaxHandler(data,textStatus, jqXHR); }
        });
    },

    post: function(url, paramObj, fnSuccess, fnError) {
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(paramObj),
            contentType: "application/json",
            headers: httpHeaders(),
            success: function (data, textStatus, jqXHR) { fnSuccess(data, textStatus, jqXHR); },
            error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
        });
    }
}
