import React, { useRef } from 'react';
import { useAppContext } from './AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';

const PanelFileHandler = () => {
  const { panels, serializePanel, deserializePanel, setPanels } = useAppContext();
  const fileInputRef = useRef(null);

  const downloadPanels = () => {
    const serializedPanels = panels.map(panel => serializePanel(panel.id));//map over panels
    const jsonString = JSON.stringify(serializedPanels);//convert the array to json string
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'panels.json'; // file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);//remove the URL created earlier
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const uploadPanels = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const loadedPanels = json.map(panelData => deserializePanel(panelData));
          setPanels(loadedPanels);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const linkStyle = { //Styling for upload/download buttons
    color: 'blue',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0',
    font: 'inherit',
    marginRight: '15px'
  };

  return (
    <div>
      <button onClick={downloadPanels} style={linkStyle}>
        <FontAwesomeIcon icon={faDownload} /> Save Dance
      </button>
      <input
        type="file"
        accept=".json"
        onChange={uploadPanels}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button onClick={handleUploadClick} style={linkStyle}>
        <FontAwesomeIcon icon={faUpload} /> Import Dance
      </button>
    </div>
  );
};

export default PanelFileHandler;