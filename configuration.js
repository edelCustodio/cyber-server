
'use strict';

var nconf = require('nconf').file({file: getUserHome() + '/cyber-server-config.json'});
const fs = require('fs');
const invoiceFolderPath = getUserHome() + '/invoices';

function saveSettings(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function readSettings(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function createInvoiceFolder() {
    fs.mkdirSync(invoiceFolderPath);
}

function existInvoiceFolder() {
    return fs.existsSync(invoiceFolderPath);
}

module.exports = {
    saveSettings: saveSettings,
    readSettings: readSettings,
    existInvoiceFolder: existInvoiceFolder,
    createInvoiceFolder: createInvoiceFolder,
    getUserHome: getUserHome
};