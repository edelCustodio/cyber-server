
$(document).ready(function () {

})

$("#btnLogin").click(function(){
    /*
    var user = $("#user").val();
    var pass = $("#password").val();

    $.post('http://localhost:6868/login', {user: user, pass: pass }, function(data) {
        console.log(data);
    })
*/
    var nFrom, nAlign, nIcons, nAnimIn, nAnimOut;
    var nType = 'success';
    notify(nFrom, nAlign, nIcons, nType, nAnimIn, nAnimOut);

    /*
    $.ajax({
        method: 'POST',
        url: 'http://localhost:6969/login',
        data: JSON.stringify({user: user, pass: pass })
    }).then(function (response){
        console.log(response);
    })
    */


});

/*--------------------------------------
         Notifications & Dialogs
     ---------------------------------------*/
    /*
     * Notifications
     */
    function notify(from, align, icon, type, animIn, animOut){
        $.growl({
            icon: icon,
            title: ' Bootstrap Growl ',
            message: 'Turning standard Bootstrap alerts into awesome notifications',
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
            animate: {
                enter: animIn,
                exit: animOut
            },
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


$('#frNewAccont').validator().on('submit', function (e) {
    if (e.isDefaultPrevented()) {
      // handle the invalid form...
    } else {
      // everything looks good!

      var nFrom, nAlign, nIcons, nAnimIn, nAnimOut;
      var nType = 'success';
      notify(nFrom, nAlign, nIcons, nType, nAnimIn, nAnimOut);
    }
  });


  