const swal = require('sweetalert2')
let apiURL = "http://localhost:7070";
window.$ = window.jQuery = require('../libs/js/jquery.min.js');
const Enumerable = require('linq');
require('bootstrap-validator')
require('../libs/js/jquery.mCustomScrollbar')
var { ipcRenderer, remote } = require('electron');

$(document).ready(function () {
    getProducts();
});

/*--------------------------------------
    Notifications & Dialogs
---------------------------------------*/
/*
* Notifications
*/
function notify(icon, type, title, message){
    $.growl({
        icon: icon,
        title: title,
        message: message,
        url: ''
    },{
        element: 'body',
        type: type,
        allow_dismiss: true,
        
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

/**
 * Codigo para agregar producto al ticket
 */

 /**
 * Once the dropdown is changed, this event is fired to populate the price
 */
$('#sProductos').change(function () {
    var idComputadora = parseInt($('#sDesktops').val());
    var sProductos = $(this);
    $("#iCantidad").val('');
    $('#iTotal').val('');

    if(idComputadora > 0 || $('#sDesktops').val() === undefined) {
        var idProducto = parseInt(sProductos.val());
        
        var producto = getProductSelected(idProducto);
        
        //set precio
        $('#iPrecio').val(producto.precio);
    } else {
        //sweet alert
        alertNotify('Ups!', 'Por favor, seleccione una computadora', 'warning');

        sProductos.val('0');

    }
});

/**
 * Permitir solo numeros en el input de cantidad
 */
$( "#iCantidad").keydown(function (e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
        // Allow: Ctrl+A, Command+A
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) || 
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)) {
        // let it happen, don't do anything
        return;
    }

    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
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
    
    });
}

function fillDesktopDropdown() {
    var $sDesktops = $('#sDesktops');
    $sDesktops.empty();
    //fill out computadora select element
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    $sDesktops.append($("<option />").val(0).text('Seleccione una computadora'));
    $.each(desktops, function() {
        $sDesktops.append($("<option />").val(this.idComputadora).text(this.nombre));
    });
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
});

//Agregar productos al ticket con la computadora seleccionada
function addProductToTicket() {
    
    var idComputadora = parseInt($('#sDesktops').val());
    var nombreComputadora = $('#sDesktops option:selected').val();
    var idProducto = parseInt($('#sProductos').val());
    var nombre = $('#sProductos option:selected').text();
    var cantidad = $('#iCantidad').val();
    var precio = $('#iPrecio').val();
    var total = $('#iTotal').val();

    var ticket = {
        idComputadora: 0,
        nombreComputadora: '',
        productos: []
    };
    var tickets = [];
    
    var producto = {
        idProducto: idProducto,
        nombre: nombre,
        precio: precio,
        cantidad: cantidad,
        total: total
    }

    if (sessionStorage.getItem('tickets') !== null) {
        tickets = JSON.parse(sessionStorage.getItem('tickets'));

        var productoExistente = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).select(s => Enumerable.from(s.productos).where(w1 => w1.idProducto === idProducto).firstOrDefault()).firstOrDefault();

        //if there is an existing product, update its values
        if(productoExistente !== null && !$.isEmptyObject(productoExistente)) {
            productoExistente.cantidad = producto.cantidad;
            productoExistente.total = producto.total;
            productoExistente.precio = producto.precio;
        } else { //add new product
            //validate if there is an existing desktop on tickets
            var ticketExist = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).firstOrDefault();

            if (ticketExist !== null && !$.isEmptyObject(ticketExist)) {
                ticketExist.productos.push(producto);
            } else {
                ticket.idComputadora = idComputadora;
                ticket.nombreComputadora = nombreComputadora;
                ticket.productos.push(producto);
                tickets.push(ticket);
            }
        }
    } else {
        ticket.idComputadora = idComputadora;
        ticket.nombreComputadora = nombreComputadora;
        ticket.productos.push(producto);
        tickets.push(ticket);
    }

    sessionStorage.removeItem('tickets');
    sessionStorage.setItem('tickets', JSON.stringify(tickets));

    //recreate grid ticket product
    createGridProduct(idComputadora);

    var desktops = JSON.parse(sessionStorage.getItem('desktops'));

    var desktopName = Enumerable.from(desktops).where(w => w.idComputadora === idComputadora).select(s => s.nombre).firstOrDefault();
    $('#hDesktopName').html(desktopName);
    $('#btnPagar').removeAttr('disabled');

    // clean controls
    $('#iCantidad').val('');
    $('#iPrecio').val('');
    $('#iTotal').val('');
    // dropdown product
    $('.chosen-single span').html('');
}

/**
 * Create or build the full grid ticket product to show the product list associated to the desktop.
 */
function createGridProduct(idComputadora) {
    $('#tbListProducts').empty();
    // var idComputadora = parseInt($('#sDesktops').val());
    var tickets = JSON.parse(sessionStorage.getItem('tickets'));
    var productos = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).select(s => s.productos).firstOrDefault();

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

            gridProduct += rowTemplate;
        });

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
    $('.chosen-single span').html('');

    // close the modal
    $('#addTicketItem').modal('toggle')
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
    if (sessionStorage.getItem('desktopRecords') !== null) {
        records = JSON.parse(sessionStorage.getItem('desktopRecords'));

        var record = JSON.parse(arg);
        var findRecord = Enumerable.from(records).where(w => w.idRegistro === record.idRegistro).firstOrDefault();

        if (findRecord === undefined) {
            records.push(record);
            sessionStorage.setItem('desktopRecords', JSON.stringify(records));
        }
    } else {
        sessionStorage.setItem('desktopRecords', JSON.stringify(records.push(JSON.parse(arg))));
    }
});