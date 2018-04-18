const swal = require('sweetalert2')
let apiURL = '';
window.$ = window.jQuery = require('../libs/js/jquery.min.js');
const Enumerable = require('linq');
require('bootstrap-validator')
require('../libs/js/jquery.mCustomScrollbar')
var { ipcRenderer, remote } = require('electron');
var _newTicket = false;
var _idComputadora = 0;


/*--------------------------------------
    Notifications & Dialogs
---------------------------------------*/
/*
* Notifications
*/
function notify(from, align, icon, type, title, message){
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
    })
}

$(document).ready(function () {
    if (sessionStorage.getItem('IPServer') !== null) {
        apiURL = 'http://' + sessionStorage.getItem('IPServer') + ':7070';
    } else {
        ipcRenderer.send('goForIPServer', 1);
    }
});

/**
 * Listen for async message from renderer process
 */
ipcRenderer.on('getForIPServer', (event, arg) => {  
    var ips = JSON.parse(arg);
    sessionStorage.setItem('IPServer', ips.ipServer);
    apiURL = 'http://' + ips.ipServer + ':7070';
    sessionStorage.setItem('IPServer', ips.ipServer);
});

/**
 * Mostrar las computadoras activas
 */
function drawDesktops() {
    var allDesktops = "";
    
    $.get(apiURL + "/api/getComputers", function(data) {

        $(data).each(function(i, pc) {
            var template = $("#computadora-tmp").html();
            template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
            allDesktops += template;
        });

        $("#divComputadoras").empty();
        $("#divComputadoras").append(allDesktops);
        
        sessionStorage.setItem('desktops', JSON.stringify(data));

        getDesktopsActive();
    });
}

/**
 * Codigo para agregar producto al ticket
 */

 /**
 * Once the dropdown is changed, this event is fired to populate the price
 */
$('#sProductos').change(function () {
    var sProductos = $(this);

    if(!_newTicket) {
        var idComputadora = $('#sDesktops').val() !== undefined ? parseInt($('#sDesktops').val()) : _idComputadora;
        $("#iCantidad").val('');
        $('#iTotal').val('');

        if(idComputadora > 0) {
            var idProducto = parseInt(sProductos.val());
            
            var producto = getProductSelected(idProducto);
            
            //set precio
            $('#iPrecio').val(producto.precio);
        } else {
            //sweet alert
            alertNotify('Ups!', 'Por favor, seleccione una computadora', 'warning');
            //  chosen-default
            $('.chosen-single').addClass('chosen-default');
            $('.chosen-single span').html('Seleccione un producto...');
            sProductos.val(0);

        }
    } else {
        var sProductos = $(this);
        $("#iCantidad").val('');
        $('#iTotal').val('');
        
        // obtener producto
        var producto = getProductSelected(parseInt(sProductos.val()));
        //set precio
        $('#iPrecio').val(producto.precio);
    }
});

/**
 * hacer calculo de total en tiempo real cantidad * precio
 */
