import React, { useRef } from 'react';
import { useAppStore } from './useAppStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';

const PanelFileHandler = () => {
  const panels = useAppStore((state) => state.panels);
  const serializePanel = useAppStore((state) => state.serializePanel);
  const deserializePanel = useAppStore((state) => state.deserializePanel);
  const setPanels = useAppStore((state) => state.setPanels);
  const clearAutoSave = useAppStore((state) => state.clearAutoSave);
  const fileInputRef = useRef(null);

  // Check if File System Access API is supported
  const hasFileSystemAccess =
    'showSaveFilePicker' in window && 'showOpenFilePicker' in window;

  const downloadPanels = async () => {
    try {
      // Filter out any null panels and serialize them
      const serializedPanels = panels
        .map((panel) => serializePanel(panel.id))
        .filter((panel) => panel !== null); // Remove any null results

      const jsonString = JSON.stringify(serializedPanels, null, 2); // Pretty format with indentation

      // Check if the File System Access API is supported (Chrome 86+, Edge 86+)
      if ('showSaveFilePicker' in window) {
        try {
          // Show the native save dialog
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'dance-notation.json',
            types: [
              {
                description: 'JSON files',
                accept: {
                  'application/json': ['.json'],
                },
              },
            ],
          });

          // Create a writable stream and write the data
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();

          console.log('File saved successfully!');
          clearAutoSave(); // Clear auto-save since we've manually saved
          return;
        } catch (err) {
          // User cancelled the dialog or there was an error
          if (err.name !== 'AbortError') {
            console.error('Error with File System Access API:', err);
          } else {
            // User cancelled, just return without showing fallback
            return;
          }
        }
      }

      // Fallback to traditional download method for browsers that don't support File System Access API
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'dance-notation.json'; // Default filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL
      clearAutoSave(); // Clear auto-save since we've manually saved
    } catch (error) {
      console.error('Error saving panels:', error);
      // Optionally, you could show a user-friendly error message here
    }
  };

  const handleUploadClick = async () => {
    // Check if the File System Access API is supported
    if ('showOpenFilePicker' in window) {
      try {
        // Show the native open dialog
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'JSON files',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
          multiple: false,
        });

        const file = await fileHandle.getFile();
        await processImportedFile(file);
        return;
      } catch (err) {
        // User cancelled the dialog or there was an error
        if (err.name !== 'AbortError') {
          console.error('Error with File System Access API:', err);
        } else {
          // User cancelled, just return
          return;
        }
      }
    }

    // Fallback to traditional file input for browsers that don't support File System Access API
    fileInputRef.current.click();
  };

  const processImportedFile = async (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          // Ensure json is an array and filter out any null results from deserialization
          const jsonArray = Array.isArray(json) ? json : [];
          const loadedPanels = jsonArray
            .map((panelData) => deserializePanel(panelData))
            .filter((panel) => panel !== null); // Remove any null panels
          setPanels(loadedPanels);
          console.log('File imported successfully!');
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Error parsing JSON file. Please ensure the file is valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  const uploadPanels = (event) => {
    const file = event.target.files[0];
    processImportedFile(file);
    // Reset the file input to allow re-importing the same file
    event.target.value = '';
  };

  const linkStyle = {
    //Styling for upload/download buttons
    color: 'blue',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0',
    font: 'inherit',
    marginRight: '15px',
  };

  return (
    <div>
      <button
        onClick={downloadPanels}
        style={linkStyle}
        title={
          hasFileSystemAccess
            ? 'Save dance notation with file dialog'
            : 'Download dance notation file'
        }
      >
        <FontAwesomeIcon icon={faDownload} />
        {hasFileSystemAccess ? 'Save Dance As...' : 'Save Dance'}
      </button>
      <input
        type="file"
        accept=".json"
        onChange={uploadPanels}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleUploadClick}
        style={linkStyle}
        title={
          hasFileSystemAccess
            ? 'Open dance notation with file dialog'
            : 'Import dance notation file'
        }
      >
        <FontAwesomeIcon icon={faUpload} />
        {hasFileSystemAccess ? 'Open Dance...' : 'Import Dance'}
      </button>
    </div>
  );
};

export default PanelFileHandler;
