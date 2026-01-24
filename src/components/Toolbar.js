import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, ButtonGroup, Button } from 'react-bootstrap';
import { useAppStore } from '../stores';
import PanelFileHandler from './PanelFileHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faLockOpen,
  faLock,
  faLink,
  faUnlink,
  faRefresh,
  faFilePdf,
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

      // Get all Konva canvases and convert them to images temporarily
      const canvases = gridElement.querySelectorAll('canvas');
      const canvasData = [];

      // Convert each canvas to an image and hide the canvas
      canvases.forEach((canvas) => {
        const dataURL = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.width =
          canvas.style.width ||
          `${canvas.width / (window.devicePixelRatio || 1)}px`;
        img.style.height =
          canvas.style.height ||
          `${canvas.height / (window.devicePixelRatio || 1)}px`;
        img.style.display = 'block';

        // Store original canvas and insert image
        canvasData.push({ canvas, img, parent: canvas.parentNode });
        canvas.style.display = 'none';
        canvas.parentNode.insertBefore(img, canvas);
      });

      // Get filename
      let pdfFilename = 'dance-notation.pdf';

      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'dance-notation.pdf',
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
            // Restore canvases before returning
            canvasData.forEach(({ canvas, img }) => {
              canvas.style.display = '';
              img.remove();
            });
            return;
          }
        }
      } else {
        const filename = prompt('Enter PDF filename:', 'dance-notation');
        if (filename === null || !filename.trim()) {
          // Restore canvases before returning
          canvasData.forEach(({ canvas, img }) => {
            canvas.style.display = '';
            img.remove();
          });
          return;
        }
        pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      }

      // Now capture with html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(gridElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });

      // Restore the original canvases
      canvasData.forEach(({ canvas: originalCanvas, img }) => {
        originalCanvas.style.display = '';
        img.remove();
      });

      // Convert to PDF
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // Calculate dimensions to fit on page
      const imgAspect = canvas.width / canvas.height;
      const pageAspect = contentWidth / contentHeight;

      let imgWidth, imgHeight;
      if (imgAspect > pageAspect) {
        imgWidth = contentWidth;
        imgHeight = contentWidth / imgAspect;
      } else {
        imgHeight = contentHeight;
        imgWidth = contentHeight * imgAspect;
      }

      const x = margin + (contentWidth - imgWidth) / 2;
      const y = margin + (contentHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(pdfFilename);

      console.log('PDF saved successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="perspective-selection">
      <div className="options-group">
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
