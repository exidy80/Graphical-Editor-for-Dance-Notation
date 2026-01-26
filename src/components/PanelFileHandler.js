import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

const PanelFileHandler = () => {
  const panels = useAppStore((state) => state.panels);
  const serializePanel = useAppStore((state) => state.serializePanel);
  const deserializePanel = useAppStore((state) => state.deserializePanel);
  const setPanels = useAppStore((state) => state.setPanels);
  const clearAutoSave = useAppStore((state) => state.clearAutoSave);
  const currentFileHandle = useAppStore((state) => state.currentFileHandle);
  const setCurrentFileHandle = useAppStore(
    (state) => state.setCurrentFileHandle,
  );
  const documentTitle = useAppStore((state) => state.documentTitle);
  const setDocumentTitle = useAppStore((state) => state.setDocumentTitle);
  const getDocumentFileName = useAppStore((state) => state.getDocumentFileName);
  const setFileOperationTriggers = useAppStore(
    (state) => state.setFileOperationTriggers,
  );
  const fileInputRef = useRef(null);

  // Check if File System Access API is supported
  const hasFileSystemAccess =
    'showSaveFilePicker' in window && 'showOpenFilePicker' in window;

  // Helper function to serialize panels
  const getSerializedData = () => {
    const serializedPanels = panels
      .map((panel) => serializePanel(panel.id))
      .filter((panel) => panel !== null);
    return JSON.stringify(serializedPanels, null, 2);
  };

  // Save to existing file (if we have a handle) or show dialog
  const handleSave = useCallback(async () => {
    if (currentFileHandle && hasFileSystemAccess) {
      // We have a file handle, save directly
      try {
        const jsonString = getSerializedData();
        const writable = await currentFileHandle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        console.log('File saved successfully!');
        clearAutoSave();
        return;
      } catch (err) {
        console.error('Error saving file:', err);
        alert('Error saving file. Please try again.');
        return;
      }
    }

    // No file handle, fall through to Save As
    await handleSaveAs();
  }, [
    currentFileHandle,
    hasFileSystemAccess,
    clearAutoSave,
    getSerializedData,
  ]);

  // Always show save dialog
  const handleSaveAs = useCallback(async () => {
    try {
      const jsonString = getSerializedData();

      // Check if the File System Access API is supported
      if (hasFileSystemAccess) {
        try {
          const fileName = getDocumentFileName();
          // Show the native save dialog
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `${fileName}.json`,
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

          // Update the file handle and title from the saved filename
          setCurrentFileHandle(fileHandle);
          const savedFileName = fileHandle.name.replace(/\.json$/i, '');
          setDocumentTitle(savedFileName);

          console.log('File saved successfully!');
          clearAutoSave();
          return;
        } catch (err) {
          // User cancelled the dialog
          if (err.name === 'AbortError') {
            return;
          }
          console.error('Error with File System Access API:', err);
          // Fall through to fallback
        }
      }

      // Fallback to traditional download method
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${getDocumentFileName()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      clearAutoSave();
    } catch (error) {
      console.error('Error saving panels:', error);
      alert('Error saving file. Please try again.');
    }
  }, [
    hasFileSystemAccess,
    getSerializedData,
    getDocumentFileName,
    setCurrentFileHandle,
    setDocumentTitle,
    clearAutoSave,
  ]);

  // Define processImportedFile before handleOpen since it's used there
  const processImportedFile = useCallback(
    async (file) => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target.result);
            const jsonArray = Array.isArray(json) ? json : [];
            const loadedPanels = jsonArray
              .map((panelData) => deserializePanel(panelData))
              .filter((panel) => panel !== null);
            setPanels(loadedPanels);
            clearAutoSave(); // Clear auto-save when opening a new file
            console.log('File opened successfully!');
          } catch (error) {
            console.error('Error parsing JSON file:', error);
            alert('Error parsing JSON file. Please ensure the file is valid.');
          }
        };
        reader.readAsText(file);
      }
    },
    [deserializePanel, setPanels, clearAutoSave],
  );

  // Open a file
  const handleOpen = useCallback(async () => {
    // Check if the File System Access API is supported
    if (hasFileSystemAccess) {
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

        // Store the file handle for future saves
        setCurrentFileHandle(fileHandle);

        // Set document title from filename
        const fileName = fileHandle.name.replace(/\.json$/i, '');
        setDocumentTitle(fileName);

        await processImportedFile(file);
        return;
      } catch (err) {
        // User cancelled the dialog
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error with File System Access API:', err);
        // Fall through to fallback
      }
    }

    // Fallback to traditional file input
    fileInputRef.current.click();
  }, [
    hasFileSystemAccess,
    setCurrentFileHandle,
    setDocumentTitle,
    processImportedFile,
  ]);

  // Handle file input change for fallback
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // For fallback file input, we don't have a handle
      setCurrentFileHandle(null);

      // Set document title from filename
      const fileName = file.name.replace(/\.json$/i, '');
      setDocumentTitle(fileName);

      processImportedFile(file);
    }
    // Reset the file input to allow re-opening the same file
    event.target.value = '';
  };

  // Register file operation triggers for keyboard shortcuts
  useEffect(() => {
    setFileOperationTriggers({
      save: handleSave,
      saveAs: handleSaveAs,
      open: handleOpen,
    });
  }, [handleSave, handleSaveAs, handleOpen, setFileOperationTriggers]);

  const linkStyle = {
    //Styling for upload/download buttons
    color: 'blue',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0',
    font: 'inherit',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <button
        onClick={handleOpen}
        style={linkStyle}
        title="Open a dance notation file"
      >
        <FontAwesomeIcon icon={faFolderOpen} /> Open
      </button>
      <button
        onClick={handleSave}
        style={linkStyle}
        title={
          currentFileHandle ? 'Save to current file' : 'Save dance notation'
        }
      >
        <FontAwesomeIcon icon={faSave} /> Save
      </button>
      <button
        onClick={handleSaveAs}
        style={linkStyle}
        title="Save dance notation with a new name"
      >
        <FontAwesomeIcon icon={faSave} /> Save As...
      </button>
      <input
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PanelFileHandler;
