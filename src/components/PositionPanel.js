import React from 'react';
import Canvas from './Canvas';
import { useAppContext } from './AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowLeft,
  faClone,
} from '@fortawesome/free-solid-svg-icons';

const PositionPanel = () => {
  const {
    panels,
    selectedPanel,
    panelSize,
    handlePanelSelection,
    clonePanel,
    movePanel,
  } = useAppContext();

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

  const arrowButtonStyle = {
    ...buttonStyle, //same as above
    padding: '5px',
  };

  return (
    <>
      {panels.map((panel) => {
        const isSelected = selectedPanel === panel.id; //find selected panel

        return (
          <div
            key={panel.id}
            className={`position-panel ${isSelected ? 'selected' : ''}`}
            onClick={() => handlePanelSelection(panel.id)}
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
              }}
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
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePanel(panel.id, 'left');
                  }}
                  style={arrowButtonStyle}
                  title="Move Left"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePanel(panel.id, 'right');
                  }}
                  style={arrowButtonStyle}
                  title="Move Right"
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </div>
            <Canvas panelId={panel.id} />
          </div>
        );
      })}
    </>
  );
};

export default PositionPanel;
