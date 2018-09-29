
$(document).ready(function () {
    
});

$("#btnLogin").click(function (e) {
    
    var user = $("#username").val();
    var pass = $("#password").val();
    var nIcons;

    var loginURL = apiURL + 'api/user/login';
    var usuario = {
        usuario1: user, 
        contraseña: pass,
        idUsuario: 0,
        nombreCompleto: '',
        correoElectronico: '',
        idTipoUsuario: 0
    }

    $.ajax({
        url: loginURL,
        type: "POST",
        data: JSON.stringify(usuario),
        contentType: "application/json",
        success: function (data, textStatus, jqXHR) {
            // sessionStorage.setItem("userLoggedIn", JSON.stringify(data[0]));
            sessionStorage.setItem("token", data);
            const jwt = parseJwt(sessionStorage.token);
            const idUsuario = parseInt(jwt.nameid);
            ObtenerCorte(idUsuario);
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });

    e.preventDefault();
});


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
            document.location.href = "index.html";
        },
        error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
    });
}

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

        var usuario = {
            usuario1: user, 
            contraseña: pass,
            idUsuario: 0,
            nombreCompleto: name,
            correoElectronico: email,
            idTipoUsuario: 1
        }

        var createUserURL = apiURL + "api/user/create";
        $.ajax({
            url: createUserURL,
            type: "POST",
            data: JSON.stringify(usuario),
            contentType: "application/json",
            success: function (data, textStatus, jqXHR) {
                console.log(data);
                if (data.status === 200) {
                    notify(nIcons, "success", "Usuario creado! ", "El usuario fue creado satisfactoriamente.");
                    location.reload();
                } else if (data.status === 409) {
                    notify(nIcons, "warning", "Usuario existente! ", "El usuario ya existe.");
                }
            },
            error: function (data, textStatus, jqXHR) { errorAjaxHandler(data, textStatus, jqXHR); }
        });

        e.preventDefault();
    }
});


  