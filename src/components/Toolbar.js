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
import html2pdf from 'html2pdf.js';

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
      const element = document.querySelector('.position-panel-grid');
      if (!element) {
        alert('No panels found to export');
        return;
      }

      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        try {
          // Show the native save dialog
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

          const opt = {
            margin: 10,
            filename: fileHandle.name,
            image: { type: 'png', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
          };

          await html2pdf().set(opt).from(element).save();
          console.log('PDF saved successfully!');
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

      // Fallback: use prompt for filename
      const filename = prompt('Enter PDF filename:', 'dance-notation');
      if (filename === null) {
        return; // User cancelled
      }

      if (!filename.trim()) {
        alert('Please enter a valid filename');
        return;
      }

      const pdfFilename = filename.endsWith('.pdf')
        ? filename
        : `${filename}.pdf`;

      const opt = {
        margin: 10,
        filename: pdfFilename,
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      await html2pdf().set(opt).from(element).save();
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
            <Dropdown.Item onClick={() => handleHandSelection('Knee')}>
              Knee
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Waist')}>
              Waist
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Shoulder')}>
              Shoulder
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleHandSelection('Overhead')}>
              Overhead
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
