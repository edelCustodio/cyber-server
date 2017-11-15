const {session} = require('electron')
var ses = session.fromPartition('persist:name');


var SessionHelper = {
    createSession: function(username, password) {
       
    },

    checkSessionAvailable: function(username, password) {

    }
}

module.exports = SessionHelper;