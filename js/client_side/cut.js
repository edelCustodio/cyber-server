window.$ = window.jQuery = require('jquery');
const Enumerable = require('linq');
require('../node_modules/@chenfengyuan/datepicker/dist/datepicker')
require('../node_modules/bootstrap-datetimepicker-npm/build/js/bootstrap-datetimepicker.min.js')
require('bootstrap-validator')
require('../libs/js/jquery.mCustomScrollbar')
require( 'datatables.net-bs4' )();
require( 'datatables.net-responsive-dt' )()
var dt = require( 'datatables.net' )( window, $ );
let apiURL = '';
var port = 51990; // 8080 51990
var _tickets;
var tableTickets;
var tableHistorial;
let fechaInicio = new Date();
let fechaFin = new Date();
let dpFechaInicio;
let dpFechaFin;

$(document).ready(function() {
    // apiURL = 'http://' + sessionStorage.getItem('IPServer') + ':' + port + '/';
    apiURL = 'http://localhost:' + port + '/';

    
    fechaInicio = new Date();
    fechaFin = new Date();

    dpFechaInicio = $('#dpFechaInicio').datetimepicker({ 
        locale: 'es',
        format : 'DD/MM/YYYY hh:mm A',
        defaultDate: fechaInicio
    });
    dpFechaFin = $('#dpFechaFin').datetimepicker({ 
        locale: 'es',
        format : 'DD/MM/YYYY hh:mm A',
        defaultDate: fechaFin
    });

    inicializarDatePickerEvents();

    obtenerDetalleVentas();

    obtenerHistorialCortes();
});

