'use strict';


var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
var fs = require('fs');
const Tray = electron.Tray;
const Menu = electron.Menu;

var mainWindow = null;
let appIcon = null;



app.on('window-all-closed', function() {
  	if (process.platform != 'darwin') {
  	  app.quit();
  	}
});

app.on('ready', function() {
  	mainWindow = new BrowserWindow({
		width: 1500,
		height: 800,
        minWidth: 500,
        minHeight: 300
  	});
	mainWindow.setMenu(null);

	mainWindow.loadURL('file://' + __dirname + '/index.html');


    // appIcon = new Tray(__dirname + '/icon/vk-16-b.png');
    // let contextMenu = Menu.buildFromTemplate([
    //     { label: 'Open vk-chat', click: () => { mainWindow.show() }},
    //     { label: 'Minimize to tray', click: () => { mainWindow.minimize() }},
    //     { label: 'Quit', click: () => { app.quit() }}
    // ]);
    // appIcon.setToolTip('vk chat');
    // appIcon.setContextMenu(contextMenu);
    //
    // appIcon.on('right-click', function(event, bounds) {
    //     if (mainWindow.isVisible()) {
    //         mainWindow.minimize();
    //     } else {
    //         mainWindow.show();
    //     }
    // })


  	mainWindow.webContents.openDevTools();

  	mainWindow.on('closed', function() {
  	  	mainWindow = null;
  	});

});