$( "#iCantidad" ).keyup(function() {

    var idProducto = parseInt($('#sProductos').val());

    if (idProducto > 0) {
        var cantidad = $("#iCantidad").val(); //get the value of input     

        if (cantidad !== "") {
            var precio = $('#iPrecio').val();
            var total = 0;
            var producto = getProductSelected(idProducto);
            
            if (cantidad.match(/^\d+$/) && (parseInt(cantidad) <= producto.cantidad) && precio !== "") {    
                total = parseInt(cantidad) * parseFloat(precio);
                $('#iTotal').val(total);      
            } else {
                $("#iCantidad").val(producto.cantidad);
                total = parseInt(cantidad) * parseFloat(precio);
                $('#iTotal').val(total); 
                alertNotify('Ups!', 'La cantidad debe de ser menor o igual que lo disponible.', 'warning');  
            }
            
            $('#btnAgregarProducto').removeAttr('disabled');
        } else 
            $('#btnAgregarProducto').attr('disabled', true);
    } else {
        alertNotify('Ups!', 'Por favor, seleccione un producto', 'warning');
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

     //get products
     $.get(apiURL + "/api/getProducts", function(data) {
        var products = data;
        $sProducts.append($("<option />").val(0).text('Seleccione un producto...'));
        $.each(products, function() {
            if(this.idProducto > 1)
                $sProducts.append($("<option />").val(this.idProducto).text(this.nombre));
        });

        if (sessionStorage.getItem('products') === null)
            sessionStorage.setItem('products', JSON.stringify(products));
        else {
            sessionStorage.removeItem('products');
            sessionStorage.setItem('products', JSON.stringify(products));
        }

        if($('.chosen')[0]) {
            $('.chosen').chosen({
                width: '100%'
            });
        }
    
        $('.chosen-single').css('text-transform', 'none');
    });
}

function fillDesktopDropdown() {
    var $sDesktops = $('#sDesktops');
    $sDesktops.empty();
    //fill out computadora select element
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    var records = sessionStorage.getItem('desktopRecords') !== null ? JSON.parse(sessionStorage.getItem('desktopRecords')) : [];

    if (records.length > 0) {
        $sDesktops.append($("<option />").val(0).text('Seleccione una computadora'));
        $.each(desktops, function() {
            var desktopRecord = Enumerable.from(records).where(w => w.idComputadora === this.idComputadora).firstOrDefault();
            if(desktopRecord.fechaFin === null) {
                $sDesktops.append($("<option />").val(this.idComputadora).text(this.nombre));
            }
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
 * delete grid row tickets
 */
$(document).off('click', 'button[id^="delete"]').on('click', 'button[id^="delete"]', function () {
    var tr = $(this).parent().parent();

    if(!_newTicket) { 
        var idProducto = parseInt($(this).attr('id').split('-')[2]);
        var idComputadora = parseInt($(this).attr('id').split('-')[1]);
        var deleteDesktop = false;
    
        var tickets = JSON.parse(sessionStorage.getItem('tickets'));
    
        //remove product from tickets array
        $.each(tickets, function(i, t) {
            t.productos = $.grep(t.productos, function(p) { 
                return p.idProducto !== idProducto; 
            });
    
            if (t.productos.length === 0)
                deleteDesktop = true;
        });
    
        if (deleteDesktop) {
            tickets = $.grep(tickets, function(t) { 
                return t.idComputadora !== idComputadora; 
            });
        }
    
        sessionStorage.removeItem('tickets');
        tr.remove();
        
        if (tickets.length > 0)
            sessionStorage.setItem('tickets', JSON.stringify(tickets));
        
        //recreate grid ticket product
        createGridProduct(idComputadora);
    } else {
        var idProducto = parseInt($(this).attr('id').split('-')[2]);
        var saleTicket = JSON.parse(sessionStorage.getItem('saleTicket'));

        saleTicket.ticketsDetalle = $.grep(saleTicket.ticketsDetalle, function (r) {
            return r.idProducto !== idProducto;
        });   

        var total = Enumerable.from(saleTicket.ticketsDetalle).sum(s => s.total);
        $('#tbListProducts').append(sumTotalSaleTicket(total));
        tr.remove();
        sessionStorage.setItem('saleTicket', JSON.stringify(saleTicket));

        // mensaje de elimar producto
        notify('top', 'right', 'fa fa-comments', 'success', ' Producto eliminado, ', 'el producto fue eliminado satisfactoriamente.');
    }
});

//Agregar productos al ticket con la computadora seleccionada
function addProductToTicket() {

    var idProducto = parseInt($('#sProductos').val());
    var nombre = $('#sProductos option:selected').text();
    var cantidad = parseInt($('#iCantidad').val());
    var precio = parseFloat($('#iPrecio').val());
    var total = parseFloat($('#iTotal').val());

    if (!_newTicket) {
        _countNewTicket = 0;
        var idComputadora = $('#sDesktops').val() !== undefined ? parseInt($('#sDesktops').val()) : _idComputadora;
        var nombreComputadora = $('#sDesktops option:selected').val();
        var tickets = [];
        var ticket = {
            idComputadora: 0,
            nombreComputadora: '',
            productos: []
        };
        
        // detalle del ticket
        var ticketD = {
            idProducto: idProducto,
            nombre: nombre,
            precio: precio,
            cantidad: cantidad,
            total: total
        }
    
        if (sessionStorage.getItem('tickets') !== null) {
            tickets = JSON.parse(sessionStorage.getItem('tickets'));
    
            ticket = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).firstOrDefault();
            var productoExistente = Enumerable.from(ticket.productos).where(w1 => w1.idProducto === idProducto).firstOrDefault();
    
            //if there is an existing product, update its values
            if(productoExistente !== null && !$.isEmptyObject(productoExistente)) {
                productoExistente.cantidad = ticketD.cantidad;
                productoExistente.total = ticketD.total;
                productoExistente.precio = ticketD.precio;
            } else { //add new product
                //validate if there is an existing desktop on tickets    
                if (ticket !== null && !$.isEmptyObject(ticket)) {
                    ticket.productos.push(ticketD);
                } else {
                    ticket.idComputadora = idComputadora;
                    ticket.nombreComputadora = nombreComputadora;
                    ticket.productos.push(ticketD);
                    tickets.push(ticket);
                }
            }
        } else {
            ticket.idComputadora = idComputadora;
            ticket.nombreComputadora = nombreComputadora;
            ticket.productos.push(ticketD);
            tickets.push(ticket);
        }
    
        sessionStorage.removeItem('tickets');
        sessionStorage.setItem('tickets', JSON.stringify(tickets));
    
        //recreate grid ticket product
        createGridProduct(idComputadora);
    
        var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    
        var desktopName = Enumerable.from(desktops).where(w => w.idComputadora === _idComputadora).select(s => s.nombre).firstOrDefault();
        $('#hDesktopName').html(desktopName);
    } else {
        
        var saleTicket = {};

        var detalle = {
            idTicketDetalle: 0,
            idTicket: 0,
            idProducto: idProducto,
            cantidad: cantidad,
            idRegistroComputadora: 0,
            nombre: nombre,
            precio: precio,
            total: (precio * cantidad)
        }

        if (sessionStorage.getItem('saleTicket') !== null) {
            saleTicket = JSON.parse(sessionStorage.getItem('saleTicket'));

            var ticketD = Enumerable.from(saleTicket.ticketsDetalle).where(w => w.idProducto === detalle.idProducto).firstOrDefault();

            if (ticketD) {
                detalle.cantidad = ticketD.cantidad + detalle.cantidad;
                detalle.total = ticketD.total + detalle.total;
                saleTicket.ticketsDetalle = $.grep(saleTicket.ticketsDetalle, function (r){
                    return r.idProducto !== detalle.idProducto;
                });   
            }
        } else {
            saleTicket = {
                total: 0,
                pago: 0,
                cambio: 0,
                idRegistro: 0,
                ticketsDetalle: []
            }            
        }

        saleTicket.ticketsDetalle.push(detalle);
        $('#tbListProducts').empty();

        $(saleTicket.ticketsDetalle).each(function (i, d) {

            var rowTemplate = $('#trRowGridTicket').html();
            rowTemplate = rowTemplate.replace('{idComputadora}', 0).replace('{idProducto}', d.idProducto);
            rowTemplate = rowTemplate.replace('{contador}', i + 1);
            rowTemplate = rowTemplate.replace('{nombre}', d.nombre);
            rowTemplate = rowTemplate.replace('{precio}', d.precio);
            rowTemplate = rowTemplate.replace('{cantidad}', d.cantidad);
            rowTemplate = rowTemplate.replace('{total}', d.total);

            $('#tbListProducts').append(rowTemplate);
        });

        var total = Enumerable.from(saleTicket.ticketsDetalle).sum(s => s.total);
        $('#tbListProducts').append(sumTotalSaleTicket(total));

        sessionStorage.setItem('saleTicket', JSON.stringify(saleTicket));
    }
    
    // deshabilitar el boton de pagar
    $('#btnPagar').removeAttr('disabled');

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
 * Create or build the full grid ticket product to show the product list associated to the desktop.
 */
function createGridProduct(idComputadora) {
    $('#tbListProducts').empty();
    // var idComputadora = parseInt($('#sDesktops').val());
    var tickets = JSON.parse(sessionStorage.getItem('tickets'));
    var productos = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).select(s => s.productos).firstOrDefault();
    var total = 0;

    if (productos !== null && productos.length > 0) {
        var gridProduct = '';
        $.each(productos, function (i, p) {
            var rowTemplate = $('#trRowGridTicket').html();
            rowTemplate = rowTemplate.replace('{idComputadora}', idComputadora).replace('{idProducto}', p.idProducto);
            rowTemplate = rowTemplate.replace('{contador}', i + 1);
            rowTemplate = rowTemplate.replace('{nombre}', p.nombre);
            rowTemplate = rowTemplate.replace('{precio}', p.precio);
            rowTemplate = rowTemplate.replace('{cantidad}', p.cantidad);
            rowTemplate = rowTemplate.replace('{total}', p.total);
            total = total + p.total;
            gridProduct += rowTemplate;
        });

        var rowTotal = $('#trRowGridTicketTotal').html();
        rowTotal = rowTotal.replace('{Total}', total);
        gridProduct += rowTotal;

        $('#tbListProducts').append(gridProduct);
    }
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

    // dropdown product
    // dropdown product
    $('.chosen-single').addClass('chosen-default');
    $('.chosen-single span').html('Seleccione un producto...');
    $('#sProductos').val(0)

    // close the modal
    $('#addTicketItem').modal('toggle');
}

/**
 * Get current active desktops
 */
function getDesktopsActive() {
    
    $.get(apiURL + "/api/getDesktopsInUse", function(data) {

        if (data.length > 0) {
            $(data).each(function(i, e) {
                var input = $('#stCompu-' + e.idComputadora);
                var desktopIcon = input.parent().parent().parent().find("a > i.fa");
                desktopIcon.attr("style", "color: #4caf50");
                input.prop("checked", true);
                    
            })

            sessionStorage.setItem('destopInUse', JSON.stringify(data));
        }        
        getProducts();
    });
}

/**
 * Obtener el ticket por el idComputadora
 */
function getTicketByIdComputer() {
    var ticket = {};
    if (sessionStorage.getItem('tickets') !== null) {
        var tickets = JSON.parse(sessionStorage.getItem('tickets'));

        ticket = Enumerable.from(tickets).where(w => w.idComputadora === _idComputadora).firstOrDefault();
    }
    return ticket;
}

/**
 * Borra el ticket correspondiente a la computadora seleccionada
 */
function deleteTicketByIdComputer() {
    if (sessionStorage.getItem('tickets') !== null) {
        var tickets = JSON.parse(sessionStorage.getItem('tickets'));
        tickets = $.grep(tickets, function (t) {
            return t.idComputadora !== _idComputadora
        });
        
        // borrar item de session storage
        sessionStorage.removeItem('tickets');

        // crear otro objeto en session storage con la informacion actualizada.
        sessionStorage.setItem('tickets', JSON.stringify(tickets));

        return true;
    }
    return false;
}

function buildGrid() {

}

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
    saveDesktopToPurchase(desktop);

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
 * Obtener los registros del tiempo de uso de cada computadora y almacenarlo en el sessionStorage
 */
ipcRenderer.on('record', (event, arg) => {
    var records = [];
    var record = JSON.parse(arg);
    if (sessionStorage.getItem('desktopRecords') !== null) {
        records = JSON.parse(sessionStorage.getItem('desktopRecords'));
        
        var findRecord = Enumerable.from(records).where(w => w.idRegistro === record.idRegistro).firstOrDefault();

        if (findRecord || findRecord === null) {
            records.push(record);
        } else {
            records = $.grep(records, function (r){
                return r.idRegistro !== record.idRegistro;
            });

            records.push(record);
        }

        sessionStorage.setItem('desktopRecords', JSON.stringify(records));
    } else {
        records.push(record);
        sessionStorage.setItem('desktopRecords', JSON.stringify(records));
    }
});

/**
 * cuando la aplicacion cliente se cierra, Se actualizara el status de la computadora
 * despues necesitamos volver a cargar la lista de las computadoras activas.
 */
ipcRenderer.on('closeApp', (event, arg) => {
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    var desktop = Enumerable.from(desktops).where(w => w.nombre === arg).firstOrDefault();
    var data = { idComputadora: desktop.idComputadora, enLinea: false };
    $.post(apiURL + 'api/setDesktopOnline', data, function(data) {
        if(data.result)
            desktopInfo = data.data;
        else
            console.log(data);

        drawDesktops();
    });
});