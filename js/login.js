let apiURL = "http://localhost:6868";

$(document).ready(function () {

})

$("#btnLogin").click(function(e){
    
    var user = $("#username").val();
    var pass = $("#password").val();
    var nIcons;


    $.post(apiURL + '/login', { user: user, pass: pass }, function(data) {
        if(data) {
            document.location.href = "index.html";
        } else {

        }
    });

    e.preventDefault();
});

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


$('#frNewAccont').validator().on('submit', function (e) {

    if (e.isDefaultPrevented()) {
      // handle the invalid form...
    } else {
        // everything looks good!
        
        var name = $("#newName").val();
        var email = $("#newEmail").val();
        var user = $("#newUser").val();
        var pass = $("#newPass").val();
        var isValidUser = false;
        var nIcons;

        $.get(apiURL + "/getUserByUsername?user=" + user, function(response) {
            if($.isEmptyObject(response)) {
                $.get(apiURL + "/getUserByEmail?email=" + email, function(res) {
                    if($.isEmptyObject(res)) {
                        $.post(apiURL + "/createEmployee",{name: name, email: email, user: user, pass: pass }, function(data) {
                            if(!$.isEmptyObject(data)) {
                                
                                notify(nIcons, "success", "Usuario creado! ", "El usuario fue creado satisfactoriamente.");

                                setTimeout(function() { location.reload() }, 3000);

                            } else {
                                notify(nIcons, "danger", "Ups! ", "Error al crear el usuario.");
                            } 
                        })
                    } else {
                        notify(nIcons, "warning", "Vaya! ", "Este correo ya existe."); 
                    }
                })
            }else{
                notify(nIcons, "warning", "Vaya! ", "Este usuario ya existe."); 
            }
        });
        e.preventDefault();
    }
});


  