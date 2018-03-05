

$('#btnPagar').click(function () {
    var idComputadora = parseInt($('#sDesktops').val());
    if (sessionStorage.getItem('tickets') !== null) {
        var tickets = JSON.parse(sessionStorage.getItem('tickets'));

        var ticket = Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).firstOrDefault();
        if (ticket) {

        }
    }
    location.href = 'invoice.html'
});

$(document).ready(function () {
    fillComputerList();
    fillDesktopDropdown();
});


function fillComputerList() {
    var computerList = $('#computerList');

    $.each(getDesktopListToPay(), function (i, e) {
        var itemComputerListTemplate = $('#itemComputerList').html();
        itemComputerListTemplate = itemComputerListTemplate.replace('{idComputadora}', e.idComputadora);
        itemComputerListTemplate = itemComputerListTemplate.replace('{computerName}', e.nombre);
        var ticket = getTicketFromProductList(e.idComputadora);
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
 * Obtiene el ticket parcial de una venta
 * @param {*} idComputadora 
 */
function getTicketFromProductList(idComputadora) {
    var tickets = [];
    if (sessionStorage.getItem('tickets') !== null)
        tickets = JSON.parse(sessionStorage.getItem('tickets'));

    return Enumerable.from(tickets).where(w => w.idComputadora === idComputadora).firstOrDefault();
}

/**
 * Obtiene el registro 
 * @param {*} idComputadora 
 */
function getRecordFromRecordList(idComputadora) {
    var records = [];
    if(sessionStorage.getItem('desktopRecords') !== null)
        records = JSON.parse(sessionStorage.getItem('desktopRecords'));

    return Enumerable.from(records).where(w => w.idComputadora === idComputadora).firstOrDefault();
}

/**
 * Create the row renta on grid
 */
$(document).off('click', '#computerList a').on('click', '#computerList a', function() {
    var idComputadora = parseInt($(this).attr('id'));
    $("#sDesktops").val(idComputadora);
    var desktopRecord = getRecordFromRecordList(idComputadora);
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
    // createGridProduct(idComputadora);
});