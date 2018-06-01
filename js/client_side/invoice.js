var ipcRenderer = require('electron').ipcRenderer;
window.$ = window.jQuery = require('../libs/js/jquery.min.js');
var moment = require('moment');
let apiURL = '';


$(document).ready(function () {
    if (sessionStorage.getItem('IPServer') !== null) {
        apiURL = 'http://' + sessionStorage.getItem('IPServer') + ':7070';
    }

    getTicketInfo();
});

/**
 * Obtener el detalle del ticket para imprimir
 */
function getTicketInfo() {
    if(sessionStorage.getItem('idTicket') !== null) {
        const idTicket = +sessionStorage.getItem('idTicket');

        $.post(apiURL + '/api/getTicket', { idTicket: idTicket }, function(data) {
            if(data.result) {
                console.log(data.data);
                const detalleTicket = data.data;
                var listProductos = $('#listProductos');
                listProductos.empty();
                let total = 0;
                $(detalleTicket).each(function (i, detalle) {
                    var producto = $('#producto').html();
                    producto = producto.replace('{cantidad}', detalle.cantidad);
                    producto = producto.replace('{nombre}', detalle.nombre);
                    producto = producto.replace('{precio}', detalle.precio);

                    total += detalle.precio;

                    listProductos.append(producto);
                });

                // total del ticket
                var t = $('#total').html();
                t = t.replace('{total}', total);
                listProductos.append(t);

                // titulo
                var titulo = $('#titulo').html();
                var fechaHora = $('#fechaHoraNoTicket').html();
                var hoy = new Date();
                var m = moment(hoy);

                fechaHora = fechaHora.replace('{noTicket}', idTicket);
                fechaHora = fechaHora.replace('{fecha}', m.format('DD/MM/YYYY h:mm A'));
                titulo = titulo.replace('{subtitulo}', fechaHora);
                $('#titulo').html(titulo);

                // imprimir ticket
                printTicket();
            }
        });
    }
}

/**
 * Imprimir ticket cuando este se muestre en pantalla
 */
function printTicket() {
    const path = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var idTicket = sessionStorage.getItem('idTicket')
    ipcRenderer.send('printTicket', path + '/invoices/enlace-factura-' + idTicket + '.pdf');
}

/**
 * Once a pdf was created, it returns to validate if was created correctly
 * and go back to punto-venta.html
 */
ipcRenderer.on('ticketPrinted', (event, arg) => {
    var pdfCreated = JSON.parse(arg);
    if (pdfCreated.result) {
        console.log(pdfCreated.result);
        location.href = 'punto-venta.html';
    } else {
        console.log(pdfCreated.message);
    }
});


$(document).on('click', '#btnPrint', function() {
    // printTicket();
    // window.print();
});