function obtenerDetalleVentas() {
    var url = apiURL + 'api/Ticket/getTicketsPay?fechaInicio=' + fechaInicio.toJSON() + '&fechaFin=' + fechaFin.toJSON();
    $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json",
        headers: httpHeaders(),
        success: function (data, textStatus, jqXHR) {
            if (data) {
                llenarCamposCorte(data);
                tableTickets = $('#example').DataTable({
                    data: data,
                    "columnDefs": [
                        { className: "text-right", "targets": [4,5,6] },
                        { className: "text-nowrap", "targets": [2] }
                    ],
                    columns: [
                        {
                            "className": 'details-control',
                            "orderable": false,
                            "data": null,
                            "defaultContent": ''
                        },
                        { data: "idTicket" },
                        { data: "fechaStr" },
                        { data: "estado" },
                        { data: "totalStr" },
                        { data: "pagoStr" },
                        { data: "cambioStr" },
                        { data: "Usuario.nombreCompleto" },
                    ]
                });
            }
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

function obtenerHistorialCortes() {
    var url = apiURL + 'api/Corte/cortes';
    $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json",
        headers: httpHeaders(),
        success: function (data, textStatus, jqXHR) {
            if (data) {

                tableHistorial = $('#historial').DataTable({
                    data: data,
                    // "columnDefs": [
                    //     { className: "text-right", "targets": [4,5,6] },
                    //     { className: "text-nowrap", "targets": [2] }
                    // ],
                    columns: [
                        { data: "montoInicialStr" },
                        { data: "montoVentasStr" },
                        { data: "montoFinalStr" },
                        { data: "diferenciaStr" },
                        { data: "fechaInicioStr" },
                        { data: "fechaFinStr" },
                    ],
                    "paging":   false,
                    "ordering": false,
                    "info":     false,
                    "searching": false,
                    responsive: true
                });
            }
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

function detalleTicketVenta(data) {
    let html = `<table id="ticketDetalle`+ data.idTicket +`" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                </table>`
    return html;
}

$(document).off('click', '#example tbody td.details-control').on('click', '#example tbody td.details-control', function () {
    var tr = $(this).closest('tr');
    var row = tableTickets.row(tr);

    if ( row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
    }
    else {
        // Open this row
        row.child( detalleTicketVenta(row.data())).show();
        tr.addClass('shown');
        $('#ticketDetalle'+ row.data().idTicket).DataTable({
            data: row.data().Detalle,
            columns: [
                { data: "Producto.nombre" },
                { data: "precioFinalStr" },
                { data: "cantidad" },
                { data: "totalStr" }
            ],
            "paging":   false,
            "ordering": false,
            "info":     false,
            "searching": false
        });
    }
});

/**
 * Calcular la diferencia y habilitar o deshabilitar
 * el boton de guardar
 */
$('#montoFinal').blur(function () {
    const montoFinal = parseInt($(this).val());
    const montoInicial = parseInt($('#montoInicial').val());
    const montoVentas = parseInt($('#montoVentas').val());
    const $diferencia = $('#diferencia');
    const $btnGuardarCorte = $('#btnGuardarCorte');

    if (!isNaN(montoFinal)) {
        const diferencia = montoFinal - montoInicial - montoVentas;
        $diferencia.val(diferencia);
        $btnGuardarCorte.removeAttr('disabled');
    } else {
        $diferencia.val(0);
        $btnGuardarCorte.attr('disabled', true);
    }
});

/**
 * Guardar corte
 */
$('#btnGuardarCorte').click(function () {
    const corte = JSON.parse(sessionStorage.getItem('corte'));
    const montoFinal = parseInt($('#montoFinal').val());
    const montoVentas = parseInt($('#montoVentas').val());
    const diferencia = parseInt($('#diferencia').val());

    corte.montoFinal = montoFinal;
    corte.montoVentas = montoVentas;
    corte.diferencia = diferencia;

    actualizarCorte(corte);
});

/**
 * Actualizar corte
 * @param {*} corte 
 */
function actualizarCorte(corte) {
    var corteURL = apiURL + 'api/corte/PutCorte';
    $.ajax({
        url: corteURL,
        type: "PUT",
        data: JSON.stringify(corte),
        contentType: "application/json",
        async: true,
        processData: false,
        cache: false,
        headers: httpHeaders(),
        success: function (data, textStatus, jqXHR) {
            if (jqXHR.status === 204) { // exitoso
                sessionStorage.removeItem('corte');
                const jwt = parseJwt(sessionStorage.token);
                const idUsuario = parseInt(jwt.nameid);
                ObtenerCorte(idUsuario);
            }
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

/**
 * Obtener el corte y guardarlo en el storage
 */
function ObtenerCorte(idUsuario) {
    var corteURL = apiURL + 'api/corte/crear';
    $.ajax({
        url: corteURL,
        type: "POST",
        data: JSON.stringify(idUsuario),
        contentType: "application/json",
        headers: httpHeaders(),
        success: function (data, textStatus, jqXHR) {
            console.log(data);
            sessionStorage.setItem('corte', JSON.stringify(data));
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

/**
 * Inicializar los controles date pickers
 */
function inicializarDatePickerEvents() {
    // Date picker fecha de inicio
    dpFechaInicio.on('dp.change', function (e) {
        fechaInicio = e.date.toDate();
        dpFechaFin.data("DateTimePicker").date(fechaInicio);
    });

    // Date picker fecha fin
    dpFechaFin.on('dp.change', function (e) {
        if(e.date.toDate() < fechaInicio) {
            dpFechaFin.data("DateTimePicker").date(fechaInicio);
        } else {
            fechaFin = e.date.toDate();
        }
    });
    
    // buscar tickets segun la fecha de inicio y fin
    $('#searchTicketsPaid').click(function() {
        tableTickets.destroy();
        obtenerDetalleVentas();
    });
}

/**
 * Llenar los campos de los modulos del corte
 */
function llenarCamposCorte(ventas) {
    const corte = JSON.parse(sessionStorage.getItem('corte'));
    const montoVentas = Enumerable.from(ventas).sum(s => s.total);

    $('#montoInicial').val(corte.montoInicial);
    $('#montoVentas').val(montoVentas)
}

/**
 * Parsear JWT
 */
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
}


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

/**
 * autorizacion http header para obtener datos desde
 * el API
 */
function httpHeaders() {
    return { "Authorization": sessionStorage.getItem('token') };
}