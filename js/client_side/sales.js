


$(document).ready(function () {
    getProducts();
    fillComputerList();
    fillDesktopDropdown();
});


/**
 * Crear la lista de computadoras pendientes por cobrar
 */
function fillComputerList() {
    var computerList = $('#computerList');

    $.each(getDesktopListToPay(), function (i, e) {
        var itemComputerListTemplate = $('#itemComputerList').html();
        itemComputerListTemplate = itemComputerListTemplate.replace('{idComputadora}', e.idComputadora);
        itemComputerListTemplate = itemComputerListTemplate.replace('{computerName}', e.nombre);
        var ticket = getTicketByIdComputer();
        if(ticket) {
            if (ticket.productos.length > 0)
                itemComputerListTemplate = itemComputerListTemplate.replace('{products}', ticket.productos.length + (ticket.productos.length > 1 ? ' productos' : ' producto'));
        } else 
            itemComputerListTemplate = itemComputerListTemplate.replace('{products}', '');

        computerList.append(itemComputerListTemplate);
    });
}

/**
 * Obtiene la lista de las maquinas pendientes por cobrar
 */
function getDesktopListToPay() {
    var desktopList = [];
    if (sessionStorage.getItem('desktopsToPurchase') !== null)
        desktopList = JSON.parse(sessionStorage.getItem('desktopsToPurchase'));

    return desktopList;
}

/**
 * Obtiene el registro 
 */
function getRecordFromRecordList() {
    var records = [];
    if(sessionStorage.getItem('desktopRecords') !== null)
        records = JSON.parse(sessionStorage.getItem('desktopRecords'));

    return Enumerable.from(records).where(w => w.idComputadora === _idComputadora).firstOrDefault();
}

/**
 * Eliminar registro generado
 */
function deleteDesktopRecord() {
    var records = JSON.parse(sessionStorage.getItem('desktopRecords'));
    records = $.grep(records, function (r) {
        return r.idComputadora !== _idComputadora;
    });

    // borrar item de session storage
    sessionStorage.removeItem('desktopRecords');

    if (records.length > 0) {
        // crear otro objeto en session storage con la informacion actualizada.
        sessionStorage.setItem('desktopRecords', JSON.stringify(records));
    }
}

/**
 * Eliminar el objeto de la computadora cuando ya fue procesado el pago
 */
function deleteDesktopPurchased() {
    var desktops = JSON.parse(sessionStorage.getItem('desktopsToPurchase'));
    desktops = $.grep(desktop, function (r) {
        return r.idComputadora !== _idComputadora;
    });

    // borrar item de session storage
    sessionStorage.removeItem('desktopsToPurchase');

    if (desktops.length > 0) {
        // crear otro objeto en session storage con la informacion actualizada.
        sessionStorage.setItem('desktopsToPurchase', JSON.stringify(desktops));
    }    
}

/**
 * Create the row renta on grid
 */
$(document).off('click', '#computerList a').on('click', '#computerList a', function() {
    _idComputadora = parseInt($(this).attr('id'));
    if (!_newTicket) {
        $("#sDesktops").val(_idComputadora);
        var desktopRecord = getRecordFromRecordList();
        let renta = {};
        let products = [];
        if (sessionStorage.getItem('products') !== null)
            products = JSON.parse(sessionStorage.getItem('products'));
    
        // 1360 is the ID for 'Renta de equipo de computo' on product table
        var idRenta = 1360;
        
        renta = Enumerable.from(products).where(w => w.idProducto === idRenta).firstOrDefault();
        $('#sProductos').val(idRenta);
        $('#iCantidad').val(1);
        $('#iPrecio').val(renta.precio);
        $('#iTotal').val(desktopRecord.totalPagar);
        addProductToTicket();
    } else {
        notify('top', 'right', 'fa fa-comments', 'warning', ' Cambiar ticket, ', 'si desea ver el ticket de un PC, desactivar "Crear nuevo ticket" switch.');
    }
});


/**
 * evento que se ejecuta al momento de presionar el boton pagar
 */
$('#btnPagar').click(function () {
    
    if (!_newTicket) {
        var record = getRecordFromRecordList();
        var ticket = getTicketByIdComputer();
        var total = Enumerable.from(ticket.productos).sum(s => s.total);
        var detalles = [];
        ticket.productos.forEach(p => {
            const detalle = {
                idTicketDetalle: 0,
                idTicket: 0,
                idProducto: p.idProducto,
                cantidad: p.cantidad
            }

            detalles.push(detalle);
        });

        var saleTicket = {
            total: total,
            pago: parseFloat($('#iPago').val()),
            cambio: parseFloat($('#iCambio').val()),
            idRegistro: record.idRegistro,
            ticketsDetalle: detalles
        } 

        guardarTicketVenta(saleTicket);


    } else {
        var saleTicket = JSON.parse(sessionStorage.getItem('saleTicket'));

        guardarTicketVenta(saleTicket);
    }
    
    // location.href = 'invoice.html'
});

/**
 * Guarda el ticket con su detalle de la venta
 * @param {Object} saleTicket objeto del ticket de venta
 */
function guardarTicketVenta(saleTicket) {
    $.post(apiURL + '/api/createTicket', saleTicket, function (data) {
        if (data.result) {
            let listInserts = buildTicketDetailInsert(data.idTicket, saleTicket.ticketsDetalle);

            //call method to insert data
            $.post(apiURL + '/api/createTicketDetalle', { strInsert: listInserts }, function(data) {
                if (data.result) {

                    if(!_newTicket) {
                        // eliminar desktop del ticket
                        deleteTicketByIdComputer();
                        
                        // recrear la lista de computadoras por cobrar
                        fillComputerList();

                        // eliminar registro
                        deleteDesktopRecord();

                        // eliminar computadora procesada
                        deleteDesktopPurchased();
                    }

                    // limpiar el grid
                    cleanGridAndProductControls();

                    // mensaje
                    notify('top', 'right', 'fa fa-comments', 'success', ' Ticket guardado, ', 'el ticket fue generado satisfactoriamente.');

                    // remove data
                    sessionStorage.removeItem('saleTicket');
                }
            })
        }
    });
}

/**
 * Construye los inserts para el detalle del ticket
 * @param {array} arrayData data has the info will be inserted
 */
function buildTicketDetailInsert(idTicket, arrayData) {
    let listInserts = '';
    arrayData.forEach(item => {
        let insert = `INSERT INTO Entidad.TicketDetalle (idTicket, idProducto, cantidad) 
                        VALUES (` + idTicket + `, ` + item.idProducto + `, ` + item.cantidad + `)\n`;

        listInserts += insert;
    });

    return listInserts;
}



$('#newTicket').click(function () {
    _newTicket = !_newTicket;
    cleanGridAndProductControls();
    console.log(_newTicket);
})

$('#iPago').keyup(function () {
    var pago = parseInt($(this).val());
    var cambio = 0;
    if (!_newTicket) {
        var ticket = getTicketByIdComputer();
        var total = Enumerable.from(ticket.productos).sum(s => s.total);
        cambio = pago - total;
    } else {
        var saleTicket = JSON.parse(sessionStorage.getItem('saleTicket'));
        var total = Enumerable.from(saleTicket.ticketsDetalle).sum(s => s.total);
        cambio = pago - total;
    
        saleTicket.total = total;
        saleTicket.cambio = cambio;
        saleTicket.pago = pago;
    
        sessionStorage.setItem('saleTicket', JSON.stringify(saleTicket));
    }

    

    $('#iCambio').val(cambio);
});