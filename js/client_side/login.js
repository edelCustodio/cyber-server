
$(document).ready(function () {
    
})

$("#btnLogin").click(function(e){
    
    var user = $("#username").val();
    var pass = $("#password").val();
    var nIcons;

    // var loginURL = apiURL + '/api/login';
    var loginURL = apiURL + '/api/user/login';
    var usuario = {
        usuario1: user, 
        contraseña: pass,
        idUsuario: 0,
        nombreCompleto: '',
        correoElectronico: '',
        idTipoUsuario: 0
    }
    // ajaxHelper.post(loginURL, usuario,
    // function (data, textStatus, jqXHR) {
    //     // sessionStorage.setItem("userLoggedIn", JSON.stringify(data[0]));
    //     sessionStorage.setItem("token", data);

    //     document.location.href = "index.html";
    // }, errorAjaxHandler);

    $.ajax({
        url: loginURL,
        type: "POST",
        data: JSON.stringify(usuario),
        contentType: "application/json",
        success: function (data, textStatus, jqXHR) {
            // sessionStorage.setItem("userLoggedIn", JSON.stringify(data[0]));
            sessionStorage.setItem("token", data);
    
            document.location.href = "index.html";
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });

    // $.post(loginURL, { user: user, pass: pass }, function(data) {
    //     if(data) {
    //         sessionStorage.setItem("userLoggedIn", JSON.stringify(data[0]));
    //         document.location.href = "index.html";
    //     } else {

    //     }
    // });

    e.preventDefault();
});




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

        $.get(apiURL + "/api/getUserByUsername?user=" + user, function(response) {
            if($.isEmptyObject(response)) {
                $.get(apiURL + "/api/getUserByEmail?email=" + email, function(res) {
                    if($.isEmptyObject(res)) {
                        $.post(apiURL + "/api/createEmployee",{name: name, email: email, user: user, pass: pass }, function(data) {
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


  