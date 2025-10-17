import React, { useState, useRef } from 'react';
import Canvas from './Canvas';
import { useAppStore } from './useAppStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone } from '@fortawesome/free-solid-svg-icons';

const PositionPanel = () => {
  const panels = useAppStore((state) => state.panels);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const panelSize = useAppStore((state) => state.panelSize);
  const handlePanelSelection = useAppStore(
    (state) => state.handlePanelSelection,
  );
  const clonePanel = useAppStore((state) => state.clonePanel);
  const movePanel = useAppStore((state) => state.movePanel);

  const [draggingPanelId, setDraggingPanelId] = useState(null);
  const [dragEnabledPanelId, setDragEnabledPanelId] = useState(null);
  const [dragPreviewPanels, setDragPreviewPanels] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const panelRefs = useRef({});

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
              width: panelSize.width,
              height: panelSize.height + optionsBarHeight, //calculate full size
              border: `2px solid ${isSelected ? '#007bff' : '#e0e0e0'}`,
              transition: 'border-color 0.2s ease-in-out', //glow around panel transition
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
              borderRadius: '8px',
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
                  e.stopPropagation(); //Just in case parent or child elements are triggered
                  clonePanel(panel.id);
                }}
                style={buttonStyle}
                title="Clone Panel"
              >
                <FontAwesomeIcon icon={faClone} />
              </button>
            </div>
            <Canvas panelId={panel.id} />
          </div>
        );
      })}
    </>
  );
};

export default PositionPanel;
