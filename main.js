const electron = require('electron')
const net = require('net');
let SQLHelper = require('./js/server_side/sql-helper.js');

// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
var server = null;

global.clients = [];

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let mainSession

function createWindow () {
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 800, 
      height: 600,
      webPreferences: {
        partition: 'persist:name'
      }
  });

  mainSession = mainWindow.webContents.session

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'login.html'),
    protocol: 'file:',
    slashes: true
  }))

  let server = require('./js/server_side/server')
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
  createCyberServer();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function createCyberServer() {
  
  var host = '127.0.0.1';
  var port = 6969;
  
  // Create a server instance, and chain the listen function to it
  // The function passed to net.createServer() becomes the event handler for the 'connection' event
  // The sock object the callback function receives UNIQUE for each connection
  server = net.createServer(function(sock) {
    var client = {
      client: sock,
      isOnline: true
    };
    
    if(clients.length > 0){
      for(var i = 0; i < clients.length; i++){
        if(clients[i].client = client.client){
          console.log('I already have this client on the list. '+ client.client);
        }
      }
    }

    clients.push(client);
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        
      var textData = data.toString('utf8');
      console.log('DATA ' + sock.remoteAddress + ': ' + data);
      // Write the data back to the socket, the client will receive it as data from the server
      sock.write('You said "' + textData + '"');
        
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });

    sock.on('error', function(data){
      console.error('Error message: ' + data.message + '\n\nStack' + data.stack);
    });

    sock.on('clientError', function(data){
      console.error('Client Error message: ' + data.message + '\n\nStack' + data.stack);
      
    });
    
    sock.write('hello world\r\n');
  });

  server.listen(port, host);
  
  console.log('Server listening on ' + host +':'+ port);
}

var serverCookiesHandler = {
  setCookie: function(username) {
    
    mainSession.cookies.set({
      url: 'http://localhost:6969',
      name: username,
      value: username,
      domain: 'cyber.skynet.com'
    }, (error) => {
      console.log(error);
    })
  }
}

module.exports = serverCookiesHandler
