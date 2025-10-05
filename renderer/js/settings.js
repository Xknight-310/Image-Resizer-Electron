document.addEventListener('DOMContentLoaded', () => {
    // Show/hide custom folder input
    const outputSelect = document.getElementById('output-folder-select');
    const customDiv = document.getElementById('custom-folder-div');
    const customOutputFolder = document.getElementById('custom-output-folder')
    const ouputFormat = document.getElementById('output-format');
    const theme = document.getElementById('theme');

    window.electronAPI.getSettings().then(respons => {
      if (respons && respons.success) {
        const getSettings = respons.getSettings;
        console.log(getSettings);
        outputSelect.value = getSettings.DefaultOutput;
        customOutputFolder.value = getSettings.CustomOutputFolder;
        ouputFormat.value = getSettings.OutputFormat;
        theme.value = getSettings.Theme;
      } else {
        alert('Failed to load settings: '+ respons.error);
      }
    });
    outputSelect.addEventListener('change', () => {
      if (outputSelect.value === 'custom') {
        customDiv.style.display = 'block';
      } else {
        customDiv.style.display = 'none';
      }
    });
  
    // Back button logic
    document.getElementById('back').addEventListener('click', () => {
      window.location.href = "index.html";
    });
    // saveing the settings to settings.json by sending it to main.js and then they handel it.
    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const DefaultOutput = document.getElementById('output-folder-select').value;
      const CustomOutputFolder = document.getElementById('custom-output-folder')?.value || '';
      const OutputFormat = document.getElementById('output-format')?.value || 'jpg';
      const Theme = document.getElementById('theme')?.value || 'teal';
  
      const settings = {
        DefaultOutput,
        CustomOutputFolder,
        OutputFormat,
        Theme
      };
  
      const result = await window.electronAPI.saveSettings(settings);
      if (result.success) {
        alert('Settings saved!');
      } else {
        alert('Failed to save settings: ' + result.error);
      }
    });
  });

/*
1. make the default ouput folder logic 
2. make the settings saved in a file
3. make main.js read from the saved settings   

*/