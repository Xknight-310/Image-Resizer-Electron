const os  = require('os');
const path = require('path');
const Toastify = require('toastify-js')
const  fs  = require('fs');
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('os', {
  homedir: () => os.homedir(),
  
});

contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args),
  basename: (thePath) => path.basename(thePath), // Can't use path because it would shadow the imported path
  dirname: (thePath) => path.dirname(thePath),
});

contextBridge.exposeInMainWorld('Toastify', {
  toast: (options) => Toastify(options).showToast(),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

// this is for getting the path of the file
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getSettings: () => ipcRenderer.invoke('settings:get'),
});

// // For getting different versions
// contextBridge.exposeInMainWorld('version', {
//   getCurrentVersion: () => 'hello',
  
// });

// // For writing an reading files
// contextBridge.exposeInMainWorld('fs', {
//   read: (path) => fs.readFile(path, 'utf-8'),
//   write: (path, data) => fs.writeFile(path, data)
// });