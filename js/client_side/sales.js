


$(document).ready(function () {
    getRecordsNoPay();
    getProducts();
    // getTicketsPending(false, true);
    fillDesktopDropdown();
    // limpiar ticket
    _idTicket = 0;
});

/**
 * Create the row renta on grid
 */
$(document).off('click', '#computerList a').on('click', '#computerList a', function() {

    cleanGridAndProductControls();

    const anchor = $(this);
    _idTicket = parseInt(anchor.attr('id'));
    const ticket = Enumerable.from(_tickets).where(w => w.idTicket === _idTicket).firstOrDefault();
    // quita la seleccion de todos los elementos
    quitarSeleccionLista();

    // colocar color al item seleccionado
    $(this).css('background-color', '#8bcb8d');

    // mostrar el grid de productos de tickets pendientes por pagar
    mostrarProductosEnGrid(ticket);
    mostrarNombreTicket(ticket);

    
});

/**
 * Quita el color que indica que un elemento de la lista
 * esta seleccionado
 */
function quitarSeleccionLista() {
     // seleccionar el elemento de la computadora en la lista
    // y remover el color del item seleccionado
    $('#computerList').children().each(function (i, a) {
        $(a).css('background-color', '');
    });
}


/**
 * evento que se ejecuta al momento de presionar el boton pagar
 */
$('#btnPagar').click(function () {
    alertExecuteFunction('Pagar ticket', 'Desea pagar el ticket ahora?', 'warning', pagarTicket);
});


function pagarTicket() {
    var pago = parseInt($('#iPago').val());
    var total = obtenerTotalTicket();
    var cambio = pago - obtenerTotalTicket();
    
    var ticket = {
        idTicket: _idTicket,
        total: total,
        pago: pago,
        cambio: cambio
    }

    ajaxHelper.post(apiURL + 'api/Ticket/payTicket', ticket, function (data) {
        if (data) {
            sessionStorage.setItem('idTicket', _idTicket);
            // location.href = 'invoice.html';
            location.reload(true);
        }
    }, errorAjaxHandler);
}

/**
 * cuando el switch de crear un nuevo ticket es seleccionado
 * necesitamos limpiar valores y crear un nuevo registro en
 * la tabla ticket de la base de datos
 */
$('#newTicket').click(function () {
    alertExecuteFunction('Crear nuevo ticket', 'Esta seguro que quiere crear un nuevo ticket?', 'warning', crearNuevoTicket);
});

/**
 * 
 */
$('#iPago').keyup(function () {
    var pago = parseInt($(this).val());
    var cambio = 0;
    // obtener cambio
    cambio = pago - obtenerTotalTicket();

    if (pago > 0) {
        $('#btnPagar').removeAttr('disabled');
    } else {
        $('#btnPagar').attr('disabled', true);
    }

    $('#iCambio').val(cambio);
});

/**
 * Obtiene el total a cobrar del ticket de venta
 */
function obtenerTotalTicket() {
    let total = 0;
    
    const ticket = Enumerable.from(_tickets).where(w => w.idTicket === _idTicket).firstOrDefault();
    const productos = JSON.parse(sessionStorage.getItem('products'));
    

    const idProductos = Enumerable.from(ticket.Detalle).where(w => w.idProducto !== 1360).select(s => s.idProducto).toArray();
    total = Enumerable.from(productos).where(w => idProductos.indexOf(w.idProducto) > -1)
            .select(s => 
                    (s.precio * Enumerable.from(ticket.Detalle)
                                             .where(w => w.idProducto === s.idProducto)
                                             .select(s2 => s2.cantidad).firstOrDefault())
            )
            .sum();

    // Obtener la suma de los precios de productos especiales
    // aquellos que en la base de datos no tiene precio fijo
    // y que son establecidos a la hora del cobro de los mismos
    const prod = Enumerable.from(productos).where(w => idProductos.indexOf(w.idProducto) > -1 && w.precio === 0).select(s => s.idProducto).toArray();

    if (prod.length > 0) {
        let totalProdEspeciales = Enumerable.from(ticket.Detalle).where(w => prod.indexOf(w.idProducto) > -1).sum(s => s.total);
        total = total + totalProdEspeciales;
    }

    // Si existe idRegistro, entonces hay que agregar al total, totalPagar
    // del registro de uso de la maquina
    if (ticket.idRegistro !== null) {
        const record = Enumerable.from(_recordsNoPay).where(w => w.idRegistro === ticket.idRegistro).firstOrDefault();
        total = total + record.totalPagar;
    }

    return total;
}

/**
 * Eliminar el ticket, el borrado es logico, solo se actualiza el campo status a 1
 */
$(document).off('click', 'button[id^="eliminar"]').on('click', 'button[id^="eliminar"]', function () {
    var btn = $(this);
    var idTicket = parseInt(btn.attr('id').split('-')[1]);
    var ticket = Enumerable.from(_tickets).where(w => w.idTicket === idTicket).firstOrDefault();
    let isUsed = false;
    let texto = 'Desea eliminar el ticket?';

    if (ticket.idRegistro !== null) {
        const record = getDesktopRecordById(ticket.idRegistro);
        if (record && record.fechaFin === null) {
            texto += ' Este ticket esta asociado a una maquina en uso actualmente.';
        }
    }    

    swal({
        title: 'Eliminar ticket',
        text: texto,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ok'
    }).then((result) => {
        if (result.value) {
            eliminarTicket(idTicket);
            cleanGridAndProductControls();
        }
    });

    
});
