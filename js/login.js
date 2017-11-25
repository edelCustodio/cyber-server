let apiURL = "http://localhost:6868";

$(document).ready(function () {

})

$("#btnLogin").click(function(e){
    
    var user = $("#username").val();
    var pass = $("#password").val();
    var nIcons;


    $.post(apiURL + '/login', { user: user, pass: pass }, function(data) {
        if(data) {
            sessionStorage.setItem("userLoggedIn", JSON.stringify(data[0]));
            document.location.href = "index.html";
        } else {

        }
    });

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


  