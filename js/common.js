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
        // recorrer las maquinas que estan en linea en base de datos
        $(data).each(function(i, pc) {
            // comparar contra las maquinas que realmente tienen comunicacion
            // con la maquina de cobro
            _arrClients.forEach(cl => {
                if (cl.data.hostname === pc.nombre) {
                    var template = $("#computadora-tmp").html();
                    template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
                    allDesktops += template;
                }
            });
        });

        $("#divComputadoras").empty();
        $("#divComputadoras").append(allDesktops);
        
        sessionStorage.setItem('desktops', JSON.stringify(data));

        // obtener maquinas en uso en tiempo real
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

    if (sProductos.val() === '0') {
        return;
    }

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
        $.each(records.filter(w => w.fechaFin === null), function(i, r) {
            var desktop = Enumerable.from(desktops).where(w => w.idComputadora === r.idComputadora).firstOrDefault();
            $sDesktops.append($("<option />").val(desktop.idComputadora).text(desktop.nombre));
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
    var idComputadora = $('#sDesktops').val() !== undefined ? parseInt($('#sDesktops').val()) : _idComputadora;
    let records = [];

    if (sessionStorage.getItem('desktopRecords') !== null) {
        records = JSON.parse(sessionStorage.getItem('desktopRecords'));
    }

    if (_idRegistro === 0) {
        if (records.length > 0) {
            _idRegistro = Enumerable.from(records).where(w => w.idComputadora === idComputadora && w.fechaFin === null).select(s => s.idRegistro).firstOrDefault();
        }
    }

    if (!_newTicket) {
        _countNewTicket = 0;
        var nombreComputadora = $('#sDesktops option:selected').val();
        var tickets = [];
        var ticket = {
            idComputadora: _idComputadora,
            idRegistro: _idRegistro,
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
        }

        if (tickets.length > 0) {
    
            const ticketExists = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora && w.idRegistro === _idRegistro).firstOrDefault();
            
            //if there is an existing product, update its values
            if(ticketExists !== null) {
                var productoExistente = Enumerable.from(ticketExists.productos).where(w1 => w1.idProducto === idProducto).firstOrDefault();

                if(productoExistente !== null) {
                    productoExistente.cantidad = ticketD.cantidad;
                    productoExistente.total = ticketD.total;
                    productoExistente.precio = ticketD.precio;
                } else {
                    // quitar objeto existente
                    tickets = $.grep(tickets, function (t) {
                        return t.idRegistro !== _idRegistro
                    });

                    // agregar objeto con nuevos elementos
                    ticketExists.productos.push(ticketD);
                    tickets.push(ticketExists);
                }
                
            } else { //add new product
                //validate if there is an existing desktop on tickets    
                ticket.idComputadora = idComputadora;
                ticket.nombreComputadora = nombreComputadora;
                ticket.productos.push(ticketD);
                tickets.push(ticket);
            }
        } else {
            ticket.idComputadora = idComputadora;
            ticket.nombreComputadora = nombreComputadora;
            ticket.productos.push(ticketD);
            tickets.push(ticket);
        }
    
        sessionStorage.removeItem('tickets');
        sessionStorage.setItem('tickets', JSON.stringify(tickets));
    
        var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    
        var desktopName = Enumerable.from(desktops).where(w => w.idComputadora === _idComputadora).select(s => s.nombre).firstOrDefault();
        var recordTime = new Date(Enumerable.from(records).where(w => w.idRegistro === _idRegistro).select(s => s.fechaInicio).firstOrDefault());
        $('#hDesktopName').html(desktopName + ' - ' + recordTime.toLocaleTimeString());

        //recreate grid ticket product
        createGridProduct(idComputadora);
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
    var productos = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora && w.idRegistro === _idRegistro).select(s => s.productos).firstOrDefault();
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
    $('#iPago').val('');
    $('#iCambio').val('');

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

        ticket = Enumerable.from(tickets).where(w => w.idComputadora === _idComputadora && w.idRegistro === _idRegistro).firstOrDefault();
        
        return ticket;
    }
    return undefined;
}

/**
 * Borra el ticket correspondiente a la computadora seleccionada
 */
function deleteTicketByIdComputer() {
    if (sessionStorage.getItem('tickets') !== null) {
        var tickets = JSON.parse(sessionStorage.getItem('tickets'));
        tickets = $.grep(tickets, function (t) {
            return t.idRegistro !== _idRegistro
        });
        
        // borrar item de session storage
        sessionStorage.removeItem('tickets');

        // crear otro objeto en session storage con la informacion actualizada.
        sessionStorage.setItem('tickets', JSON.stringify(tickets));

        return true;
    }
    return false;
}

/**
 * Obtener el nombre de una computadora por id
 * @param {*} idComputadora id de la computadora
 */
function getDesktopName(idComputadora) {
    if (sessionStorage.getItem('desktops') !== null) {
        const desktops = JSON.parse(sessionStorage.getItem('desktops'));
        const desktop = Enumerable.from(desktops).where(w => w.idComputadora === idComputadora).firstOrDefault();
        return desktop.nombre;
    }
    return '';
}

/**
 * Actualizar ventana
 */
$('#update').click(function () {
    window.location.reload();
});

/**
 * Cerrar sesion
 */
$('#logout').click(function () {
    const userInfo = JSON.parse(sessionStorage.getItem('userLoggedIn'));
    $.post(apiURL + '/api/logout', { idSesion: userInfo.idSesion }, function(data) {
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
 * Cuando alguna maquina cliente pierde conexion
 * necesitamos actualizar su estado en la base de datos
 * y quitarlo del array de sockets que tenemos en la 
 * maquina de cobro
 */
ipcRenderer.on('clientClosed', (event, arg) => {
    // ip de maquina desconectada
    const ipClient = arg;
    // arreglo de maquinas
    var desktops = JSON.parse(sessionStorage.getItem('desktops'));
    
    // recorrer arreglo de sockets
    _arrClients.forEach(cli => {
        // si la IP coincide, proceder con la actualizacion en BD
        if (ipClient.includes(cli.data.IP)) {
            // obtener objeto de la maquina a desconectar
            var desktop = Enumerable.from(desktops).where(w => w.nombre === cli.data.hostname).firstOrDefault();

            if(desktop !== null) {
                // valores para sacar de linea la maquina desconectada
                var data = { idComputadora: desktop.idComputadora, enLinea: false };
                $.post(apiURL + '/api/setDesktopOnline', data, function(response) {
                    if (response.result) {
                        // eliminar del arreglo de sockets la maquina desconectada
                        _arrClients = $.grep(_arrClients, function(r) {
                            return !ipClient.includes(r.data.IP);
                        });

                        // si la aplicacion esta en el index, este se actualizara
                        // automaticamente
                        if (document.location.href.includes('index.html')) {
                            document.location.reload();
                        }
                    }
                });
            }
        }
    });
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

        if (findRecord === null) {
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

