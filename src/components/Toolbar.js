import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, ButtonGroup, Button } from 'react-bootstrap';
import { useAppContext } from './AppContext';
import PanelFileHandler from './PanelFileHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faPlus,
  faMinus,
  faLockOpen,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

const Toolbar = () => {
  const {
    handleHeadSelection,
    handleHandSelection,
    selectedHand,
    selectedDancer,
    opacity,
    handleOpacityChange,
    handleDelete,
    selectedPanel,
    selectedShapeId,
    addPanel,
    deleteSelectedPanel,
    panels,
  } = useAppContext();

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
        <ButtonGroup className="custom-btn-group equal-width-btn-group">
          {/* Add a new panel */}
          <Button
            onClick={() => selectedPanel && addPanel()}
            variant={selectedPanel ? 'success' : 'outline-success'}
            className="icon-button"
            disabled={!selectedPanel}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span className="button-text">Add Panel</span>
          </Button>
          {/* Delete the currently selected panel */}
          <Button
            onClick={() => selectedPanel && deleteSelectedPanel(selectedPanel)}
            variant={selectedPanel ? 'danger' : 'outline-danger'}
            className="icon-button"
            disabled={!selectedPanel}
          >
            <FontAwesomeIcon icon={faMinus} />
            <span className="button-text">Delete Panel</span>
          </Button>
        </ButtonGroup>
      </div>

      <div className="file-handler">
        {/* Renders the save/load component */}
        <PanelFileHandler />
      </div>
    </div>
  );
};

export default Toolbar;
