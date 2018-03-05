const electron = require('electron');
var configuration = require('./configuration');
const { ipcMain } = require('electron')
const fs = require('fs');

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
      pathname: path.join(__dirname, 'html/login.html'),
      protocol: 'file:',
      slashes: true
    }))
  
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  
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
  },

  getMainWindow: function () {
    return mainWindow;
  }
}

/**
 * Convert ticket on PDF
 */
ipcMain.on('createPDF', (event, arg) => {
  const fileName = arg;

  mainWindow.webContents.printToPDF({
    printBackground: true,
    landscape: false
  }, function(err, data) {
    console.log(data);
    fs.writeFile(fileName, data, function(err) {
      let pdfCreated = { result: true };
      if(!err) {
        event.sender.send('PDFCreated', JSON.stringify(pdfCreated));
      } else {
        pdfCreated.result = false;
        pdfCreated.message = err;
        event.sender.send('PDFCreated', JSON.stringify(pdfCreated));
      }
    })
  });
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

module.exports = Main;
let CyberControl = require('./js/server_side/cyber-control.js');

