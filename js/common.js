const swal = require('sweetalert2')
let apiURL = "http://localhost:7070";
window.$ = window.jQuery = require('../libs/js/jquery.min.js');
const Enumerable = require('linq');
require('bootstrap-validator')
require('../libs/js/jquery.mCustomScrollbar')



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
$( "#iCantidad" ).keydown(function (e) {
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
        }
    } else {
        alertNotify('Ups!', 'Por favor, seleccione un producto', 'warning');
    }
});

/**
 * get Product from sessionStorage
 * @param {*} idProducto 
 */
function getProductSelected(idProducto) {
    var productos = JSON.parse(sessionStorage.getItem('products'));
    
    var producto = Enumerable.from(productos).where(w => w.idProducto === idProducto).firstOrDefault();

    return producto;
}




function getProducts() {
    var $sProducts = $('#sProductos');
    $sProducts.empty();

     //get products
     $.get(apiURL + "/api/getProducts", function(data) {
        var products = data;
        $sProducts.append($("<option />").val('0').text('Seleccione un producto'));
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
            return p.idProducto != idProducto; 
        });

        if (t.productos.length === 0)
            deleteDesktop = true;
    });

    if (deleteDesktop) {
        tickets = $.grep(tickets, function(t) { 
            return t.idComputadora != idComputadora; 
        });
    }

    sessionStorage.removeItem('tickets');
    tr.remove();
    
    if (tickets.length > 0)
        sessionStorage.setItem('tickets', JSON.stringify(tickets));
    
    //recreate grid ticket product
    createGridProduct();
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
            $.each(tickets, function(i, t) {
                if (t.idComputadora === idComputadora) {
                    $.each(t.productos, function (i, p) {
                        if (p.idProducto === producto.idProducto) {
                            p.cantidad = producto.cantidad;
                            p.total = producto.total;
                        }
                    })
                }
            });
        } else { //add new product
            //validate if there is an existing desktop on tickets
            var ticketExist = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).firstOrDefault();

            if (ticketExist !== null && !$.isEmptyObject(ticketExist)) {
                $.each(tickets, function(i, t) {
                    if (t.idComputadora === idComputadora) {    
                        t.productos.push(producto);
                    }
                });
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
    createGridProduct();
}

/**
 * Create or build the full grid ticket product to show the product list associated to the desktop.
 */
function createGridProduct() {
    $('#tbListProducts').empty();
    var idComputadora = parseInt($('#sDesktops').val());
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
    