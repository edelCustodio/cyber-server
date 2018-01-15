

$(document).ready(function () {
    getProducts();
});

function fillComputerList() {
    var computerList = $('#computerList');
    var tickets = [];
    
    if (sessionStorage.getItem('tickets') !== null)
        tickets = JSON.parse(sessionStorage.getItem('tickets'));

    $.each(tickets, function (i, t) {
        
    });
}