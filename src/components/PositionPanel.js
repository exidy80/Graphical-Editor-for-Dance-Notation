import React, { useState, useRef, useEffect } from 'react';
import Canvas from './Canvas';
import { useAppStore } from '../stores';
import { UI_DIMENSIONS } from '../utils/dimensions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClone,
  faPlus,
  faChevronUp,
  faChevronDown,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

const PositionPanel = () => {
  const panels = useAppStore((state) => state.panels);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const panelSize = useAppStore((state) => state.panelSize);
  const magnifyEnabled = useAppStore((state) => state.magnifyEnabled);
  const handlePanelSelection = useAppStore(
    (state) => state.handlePanelSelection,
  );
  const addPanel = useAppStore((state) => state.addPanel);
  const clonePanel = useAppStore((state) => state.clonePanel);
  const deleteSelectedPanel = useAppStore((state) => state.deleteSelectedPanel);
  const updatePanelNotes = useAppStore((state) => state.updatePanelNotes);
  const movePanel = useAppStore((state) => state.movePanel);

  const [draggingPanelId, setDraggingPanelId] = useState(null);
  const [dragEnabledPanelId, setDragEnabledPanelId] = useState(null);
  const [dragPreviewPanels, setDragPreviewPanels] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [expandedNotesPanel, setExpandedNotesPanel] = useState(null);

  const panelRefs = useRef({});
  const textareaRefs = useRef({});

  useEffect(() => {
    if (expandedNotesPanel && textareaRefs.current[expandedNotesPanel]) {
      const textarea = textareaRefs.current[expandedNotesPanel];
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  }, [expandedNotesPanel]);

  useEffect(() => {
    if (!magnifyEnabled || !selectedPanel) return;
    const panelElement = panelRefs.current[selectedPanel];
    const gridElement = document.querySelector('.position-panel-grid');
    if (!panelElement || !gridElement) return;

    gridElement.scrollTo({
      top: panelElement.offsetTop,
      left: panelElement.offsetLeft,
      behavior: 'smooth',
    });
  }, [magnifyEnabled, selectedPanel]);

  const optionsBarHeight = 40; //size of bar at top of panel

  const buttonStyle = {
    background: 'none',
    border: 'none',
    color: '#333',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '5px 10px',
    transition: 'color 0.2s ease-in-out',
  };

  const handleDragStart = (e, panelId) => {
    setDraggingPanelId(panelId);
    setDragEnabledPanelId(null); // reset

    const ghost = panelRefs.current[panelId];
    if (ghost) {
      const clone = ghost.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 0, 0);

      // Remove the clone later
      requestAnimationFrame(() => document.body.removeChild(clone));
    }
  };

  const handleDragOver = (e, overPanelId) => {
    e.preventDefault();
    if (!draggingPanelId || draggingPanelId === overPanelId) return;

    const fromIndex = panels.findIndex((p) => p.id === draggingPanelId);
    const toIndex = panels.findIndex((p) => p.id === overPanelId);
    if (fromIndex === -1 || toIndex === -1) return;

    const preview = [...panels];
    const [moved] = preview.splice(fromIndex, 1);
    preview.splice(toIndex, 0, moved);
    setDragPreviewPanels(preview);
    setDropTargetId(overPanelId);
  };

  const handleDragEnd = () => {
    if (draggingPanelId && dropTargetId && draggingPanelId !== dropTargetId) {
      movePanel(draggingPanelId, dropTargetId); // One single committed state change
    }
    setDraggingPanelId(null);
    setDropTargetId(null);
    setDragPreviewPanels(null);
  };

  return (
    <>
      {(dragPreviewPanels || panels).map((panel) => {
        const isSelected = selectedPanel === panel.id; //find selected panel
        const isMagnified = magnifyEnabled && isSelected;
        // Magnified panel is panelSize × MAGNIFY_CONTENT_SCALE so the visible
        // canvas coordinate range is preserved (just zoomed in).
        const displayPanelSize = isMagnified
          ? {
              width: panelSize.width * UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE,
              height: panelSize.height * UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE,
            }
          : panelSize;
        const columnSpan = isMagnified
          ? Math.ceil(displayPanelSize.width / panelSize.width)
          : 1;

        return (
          <div
            key={panel.id}
            className={`position-panel ${isSelected ? 'selected' : ''}`}
            ref={(el) => (panelRefs.current[panel.id] = el)}
            onClick={() => handlePanelSelection(panel.id)}
            draggable={dragEnabledPanelId === panel.id}
            onDragStart={(e) => handleDragStart(e, panel.id)}
            onDragOver={(e) => handleDragOver(e, panel.id)}
            onDragEnd={handleDragEnd}
            style={{
              width: displayPanelSize.width,
              height: displayPanelSize.height + optionsBarHeight, //calculate full size
              border: `2px solid ${isSelected ? '#007bff' : '#e0e0e0'}`,
              transition: 'border-color 0.2s ease-in-out', //glow around panel transition
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
              borderRadius: '8px',
              gridColumn: `span ${columnSpan}`,
            }}
          >
            <div
              className="options-bar"
              style={{
                width: '100%',
                height: `${optionsBarHeight}px`,
                backgroundColor: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 10px',
                boxSizing: 'border-box',
                borderBottom: '1px solid #e0e0e0',
                cursor: 'grab',
              }}
              onMouseDown={() => setDragEnabledPanelId(panel.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      'Are you sure you want to delete this panel?',
                    )
                  ) {
                    deleteSelectedPanel(panel.id);
                  }
                }}
                style={buttonStyle}
                title="Delete Panel"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addPanel(panel.id);
                  }}
                  style={buttonStyle}
                  title="Add Panel"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); //Just in case parent or child elements are triggered
                    clonePanel(panel.id);
                  }}
                  style={buttonStyle}
                  title="Clone Panel"
                >
                  <FontAwesomeIcon icon={faClone} />
                </button>
              </div>
            </div>
            <div
              style={{
                flex: expandedNotesPanel === panel.id ? '0 0 0' : '1 1 auto',
                width: '100%',
                overflow: 'hidden',
                minHeight: '0',
              }}
            >
              <Canvas panelId={panel.id} panelViewportSize={displayPanelSize} />
            </div>
            {/* Notes Section */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#f0f0f0',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                flex:
                  expandedNotesPanel === panel.id
                    ? '1 1 auto'
                    : `0 0 ${UI_DIMENSIONS.PANEL_NOTES_HEIGHT}px`,
                overflow: 'hidden',
                minHeight: '0',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {expandedNotesPanel === panel.id ? (
                // Expanded view
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '5px',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedNotesPanel(null);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        ...buttonStyle,
                        fontSize: '12px',
                      }}
                      title="Collapse Notes"
                    >
                      <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                  </div>
                  <textarea
                    ref={(el) => (textareaRefs.current[panel.id] = el)}
                    value={panel.notes || ''}
                    onChange={(e) => updatePanelNotes(panel.id, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setExpandedNotesPanel(null);
                      }
                    }}
                    style={{
                      flex: '1 1 auto',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '12px',
                      resize: 'none',
                      overflowY: 'auto',
                      minHeight: '0',
                    }}
                    placeholder="Add notes for this panel..."
                  />
                </div>
              ) : (
                // Collapsed view
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedNotesPanel(panel.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    height: `${UI_DIMENSIONS.PANEL_NOTES_HEIGHT}px`,
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '13px',
                      color: '#666',
                      marginRight: '5px',
                    }}
                  >
                    {panel.notes || '(click to add notes)'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedNotesPanel(panel.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      ...buttonStyle,
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                    title="Expand Notes"
                  >
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default PositionPanel;
