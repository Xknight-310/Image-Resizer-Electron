const version = document.querySelector('#version');

// window.ipcRenderer.send('get:version',)
// console.log('send to main.js')

// window.ipcRenderer.on('version', (currentVersion) => {
//     console.log(`version: ${currentVersion}`)
//     
// })
Toastify.toast({
    text: 'hello',
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    })

version.innerHTML += window.version.getCurrentVersion;