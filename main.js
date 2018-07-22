const electron = require('electron');
var configuration = require('./configuration');
const { ipcMain } = require('electron')
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater')
const isDev = require('electron-is-dev')
const log = require('electron-log');
const AutoLaunch = require('auto-launch');
// const thermal_printer = require("node-thermal-printer");
// const printer = require("printer");
// const util = require('util');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// obtener impresora termica
// var ecline = printer.getPrinter('EC-PM-5890X');

// // configuracion inicial para la impresora
// thermal_printer.init({
//   type: 'epson'
// });
// thermal_printer.alignCenter();

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
var server = null;
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let mainSession

var Main = {
  createWindow: function() {

    //check for updates
    autoUpdater.checkForUpdatesAndNotify();

    var fileName = 'html/start.html';

    if (configuration.existFileConfig()) {
      fileName = 'html/login.html';
    }
  
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024, 
        height: 900,
        webPreferences: {
          partition: 'persist:name'
        }
    });
  
    mainSession = mainWindow.webContents.session
  
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, fileName),
      protocol: 'file:',
      slashes: true
    }));

    mainWindow.setMenu(null);
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
    });
  
    //Create cyber cafe server
    CyberControl.createCyberServer();

    if (!configuration.readSettings('shortcutKeys')) {
      configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
    }

    if(!configuration.existInvoiceFolder()) {
      configuration.createInvoiceFolder();
    }

    // Ejecutar la aplicacion cada vez que el SO inicie
    let autoLaunch = new AutoLaunch({
      name: 'cyber-server',
      path: app.getPath('exe'),
    });

    autoLaunch.isEnabled().then((isEnabled) => {
      if (!isEnabled) {
        autoLaunch.enable();
      }
    });
  },

  getMainWindow: function () {
    return mainWindow;
  }
}

/**
 * Imprimir ticket
 */
ipcMain.on('printTicket', (event, arg) => {
  let ticketPrinted = { result: true };
  try {
    const fileName = arg;
    mainWindow.webContents.print({silent: true});
    event.sender.send('ticketPrinted', JSON.stringify(ticketPrinted));
  } catch (e) {
    ticketPrinted.result = false;
    ticketPrinted.message = err;
    event.sender.send('ticketPrinted', JSON.stringify(ticketPrinted));
  }
  
});


/**
 * Update app
 */

/**
 * Envia notificacion a la pantalla principal
 * acerca del status de la actualizacion
 * @param {*} text Texto a enviar
 */
function sendStatusToWindow(text) {
  let title = mainWindow.getTitle();
  mainWindow.setTitle(title + ": " + text);
  log.info(text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', Main.createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (Main.mainWindow === null) {
    Main.createWindow()
  }
})

/**
 * Message communication
 */
ipcMain.on('sendIPServer', (event, arg) => {
  var ips = JSON.parse(arg);
  
  var jsonClientConfig = { hostname: os.hostname(), pathConfigFile: configuration.getFileConfig() }

  configuration.saveSettings('hostname', os.hostname());
  configuration.saveSettings('IPServer', ips.ipServer);

  // mainWindow.setSize(247, 60);
  event.sender.send('replyIPServer', JSON.stringify(jsonClientConfig));
});

// Listen for async-reply message from main process
ipcMain.on('goForIPServer', (event, arg) => {  
  // Print 2
  console.log(arg);
  var ips = { ipServer: configuration.readSettings('IPServer') };
  // Send sync message to main process
  event.sender.send('getForIPServer', JSON.stringify(ips));
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

module.exports = Main;
let CyberControl = require('./js/server_side/cyber-control.js');

