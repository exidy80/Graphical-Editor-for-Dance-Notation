import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, ButtonGroup, Button } from 'react-bootstrap';
import { useAppStore } from '../stores';
import PanelFileHandler from './PanelFileHandler';
import ZoomControl from './ZoomControl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faLockOpen,
  faLock,
  faLink,
  faUnlink,
  faRefresh,
  faFilePdf,
  faCompressArrowsAlt,
} from '@fortawesome/free-solid-svg-icons';

const Toolbar = () => {
  const handleHeadSelection = useAppStore((state) => state.handleHeadSelection);
  const handleHandSelection = useAppStore((state) => state.handleHandSelection);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const selectedDancer = useAppStore((state) => state.selectedDancer);
  const opacity = useAppStore((state) => state.opacity);
  const handleOpacityChange = useAppStore((state) => state.handleOpacityChange);
  const handleDelete = useAppStore((state) => state.handleDelete);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const selectedShapeId = useAppStore((state) => state.selectedShapeId);
  const panels = useAppStore((state) => state.panels);
  const setLockModeActive = useAppStore((state) => state.setLockModeActive);
  const lockUi = useAppStore((state) => state.lockUi);
  const getLockForHand = useAppStore((state) => state.getLockForHand);
  const removeLockById = useAppStore((state) => state.removeLockById);
  const lockOverlappingHands = useAppStore(
    (state) => state.lockOverlappingHands,
  );
  const resetDancers = useAppStore((state) => state.resetDancers);
  const recenterAllPanels = useAppStore((state) => state.recenterAllPanels);
  const documentTitle = useAppStore((state) => state.documentTitle);
  const setDocumentTitle = useAppStore((state) => state.setDocumentTitle);
  const getDocumentFileName = useAppStore((state) => state.getDocumentFileName);
  const hasUnsavedChanges = useAppStore((state) => state.hasUnsavedChanges);

  //Gets the colour of the selected object in order to theme the toolbar buttons
  const getSelectedColour = () => {
    if (selectedDancer) {
      const panel = panels.find((p) => p.id === selectedDancer.panelId);
      const dancer = panel?.dancers.find(
        (d) => d.id === selectedDancer.dancerId,
      );
      return dancer?.colour;
    } else if (selectedShapeId) {
      const panel = panels.find((p) => p.id === selectedShapeId.panelId);
      const shape = panel?.shapes.find((s) => s.id === selectedShapeId.shapeId);
      return shape?.fill || shape?.stroke;
    }
    return null;
  };

  const selectedColour = getSelectedColour();

  const colouredButtonStyle = selectedColour
    ? {
        backgroundColor: selectedColour,
        borderColor: selectedColour,
        color: 'white',
      }
    : {};

  const exportPanelsToPDF = async () => {
    try {
      const gridElement = document.querySelector('.position-panel-grid');
      if (!gridElement) {
        alert('No panels found to export');
        return;
      }

      // Get all panel containers (not just canvases)
      const panelContainers = gridElement.querySelectorAll('.position-panel');
      if (panelContainers.length === 0) {
        alert('No panels found to export');
        return;
      }

      // Get filename first
      let pdfFilename = 'dance-notation.pdf';

      // Use document title for PDF filename
      const fileName = getDocumentFileName();

      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `${fileName}.pdf`,
            types: [
              {
                description: 'PDF files',
                accept: {
                  'application/pdf': ['.pdf'],
                },
              },
            ],
          });
          pdfFilename = fileHandle.name;
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }
          getDocumentFileName();
        }
      } else {
        const filename = prompt('Enter PDF filename:', 'dance-notation');
        if (filename === null || !filename.trim()) {
          return;
        }
        pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      }

      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Create PDF with portrait orientation (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // Calculate how many panels can fit per row and per page
      const panelsPerRow = 2; // 2 columns
      const spacing = 10; // mm between panels
      const panelWidth = (contentWidth - spacing) / panelsPerRow;
      const panelHeight = panelWidth; // Square panels

      // Calculate how many rows fit on a page
      const rowsPerPage = Math.floor(
        (contentHeight + spacing) / (panelHeight + spacing),
      );
      const panelsPerPage = panelsPerRow * rowsPerPage;

      // Capture each panel as an image
      const panelImages = [];
      for (let i = 0; i < panelContainers.length; i++) {
        const container = panelContainers[i];

        // Temporarily convert Konva canvas to image for better rendering
        const canvas = container.querySelector('canvas');
        let tempImg = null;
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png');
          tempImg = document.createElement('img');
          tempImg.src = dataURL;
          tempImg.style.width =
            canvas.style.width ||
            `${canvas.width / (window.devicePixelRatio || 1)}px`;
          tempImg.style.height =
            canvas.style.height ||
            `${canvas.height / (window.devicePixelRatio || 1)}px`;
          tempImg.style.display = 'block';
          canvas.style.display = 'none';
          canvas.parentNode.insertBefore(tempImg, canvas);
        }

        const capturedCanvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
        });

        // Restore canvas
        if (canvas && tempImg) {
          canvas.style.display = '';
          tempImg.remove();
        }

        panelImages.push(capturedCanvas.toDataURL('image/png'));
      }

      // Add panels to PDF, creating new pages as needed
      let isFirstPage = true;
      for (let i = 0; i < panelImages.length; i++) {
        const pageIndex = Math.floor(i / panelsPerPage);
        const indexOnPage = i % panelsPerPage;

        // Add new page if needed
        if (i > 0 && indexOnPage === 0) {
          pdf.addPage();
        }

        // Calculate position on page
        const row = Math.floor(indexOnPage / panelsPerRow);
        const col = indexOnPage % panelsPerRow;

        const x = margin + col * (panelWidth + spacing);
        const y = margin + row * (panelHeight + spacing);

        // Add panel image to PDF
        pdf.addImage(panelImages[i], 'PNG', x, y, panelWidth, panelHeight);
      }

      pdf.save(pdfFilename);
      console.log(
        `PDF saved successfully with ${
          panelImages.length
        } panels on ${Math.ceil(panelImages.length / panelsPerPage)} page(s)!`,
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="perspective-selection">
      <div className="options-group">
        {/* Document Title Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '20px',
            position: 'relative',
          }}
        >
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>
            Title:
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="Untitled Dance"
            style={{
              padding: '5px 10px',
              border: hasUnsavedChanges
                ? '2px solid #ff6b6b'
                : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px',
              backgroundColor: hasUnsavedChanges ? '#fff5f5' : 'white',
            }}
            title={
              hasUnsavedChanges
                ? 'You have unsaved changes (Cmd+S to save)'
                : 'Document title'
            }
          />
          {hasUnsavedChanges && (
            <span
              style={{
                position: 'absolute',
                right: '10px',
                color: '#ff6b6b',
                fontSize: '18px',
                fontWeight: 'bold',
                pointerEvents: 'none',
              }}
              title="Unsaved changes"
            >
              •
            </span>
          )}
        </div>

        <Dropdown className="custom-dropdown">
          <Dropdown.Toggle
            variant={selectedDancer ? 'primary' : 'outline-secondary'}
            id="head-dropdown"
            disabled={!selectedDancer}
            style={selectedDancer ? colouredButtonStyle : {}}
          >
            {selectedDancer ? 'Select Head' : 'Select Head'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {/* Options for shape of head */}
            <Dropdown.Item onClick={() => handleHeadSelection('Upright')}>
              Upright
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHeadSelection('Bow')}>
              Bow
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHeadSelection('Duck')}>
              Duck
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown className="custom-dropdown">
          <Dropdown.Toggle
            variant={selectedHand ? 'primary' : 'outline-secondary'}
            id="hand-dropdown"
            disabled={!selectedHand}
            style={selectedHand ? colouredButtonStyle : {}}
          >
            {selectedHand ? 'Select Hand' : 'Select Hand'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {/* Options for shape of hand */}
            <Dropdown.Item onClick={() => handleHandSelection('Overhead')}>
              Overhead
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Shoulder')}>
              Shoulder
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Waist')}>
              Waist
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Hip')}>
              Hip
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Knee')}>
              Knee
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <ButtonGroup className="custom-btn-group">
          {/* Toggles the opacity of the dancers */}
          <Button
            onClick={() => handleOpacityChange('dancers')}
            variant={
              opacity.dancers.value === 1 ? 'outline-primary' : 'primary'
            }
            className="icon-button"
          >
            <FontAwesomeIcon
              icon={opacity.dancers.value === 1 ? faLockOpen : faLock}
            />
            <span className="button-text">Dancers</span>
          </Button>
          {/* Toggles the opacity of the shapes */}
          <Button
            onClick={() => handleOpacityChange('symbols')}
            variant={
              opacity.symbols.value === 1 ? 'outline-primary' : 'primary'
            }
            className="icon-button"
          >
            <FontAwesomeIcon
              icon={opacity.symbols.value === 1 ? faLockOpen : faLock}
            />
            <span className="button-text">Symbols</span>
          </Button>
        </ButtonGroup>

        {/* Global zoom control */}
        <ZoomControl />

        <ButtonGroup className="custom-btn-group">
          <Button
            onClick={() => {
              if (!lockUi.active && selectedPanel) {
                // One-click: lock any overlapping hands in current panel
                lockOverlappingHands(selectedPanel);
              } else {
                setLockModeActive(!lockUi.active);
              }
            }}
            variant={lockUi.active ? 'primary' : 'outline-primary'}
            className="icon-button"
          >
            <FontAwesomeIcon icon={faLink} />
            <span className="button-text">Hold Hands</span>
          </Button>
          <Button
            onClick={() => {
              if (!selectedHand) return;
              const lock = getLockForHand(
                selectedHand.panelId,
                selectedHand.dancerId,
                selectedHand.handSide,
              );
              if (lock) removeLockById(selectedHand.panelId, lock.id);
            }}
            variant={
              selectedHand &&
              getLockForHand(
                selectedHand?.panelId,
                selectedHand?.dancerId,
                selectedHand?.handSide,
              )
                ? 'danger'
                : 'outline-danger'
            }
            className="icon-button"
            disabled={
              !selectedHand ||
              !getLockForHand(
                selectedHand?.panelId,
                selectedHand?.dancerId,
                selectedHand?.handSide,
              )
            }
          >
            <FontAwesomeIcon icon={faUnlink} />
            <span className="button-text">Release Hands</span>
          </Button>
        </ButtonGroup>

        {/* Deletes the currently selected shape */}
        <Button
          onClick={() => selectedShapeId && handleDelete(selectedShapeId)}
          variant={selectedShapeId ? 'danger' : 'outline-danger'}
          className="icon-button"
          disabled={!selectedShapeId}
          style={selectedShapeId ? colouredButtonStyle : {}}
        >
          <FontAwesomeIcon icon={faTrash} />
          <span className="button-text">Delete Symbol</span>
        </Button>
      </div>

      <div className="file-handler">
        {/* Export panels to PDF */}
        <Button
          onClick={exportPanelsToPDF}
          variant="outline-primary"
          className="icon-button"
          title="Export all panels to PDF"
        >
          <FontAwesomeIcon icon={faFilePdf} />
          <span className="button-text">Save to PDF...</span>
        </Button>
        {/* Recenter all panels */}
        <Button
          onClick={() => {
            if (
              window.confirm(
                'Recenter all panels? This will move all dancers and shapes to center the stage markers.',
              )
            ) {
              recenterAllPanels();
            }
          }}
          variant="outline-success"
          className="icon-button"
          title="Recenter all panels to center the stage markers"
        >
          <FontAwesomeIcon icon={faCompressArrowsAlt} />
          <span className="button-text">Recenter Panels</span>
        </Button>
        {/* Reset to default state */}
        <Button
          onClick={() => {
            if (
              window.confirm(
                'Reset all dancers to default state? This will clear all panels and dancers.',
              )
            ) {
              resetDancers();
            }
          }}
          variant="outline-danger"
          className="icon-button"
          title="Reset all dancers to default state"
        >
          <FontAwesomeIcon icon={faRefresh} />
          <span className="button-text">Reset Dancers</span>
        </Button>
        {/* Renders the save/load component */}
        <PanelFileHandler />
      </div>
    </div>
  );
};

export default Toolbar;
