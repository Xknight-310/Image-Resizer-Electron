const  path  = require('path');
const  os  = require('os');
const  fs  = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const ResizeImg = require('resize-img');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin';

let mainWindow;

// Create the main window
function CreateMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500, 
        height: 665,
        minWidth: 400,
        minHeight:  665, // window =600 menu & titlebar = 65 // 600 + 65 = 665
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    // Open devtools if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    

    mainWindow.loadFile('./renderer/index.html');
   //Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    mainWindow.setMenu(mainMenu)
    
}

// Create window to about window
function CreateAboutWindow(){
        const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width:  300, 
        height: 300,
        autoHideMenuBar: true,          // Hides the menu
        parent: mainWindow,             // Makes the window apear in front of the parent
        modal: true,                    // Disabels the parent window
        resizable: false,
        minimizable: false,
    });



    aboutWindow.loadFile('./renderer/about.html');
    aboutWindow.on('will-move', (e) => e.preventDefault())
}

function changeToSettings() {
    mainWindow.loadFile('./renderer/settings.html')
   
}

// // Go to the home page
// function goToHomePage() {
//     mainWindow.loadFile('./renderer/index.html')
// }

// App is ready
app.whenReady().then(() => {
    CreateMainWindow();
    
    // Remove mainWindow from memory on close
    mainWindow.on('closed', () => (mainWindow = null));

    // Check is window is created and if not do so.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            CreateMainWindow()
        }
    })
});

// Menu template
const menu = [
    ...(isMac ? [{
        label: app.name, 
        submenu: [
            {
                label: 'About',
                click: CreateAboutWindow,
            }
        ]
    }] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: CreateAboutWindow,
            },{
                label: 'Settings',
                click: changeToSettings,
            },
        ]
    }] : [])
];

// Helper to read settings.txt
function readSettings() {
    const settingsPath = path.join(__dirname, 'settings.json');
    let settings =  {
  "DefaultOutput": "homdir",
  "CustomOutputFolder": "",
  "OutputFormat": "jpg",
  "Theme": "teal"
} ; // fallback default

    try {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(data);
        console.log(settings)
    } catch (err) {
        console.log('Could not read settings.json, using defaults.\n' + err);
    }
    return settings;
}

// Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    const settings = readSettings();
    let dest;
    if (settings.DefaultOutput === 'homedir') {
        console.log('homedir')
        dest = path.join(os.homedir(), 'image-resizer');
    } else if (settings.DefaultOutput === 'fileloc') {
        dest = path.dirname(options.imgPath);
    } else if (settings.DefaultOutput === 'custom' && settings.CustomOutputFolder) {
        dest = settings.CustomOutputFolder;
    } else {
        console.log('YES')
        dest = path.join(os.homedir(), 'image-resizer');
    }
    options.dest = dest;
    console.log(options.dest)
    resizeImage(options);
});

// Resize the image
async function resizeImage({imgPath, width, height, dest}) {
    try{
        const newImg = await ResizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });
        
        // Create filename
        let filesplit = path.basename(imgPath).split('.');
        const settings = readSettings()
        const filename = filesplit[0];
        const extension =  settings.OutputFormat;//filesplit[1];
        // const extension = filename.split('.').pop().toLowerCase();
        console.log('filename: ',filename)
        console.log('extension: ',extension)

        // Create dest folder is not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        // Write file to dest folder
        fs.writeFileSync(path.join(dest, (filename + '.' + extension)), newImg);

        // Send success to renderer
        mainWindow.webContents.send('image:done');

        // Open dest folder
        shell.openPath(dest);

    } catch (error) {
        console.log(error)
    }
}

ipcMain.on('get:version', () => {
    return app.getVersion();
    console.log('send to about.js')
});
// On MacOS the window doesn't close automaticly when you click the X so we are doing it here manualy.
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

// This is for getting the path of the file
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  return { canceled, filePaths };
});
// saves the settings to settings.json
ipcMain.handle('settings:save', async (event, settings) => {
    const settingsPath = path.join(__dirname, 'settings.json');
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});
// returns the settings from settings.json
ipcMain.handle('settings:get',  () => {
    try {
        let settings = readSettings() // <-- Parse the JSON!
        let dest;
        if (settings.DefaultOutput === 'homedir') {
            dest = path.join(os.homedir(), 'image-resizer');
        } else if (settings.DefaultOutput === 'fileloc') {
            dest = 'fileloc';
        } else if (settings.DefaultOutput === 'custom' && settings.CustomOutputFolder) {
            dest = settings.CustomOutputFolder;
        } else {
            dest = path.join(os.homedir(), 'image-resizer');
        }
        settings.outputPath = dest;
        return { success: true, getSettings: settings };
    } catch (err) {
        return { success: false, error: err }
    }
});