const form = document.querySelector('#img-form');
const selectBtn = document.querySelector('#select-image');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

let selectedImagePath = null;


form.addEventListener('submit', sendImage);
// loads the image
selectBtn.addEventListener('click', async () => {
    const result = await electronAPI.openFileDialog();
    if (!result.canceled && result.filePaths.length >= 0) {
        selectedImagePath = result.filePaths[0];
        const extension = window.path.basename(selectedImagePath).split('.').pop().toLowerCase();
        if (!isFileImage(('.' + extension))){
            alertError('Please select an image with the allowed extensions: [.jpg, .jpeg, .png, .gif].');
            return;
        }
        filename.innerHTML = window.path.basename(selectedImagePath);
        // outputPath.innerHTML = window.path.join(window.os.homedir(), 'image-resizer');
        form.style.display = 'block';
        window.electronAPI.getSettings().then(respons => {
            if (respons && respons.success) {
                // let filesplit = path.basename(imgPath).split('.');
                // const filename = filesplit[0];
                if (respons.getSettings.outputPath === 'fileloc') {
                    outputPath.innerHTML= window.path.dirname(selectedImagePath);
                } else {
                    outputPath.innerHTML= respons.getSettings.outputPath;
                }
                
            } else {
                alert('Failed to load settings: '+ respons.error);
            }
        })
        // Preview image and get dimensions
        const image = new Image();
        image.src = selectedImagePath;
        image.onload = function () {
            widthInput.value = this.width;
            heightInput.value = this.height;
        };
    }
});


// Send image date to main.js
function sendImage(e) {
    e.preventDefault();

    const width = widthInput.value;
    const height = heightInput.value;
    const imgPath = selectedImagePath;
    // Remove selectedImagePath from memory
    selectedImagePath = null;

    if (imgPath == null) {
        alertError('Please upload an image');
        return;
    }
    if (width === '' || height === '' || width == 0 || height == 0) {
        alertError('Please fill in a height and width');
        return;
    }

    // Send to main using ipcRenderer
    ipcRenderer.send('image:resize', {
        imgPath,
        width,
        height,
    });

    
}

// catch the image:done event
ipcRenderer.on('image:done', () => {
    alertSucces(`Image resized to ${widthInput.value} x ${heightInput.value}`)
    form.style.display = 'none';
})
 
// Make sure if file is image
function isFileImage(extension) {
    const acceptedImageTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    return extension && acceptedImageTypes.includes(extension);
}

function alertError(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    })
}

function alertSucces(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center'
        }
    })
}



