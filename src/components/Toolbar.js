import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, ButtonGroup, Button } from 'react-bootstrap';
import { useAppStore } from '../stores';
import PanelFileHandler from './PanelFileHandler';
import CanvasSizeControl from './CanvasSizeControl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faLink,
  faUnlink,
  faRefresh,
  faFilePdf,
  faCompressArrowsAlt,
  faSearchPlus,
} from '@fortawesome/free-solid-svg-icons';

const Toolbar = () => {
  const handleHeadSelection = useAppStore((state) => state.handleHeadSelection);
  const handleHandSelection = useAppStore((state) => state.handleHandSelection);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const selectedItems = useAppStore((state) => state.selectedItems);
  const handleDelete = useAppStore((state) => state.handleDelete);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const magnifyEnabled = useAppStore((state) => state.magnifyEnabled);
  const toggleMagnify = useAppStore((state) => state.toggleMagnify);
  const panels = useAppStore((state) => state.panels);
  const setLockModeActive = useAppStore((state) => state.setLockModeActive);
  const lockUi = useAppStore((state) => state.lockUi);
  const getLockForHand = useAppStore((state) => state.getLockForHand);
  const removeLockById = useAppStore((state) => state.removeLockById);
  const hasOverlappingHands = useAppStore((state) => state.hasOverlappingHands);
  const lockOverlappingHands = useAppStore(
    (state) => state.lockOverlappingHands,
  );
  const resetDancers = useAppStore((state) => state.resetDancers);
  const recenterAllPanels = useAppStore((state) => state.recenterAllPanels);
  const documentTitle = useAppStore((state) => state.documentTitle);
  const getDocumentFileName = useAppStore((state) => state.getDocumentFileName);
  const hasUnsavedChanges = useAppStore((state) => state.hasUnsavedChanges);

  // Get first selected dancer or shape item from selectedItems
  const selectedDancer =
    selectedItems.find((item) => item.type === 'dancer') ?? null;
  const selectedShape =
    selectedItems.find((item) => item.type === 'shape') ?? null;

  //Gets the colour of the selected object in order to theme the toolbar buttons
  const getSelectedColour = () => {
    if (selectedDancer) {
      const panel = panels.find((p) => p.id === selectedDancer.panelId);
      return (
        panel?.dancers.find((d) => d.id === selectedDancer.id)?.colour ?? null
      );
    }
    if (selectedShape) {
      const panel = panels.find((p) => p.id === selectedShape.panelId);
      const shape = panel?.shapes.find((s) => s.id === selectedShape.id);
      return shape?.fill ?? shape?.stroke ?? null;
    }
    return null;
  };

  const selectedColour = getSelectedColour();

  const canHoldHands = selectedPanel
    ? hasOverlappingHands(selectedPanel)
    : false;

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
      const headerHeight = 12; // Space for header
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin - headerHeight;

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

      // Helper function to add header to each page
      const addHeader = (pageNum, totalPages) => {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        // Center the document title
        const title = documentTitle || 'Untitled Dance';
        const titleWidth = pdf.getTextWidth(title);
        pdf.text(title, (pageWidth - titleWidth) / 2, margin - 3);

        // Add page number on the right
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const pageText = `Page ${pageNum} of ${totalPages}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, pageWidth - margin - pageTextWidth, margin - 3);
      };

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

      // Calculate total pages
      const totalPages = Math.ceil(panelImages.length / panelsPerPage);

      // Add panels to PDF, creating new pages as needed
      for (let i = 0; i < panelImages.length; i++) {
        const indexOnPage = i % panelsPerPage;
        const currentPage = Math.floor(i / panelsPerPage) + 1;

        // Add new page if needed
        if (i > 0 && indexOnPage === 0) {
          pdf.addPage();
        }

        // Add header to each page (first panel on the page)
        if (indexOnPage === 0) {
          addHeader(currentPage, totalPages);
        }

        // Calculate position on page (with header offset)
        const row = Math.floor(indexOnPage / panelsPerRow);
        const col = indexOnPage % panelsPerRow;

        const x = margin + col * (panelWidth + spacing);
        const y = margin + headerHeight + row * (panelHeight + spacing);

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

  const pdfLink = (
    <button
      onClick={exportPanelsToPDF}
      className="toolbar-link"
      title="Export all panels to PDF"
      type="button"
    >
      <FontAwesomeIcon icon={faFilePdf} /> Save to PDF
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Document Title - Centered at top */}
      <div
        style={{
          textAlign: 'center',
          padding: '12px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #dee2e6',
          marginBottom: '10px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#212529',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              maxWidth: '70vw',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
            }}
            title={documentTitle}
          >
            {documentTitle}
          </span>
          {hasUnsavedChanges && (
            <span
              style={{
                marginLeft: '12px',
                color: '#dc3545',
                fontSize: '32px',
                lineHeight: '24px',
                verticalAlign: 'middle',
              }}
              title="You have unsaved changes (Cmd+S to save)"
            >
              •
            </span>
          )}
        </h1>
      </div>

      <div className="perspective-selection toolbar-layout">
        <div className="toolbar-section toolbar-section-selection toolbar-section-fixed">
          <div className="toolbar-stack">
            <Dropdown className="custom-dropdown">
              <Dropdown.Toggle
                variant={selectedDancer ? 'primary' : 'outline-dark'}
                id="head-dropdown"
                disabled={!selectedDancer}
                style={selectedDancer ? colouredButtonStyle : {}}
              >
                Select Body
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleHeadSelection('Upright')}>
                  Upright
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleHeadSelection('Duck')}>
                  Duck
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleHeadSelection('Bow')}>
                  Bow
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleHeadSelection('Bend Knees')}
                >
                  Bend Knees
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleHeadSelection('Squat')}>
                  Squat
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown className="custom-dropdown">
              <Dropdown.Toggle
                variant={selectedHand ? 'primary' : 'outline-dark'}
                id="hand-dropdown"
                disabled={!selectedHand}
                style={selectedHand ? colouredButtonStyle : {}}
              >
                {selectedHand ? 'Select Hand' : 'Select Hand'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
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
          </div>
        </div>

        <div className="toolbar-section toolbar-section-elements">
          <div className="toolbar-stack">
            <Button
              onClick={() =>
                selectedShape &&
                handleDelete({
                  panelId: selectedShape.panelId,
                  shapeId: selectedShape.id,
                })
              }
              variant={selectedShape ? 'danger' : 'outline-dark'}
              className="icon-button"
              disabled={!selectedShape}
              style={selectedShape ? colouredButtonStyle : {}}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span className="button-text">Delete Symbol</span>
            </Button>
            <ButtonGroup className="custom-btn-group">
              <Button
                onClick={() => {
                  if (!lockUi.active && selectedPanel) {
                    lockOverlappingHands(selectedPanel);
                  } else {
                    setLockModeActive(!lockUi.active);
                  }
                }}
                variant={lockUi.active ? 'primary' : 'outline-dark'}
                className="icon-button"
                disabled={!lockUi.active && !canHoldHands}
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
                    ? 'dark'
                    : 'outline-dark'
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
          </div>
        </div>

        <div className="toolbar-section toolbar-section-panel">
          <div className="toolbar-stack">
            <CanvasSizeControl />
            <Button
              onClick={toggleMagnify}
              variant={magnifyEnabled ? 'dark' : 'outline-dark'}
              className="icon-button"
              title="Magnify selected panel"
            >
              <FontAwesomeIcon icon={faSearchPlus} />
              <span className="button-text">Magnify</span>
            </Button>
          </div>
        </div>

        <div className="toolbar-section toolbar-section-reset">
          <div className="toolbar-stack">
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
              variant="outline-dark"
              className="icon-button"
              title="Reset all dancers to default state"
            >
              <FontAwesomeIcon icon={faRefresh} />
              <span className="button-text">Reset Dancers</span>
            </Button>
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
              variant="outline-dark"
              className="icon-button"
              title="Recenter all panels to center the stage markers"
            >
              <FontAwesomeIcon icon={faCompressArrowsAlt} />
              <span className="button-text">Recenter Panels</span>
            </Button>
          </div>
        </div>

        <div className="toolbar-section toolbar-section-file toolbar-section-fixed">
          <PanelFileHandler
            className="toolbar-links-grid"
            extraLinks={pdfLink}
            extraLinksPosition="afterOpen"
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
