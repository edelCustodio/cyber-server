

let apiURL = "http://localhost:6868";
let fullName = "";

//document ready
$(document).ready(function () {
    drawDesktops();
})

function drawDesktops() {
    var allDesktops = "";
    
    $.get(apiURL + "/getComputers", function(data) {

        $(data).each(function(i, pc) {
            var template = $("#computadora-tmp").html();
            template = template.replace("{idComputadora}", pc.idComputadora).replace("{nombreComputadora}", pc.nombre).replace("{idComputadora}", pc.idComputadora).replace("{idComputadora}", pc.idComputadora);
            allDesktops += template;
        })

        $("#divComputadoras").append(allDesktops);

        $.get(apiURL + "/getDesktopsInUse", function (inUse) {

            $(inUse).each(function (i, pc) {
                $("#stCompu-" + pc.idComputadora).trigger("click");
            })
            
            console.log(inUse);
        })    
        
        console.log(data);
    })

    
}

$(window).load(function () {
    
    function notifyLogin(message, type){
        $.growl({
            message: message
        },{
            type: type,
            allow_dismiss: false,
            label: 'Cancel',
            className: 'btn-xs btn-inverse',
            placement: {
                from: 'bottom',
                align: 'right'
            },
            delay: 2500,
            animate: {
                    enter: 'animated fadeInRight',
                    exit: 'animated fadeOutRight'
            },
            offset: {
                x: 30,
                y: 30
            }
        });
    };

    if (!$('.login-content')[0]) {
        
        if(sessionStorage.getItem("userLoggedIn") !== null) {
            var userInfo = JSON.parse(sessionStorage.getItem("userLoggedIn"));
            fullName = userInfo.nombreCompleto
        }
        notifyLogin('Hola de nuevo ' + fullName, 'inverse');
    }
});

/**
 * Event to turn on/off the desktop
 */
$(document).off("click", ".contacts input[type='checkbox'], a.ci-avatar").on("click", ".contacts input[type='checkbox'], a.ci-avatar", function () {
    var element = $(this)
    var input = null;
    if(element.hasClass("ci-avatar")) {
        input = element.parent().find("div.c-info input[type='checkbox']");
        if(input.is(":checked")) {
            input.prop("checked", false);
        }
        else {
            input.prop("checked", true);
        }        
    }else {
        input = element;
    }
    
    var desktopIcon = input.parent().parent().parent().find("a > i.fa")
    if(input.is(":checked")) {
        desktopIcon.attr("style", "color: #4caf50")
    }else {
        desktopIcon.attr("style", "color: #ccc")
    }
})