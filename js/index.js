
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