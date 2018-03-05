var ipcRenderer = require('electron').ipcRenderer;

$('#btnPrint').click(function () {
    const path = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var ticketNumber = sessionStorage.getItem('ticketNumber')
    ipcRenderer.send('createPDF', path + '/invoices/enlace-factura-' + ticketNumber + '.pdf');
});

/**
 * Once a pdf was created, it returns to validate if was created correctly
 * and go back to punto-venta.html
 */
ipcRenderer.on('PDFCreated', (event, arg) => {
    var pdfCreated = JSON.parse(arg);
    if (pdfCreated.result) {
        location.href = 'punto-venta.html';
    } else {
        console.log(pdfCreated.message);
    }
});


$(document).ready(function () {
    
})
