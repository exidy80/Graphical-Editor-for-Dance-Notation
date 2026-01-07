import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoePrints,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faSyncAlt,
  faRedo,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../stores';
import images from './ImageMapping';

// Tab constants
const TAB_KEYS = {
  FOOTWORK: 'footwork',
  MOVEMENT: 'movement',
  SIGNALS: 'signals',
};

// Color constants
const COLORS = {
  RED: 'red',
  BLUE: 'blue',
};

// Side constants
const SIDES = {
  LEFT: 'left',
  RIGHT: 'right',
};

// Map the shapes to their types
const shapeMapping = {
  'Straight Line': { type: 'straightLine' },
  'Straight Line Up': { type: 'straightLineUp' },
  'Straight Line Down': { type: 'straightLineDown' },
  'Curved Line': { type: 'curvedLine' },
  'Curved Line Up': { type: 'curvedLineUp' },
  'Curved Line Down': { type: 'curvedLineDown' },
  '2 Spin': { type: 'spinThree' },
  '2 Spin CW': { type: 'spinThreeCW' },
  '2 Spin CCW': { type: 'spinThreeCCW' },
  '1.5 Spin': { type: 'spinTwo' },
  '1.5 Spin CW': { type: 'spinTwoCW' },
  '1.5 Spin CCW': { type: 'spinTwoCCW' },
  '1 Spin': { type: 'spinOne' },
  '1 Spin CW': { type: 'spinOneCW' },
  '1 Spin CCW': { type: 'spinOneCCW' },
  'Half Spin': { type: 'spinHalf' },
  'Half Spin CW': { type: 'spinHalfCW' },
  'Half Spin CCW': { type: 'spinHalfCCW' },
  'Quarter Spin': { type: 'spinQuarter' },
  'Quarter Spin CW': { type: 'spinQuarterCW' },
  'Quarter Spin CCW': { type: 'spinQuarterCCW' },
  Direction: { type: 'signal' },
  'Left Foot Basic': {
    type: 'image',
    imageKeyRed: 'leftFootBasicRed',
    imageKeyBlue: 'leftFootBasicBlue',
  },
  'Right Foot Basic': {
    type: 'image',
    imageKeyRed: 'rightFootBasicRed',
    imageKeyBlue: 'rightFootBasicBlue',
  },
  'Left Heel': {
    type: 'image',
    imageKeyRed: 'leftHeelRed',
    imageKeyBlue: 'leftHeelBlue',
  },
  'Right Heel': {
    type: 'image',
    imageKeyRed: 'rightHeelRed',
    imageKeyBlue: 'rightHeelBlue',
  },
  'Left Ball': {
    type: 'image',
    imageKeyRed: 'leftBallRed',
    imageKeyBlue: 'leftBallBlue',
  },
  'Right Ball': {
    type: 'image',
    imageKeyRed: 'rightBallRed',
    imageKeyBlue: 'rightBallBlue',
  },
  'Whole Left': {
    type: 'image',
    imageKeyRed: 'wholeRedLeft',
    imageKeyBlue: 'wholeBlueLeft',
  },
  'Whole Right': {
    type: 'image',
    imageKeyRed: 'wholeRedRight',
    imageKeyBlue: 'wholeBlueRight',
  },
  'Hov Left': {
    type: 'image',
    imageKeyRed: 'hovRedLeft',
    imageKeyBlue: 'hovBlueLeft',
  },
  'Hov Right': {
    type: 'image',
    imageKeyRed: 'hovRedRight',
    imageKeyBlue: 'hovBlueRight',
  },
  'Centre Point': {
    type: 'image',
    imageKeyRed: 'centrePoint',
    imageKeyBlue: 'centrePoint',
  },
  Knee: { type: 'knee' },
  Waist: { type: 'waist' },
  Shoulder: { type: 'shoulder' },
  Overhead: { type: 'overhead' },
  'Direction Up': { type: 'directionUp' },
  'Direction Down': { type: 'directionDown' },
  Block: { type: 'block' },
  'Split Hands': { type: 'splitHands' },
};

// Map the feet types to left or right
const feetButtonMapping = {
  Basic: { [SIDES.LEFT]: 'Left Foot Basic', [SIDES.RIGHT]: 'Right Foot Basic' },
  Heel: { [SIDES.LEFT]: 'Left Heel', [SIDES.RIGHT]: 'Right Heel' },
  Ball: { [SIDES.LEFT]: 'Left Ball', [SIDES.RIGHT]: 'Right Ball' },
  Whole: { [SIDES.LEFT]: 'Whole Left', [SIDES.RIGHT]: 'Whole Right' },
  Hover: { [SIDES.LEFT]: 'Hov Left', [SIDES.RIGHT]: 'Hov Right' },
};

const Sidebar = () => {
  // Funcs from context
  const handleShapeDraw = useAppStore((state) => state.handleShapeDraw);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  //Local states for the sidebar
  const [activeTab, setActiveTab] = useState(TAB_KEYS.MOVEMENT);

  //Tabs and their contents
  const tabs = {
    [TAB_KEYS.MOVEMENT]: {
      label: 'Movement',
      icon: <FontAwesomeIcon icon={faArrowRight} />,
      categories: {
        motion: ['Straight Line', 'Curved Line'],
        spin: ['Quarter Spin', 'Half Spin', '1 Spin', '1.5 Spin', '2 Spin'],
      },
      type: 'movement',
    },
    [TAB_KEYS.SIGNALS]: {
      label: 'Signals',
      icon: <FontAwesomeIcon icon={faSyncAlt} />,
      type: 'signals',
    },
    [TAB_KEYS.FOOTWORK]: {
      label: 'Footwork',
      icon: <FontAwesomeIcon icon={faShoePrints} />,
      items: ['Basic', 'Hover', 'Heel', 'Ball', 'Whole'],
      type: 'feet',
    },
  };

  //Handle clicking on a shape in the sidebar
  const handleItemClick = (item, side = null, color = COLORS.RED) => {
    let shapeKey = item;
    if (activeTab === TAB_KEYS.FOOTWORK && side) {
      //SPecial case for the feet
      shapeKey = feetButtonMapping[item][side]; //Get key for L/R versions
      const shapeProps = shapeMapping[shapeKey];
      if (selectedPanel !== null) {
        //Make sure a panel is selected
        const imageKey =
          color === COLORS.RED
            ? shapeProps.imageKeyRed
            : shapeProps.imageKeyBlue; //display colour based on color parameter
        handleShapeDraw({
          id: uuidv4(),
          ...shapeProps,
          imageKey,
          x: 50,
          y: 50,
          draggable: true,
        });
      }
    } else {
      //other shapes
      const shapeProps = shapeMapping[shapeKey];
      if (selectedPanel !== null && shapeProps) {
        //Make sure a panel is selected and shape exists
        handleShapeDraw({
          id: uuidv4(),
          ...shapeProps,
          stroke: color,
          fill: color,
          x: 50,
          y: 50,
          draggable: true,
        });
      }
    }
  };

  // Helper to get image key for footwork items
  const getFootImageKey = (item, side, color) => {
    const shapeKey = feetButtonMapping[item][side];
    const shapeProps = shapeMapping[shapeKey];
    return color === COLORS.RED
      ? shapeProps.imageKeyRed
      : shapeProps.imageKeyBlue;
  };

  //different feet layout (grid)
  const renderFeetButtons = () => {
    const items = tabs[TAB_KEYS.FOOTWORK].items;
    const isDisabled = selectedPanel === null;
    return (
      <div>
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '5px',
              marginBottom: '8px',
            }}
          >
            {/* Blue Left */}
            <button
              onClick={() => handleItemClick(item, SIDES.LEFT, COLORS.BLUE)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundImage: `url(${
                  images[getFootImageKey(item, SIDES.LEFT, COLORS.BLUE)]
                })`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title={`${item} - Blue Left`}
            />
            {/* Blue Right */}
            <button
              onClick={() => handleItemClick(item, SIDES.RIGHT, COLORS.BLUE)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundImage: `url(${
                  images[getFootImageKey(item, SIDES.RIGHT, COLORS.BLUE)]
                })`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                marginRight: '10px',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title={`${item} - Blue Right`}
            />
            {/* Red Left */}
            <button
              onClick={() => handleItemClick(item, SIDES.LEFT, COLORS.RED)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundImage: `url(${
                  images[getFootImageKey(item, SIDES.LEFT, COLORS.RED)]
                })`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title={`${item} - Red Left`}
            />
            {/* Red Right */}
            <button
              onClick={() => handleItemClick(item, SIDES.RIGHT, COLORS.RED)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundImage: `url(${
                  images[getFootImageKey(item, SIDES.RIGHT, COLORS.RED)]
                })`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title={`${item} - Red Right`}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render buttons for signals tab (directions and hands)
  const renderSignalsButtons = () => {
    const isDisabled = selectedPanel === null;
    const elevationItems = [
      { name: 'Overhead', shape: 'triangle' },
      { name: 'Shoulder', shape: 'arc' },
      { name: 'Waist', shape: 'rect' },
      { name: 'Knee', shape: 'circle' },
    ];

    // Helper to render the elevation shape
    const renderElevationShape = (shape, color) => {
      const shapeColor = color === COLORS.RED ? 'red' : 'blue';

      switch (shape) {
        case 'triangle':
          return (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polygon
                points="12,6 18,18 6,18"
                fill={shapeColor}
                stroke={shapeColor}
                strokeWidth="2"
              />
            </svg>
          );
        case 'arc':
          return (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M 6 18 A 6 6 0 0 1 18 18"
                fill={shapeColor}
                stroke={shapeColor}
                strokeWidth="2"
              />
            </svg>
          );
        case 'rect':
          return (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <rect
                x="6"
                y="11"
                width="12"
                height="2"
                fill={shapeColor}
                stroke={shapeColor}
                strokeWidth="2"
              />
            </svg>
          );
        case 'circle':
          return (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="4"
                fill={shapeColor}
                stroke={shapeColor}
                strokeWidth="2"
              />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <div>
        {/* Direction Section */}
        <h3
          style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}
        >
          Direction
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '5px',
            marginBottom: '25px',
            minHeight: '40px',
          }}
        >
          {/* Red Up */}
          <button
            onClick={() => handleItemClick('Direction Up', null, COLORS.RED)}
            disabled={isDisabled}
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '5px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'red',
              fontSize: '20px',
              opacity: isDisabled ? 0.5 : 1,
            }}
            title="Direction Up - Red"
          >
            <FontAwesomeIcon
              icon={faArrowUp}
              style={{ width: '20px', height: '20px' }}
            />
          </button>
          {/* Red Down */}
          <button
            onClick={() => handleItemClick('Direction Down', null, COLORS.RED)}
            disabled={isDisabled}
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '5px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'red',
              fontSize: '20px',
              opacity: isDisabled ? 0.5 : 1,
            }}
            title="Direction Down - Red"
          >
            <FontAwesomeIcon
              icon={faArrowDown}
              style={{ width: '20px', height: '20px' }}
            />
          </button>
          {/* Blue Up */}
          <button
            onClick={() => handleItemClick('Direction Up', null, COLORS.BLUE)}
            disabled={isDisabled}
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '5px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'blue',
              fontSize: '20px',
              opacity: isDisabled ? 0.5 : 1,
            }}
            title="Direction Up - Blue"
          >
            <FontAwesomeIcon
              icon={faArrowUp}
              style={{ width: '20px', height: '20px' }}
            />
          </button>
          {/* Blue Down */}
          <button
            onClick={() => handleItemClick('Direction Down', null, COLORS.BLUE)}
            disabled={isDisabled}
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '5px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'blue',
              fontSize: '20px',
              opacity: isDisabled ? 0.5 : 1,
            }}
            title="Direction Down - Blue"
          >
            <FontAwesomeIcon
              icon={faArrowDown}
              style={{ width: '20px', height: '20px' }}
            />
          </button>
        </div>

        {/* Elevation Section */}
        <h3
          style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}
        >
          Elevation
        </h3>
        <div style={{ marginBottom: '25px' }}>
          {elevationItems.map((item) => (
            <div
              key={item.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr',
                gap: '10px',
              }}
            >
              {/* Red button */}
              <button
                onClick={() => handleItemClick(item.name, null, COLORS.RED)}
                disabled={isDisabled}
                style={{
                  height: '40px',
                  width: '100%',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                }}
                title={`${item.name} - Red`}
              >
                {renderElevationShape(item.shape, COLORS.RED)}
              </button>
              {/* Label */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                {item.name}
              </div>
              {/* Blue button */}
              <button
                onClick={() => handleItemClick(item.name, null, COLORS.BLUE)}
                disabled={isDisabled}
                style={{
                  height: '40px',
                  width: '100%',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                }}
                title={`${item.name} - Blue`}
              >
                {renderElevationShape(item.shape, COLORS.BLUE)}
              </button>
            </div>
          ))}
        </div>

        {/* Other Section */}
        <h3
          style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}
        >
          Other
        </h3>
        <div style={{ marginBottom: '10px' }}>
          {/* Block */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <button
              onClick={() => handleItemClick('Block', null, COLORS.RED)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'red',
                fontSize: '24px',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title="Block - Red"
            >
              ■
            </button>
            <div
              style={{
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              Block
            </div>
            <button
              onClick={() => handleItemClick('Block', null, COLORS.BLUE)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'blue',
                fontSize: '24px',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title="Block - Blue"
            >
              ■
            </button>
          </div>

          {/* Split Hands */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <button
              onClick={() => handleItemClick('Split Hands', null, COLORS.RED)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'red',
                fontSize: '20px',
                fontWeight: 'bold',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title="Split Hands - Red"
            >
              ×
            </button>
            <div
              style={{
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              Split Hands
            </div>
            <button
              onClick={() => handleItemClick('Split Hands', null, COLORS.BLUE)}
              disabled={isDisabled}
              style={{
                height: '40px',
                backgroundColor: 'white',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'blue',
                fontSize: '20px',
                fontWeight: 'bold',
                opacity: isDisabled ? 0.5 : 1,
              }}
              title="Split Hands - Blue"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render buttons for movement tab (motion + spin)
  const renderMovementButtons = () => {
    const isDisabled = selectedPanel === null;
    const categories = tabs[TAB_KEYS.MOVEMENT].categories;

    // Helper to render arrow icon (straight line with arrowhead)
    const renderArrowIcon = (color, direction = 'up') => {
      const isUp = direction === 'up';
      const arrowColor = color === COLORS.RED ? 'red' : 'blue';

      return (
        <svg width="32" height="32" viewBox="0 0 32 32">
          {/* Dashed line body */}
          <line
            x1={isUp ? '16' : '16'}
            y1={isUp ? '24' : '8'}
            x2={isUp ? '16' : '16'}
            y2={isUp ? '8' : '24'}
            stroke={arrowColor}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {/* Arrowhead */}
          <polygon
            points={isUp ? '16,4 12,10 20,10' : '16,28 12,22 20,22'}
            fill={arrowColor}
          />
        </svg>
      );
    };

    // Helper to render curved line icon
    const renderCurvedLineIcon = (color, direction = 'up') => {
      const isUp = direction === 'up';
      const lineColor = color === COLORS.RED ? 'red' : 'blue';

      return (
        <svg width="32" height="32" viewBox="0 0 32 32">
          {/* Dashed curved line body */}
          <path
            d={isUp ? 'M 16 24 Q 8 16, 16 8' : 'M 16 8 Q 8 16, 16 24'}
            stroke={lineColor}
            strokeWidth="2"
            strokeDasharray="4,4"
            fill="none"
          />
          {/* Arrowhead */}
          <polygon
            points={isUp ? '16,4 12,10 20,10' : '16,28 12,22 20,22'}
            fill={lineColor}
          />
        </svg>
      );
    };

    // Get icon for item based on direction
    const getIcon = (item, color, direction) => {
      if (item === 'Straight Line') {
        return renderArrowIcon(color, direction);
      } else if (item === 'Curved Line') {
        return renderCurvedLineIcon(color, direction);
      }
      return null;
    };

    return (
      <div>
        {/* Motion Section */}
        <h3
          style={{ color: 'black', marginBottom: '15px', textAlign: 'center' }}
        >
          Move
        </h3>
        <div style={{ marginBottom: '20px' }}>
          {categories.motion.map((item) => (
            <div
              key={item}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '10px',
                alignItems: 'center',
              }}
            >
              {/* Red Up */}
              <button
                onClick={() => handleItemClick(`${item} Up`, null, COLORS.RED)}
                disabled={isDisabled}
                style={{
                  height: '50px',
                  width: '50px',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                  padding: '0',
                }}
                title={`${item} - Red Up`}
              >
                {getIcon(item, COLORS.RED, 'up')}
              </button>
              {/* Red Down */}
              <button
                onClick={() =>
                  handleItemClick(`${item} Down`, null, COLORS.RED)
                }
                disabled={isDisabled}
                style={{
                  height: '50px',
                  width: '50px',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                  padding: '0',
                }}
                title={`${item} - Red Down`}
              >
                {getIcon(item, COLORS.RED, 'down')}
              </button>
              {/* Gap */}
              <div style={{ flex: 1 }} />
              {/* Blue Up */}
              <button
                onClick={() => handleItemClick(`${item} Up`, null, COLORS.BLUE)}
                disabled={isDisabled}
                style={{
                  height: '50px',
                  width: '50px',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                  padding: '0',
                }}
                title={`${item} - Blue Up`}
              >
                {getIcon(item, COLORS.BLUE, 'up')}
              </button>
              {/* Blue Down */}
              <button
                onClick={() =>
                  handleItemClick(`${item} Down`, null, COLORS.BLUE)
                }
                disabled={isDisabled}
                style={{
                  height: '50px',
                  width: '50px',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDisabled ? 0.5 : 1,
                  padding: '0',
                }}
                title={`${item} - Blue Down`}
              >
                {getIcon(item, COLORS.BLUE, 'down')}
              </button>
            </div>
          ))}
        </div>

        {/* Spin Section */}
        <h3
          style={{ color: 'black', marginBottom: '15px', textAlign: 'center' }}
        >
          Spin
        </h3>

        {/* Spin Indicators Header */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '15px',
            alignItems: 'center',
          }}
        >
          {/* Red CW Indicator */}
          <div
            style={{
              width: '50px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'red',
            }}
          >
            <FontAwesomeIcon icon={faRedo} />
          </div>
          {/* Red CCW Indicator */}
          <div
            style={{
              width: '50px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'red',
            }}
          >
            <FontAwesomeIcon icon={faUndo} />
          </div>
          {/* Gap */}
          <div style={{ flex: 1 }} />
          {/* Blue CW Indicator */}
          <div
            style={{
              width: '50px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'blue',
            }}
          >
            <FontAwesomeIcon icon={faRedo} />
          </div>
          {/* Blue CCW Indicator */}
          <div
            style={{
              width: '50px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'blue',
            }}
          >
            <FontAwesomeIcon icon={faUndo} />
          </div>
        </div>

        {/* Spin Buttons */}
        <div style={{ marginBottom: '20px' }}>
          {categories.spin.map((item) => {
            // Map spin names to shortened labels
            const spinMap = {
              'Quarter Spin': '1/4',
              'Half Spin': '1/2',
              '1 Spin': '1',
              '1.5 Spin': '1.5',
              '2 Spin': '2',
            };
            const label = spinMap[item] || item;

            return (
              <div
                key={item}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '10px',
                  alignItems: 'center',
                }}
              >
                {/* Red CW */}
                <button
                  onClick={() =>
                    handleItemClick(`${item} CW`, null, COLORS.RED)
                  }
                  disabled={isDisabled}
                  style={{
                    height: '50px',
                    width: '50px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    color: 'red',
                    fontSize: '18px',
                    fontWeight: '600',
                    opacity: isDisabled ? 0.5 : 1,
                    padding: '0',
                  }}
                  title={`${item} CW - Red`}
                >
                  {label}
                </button>
                {/* Red CCW */}
                <button
                  onClick={() =>
                    handleItemClick(`${item} CCW`, null, COLORS.RED)
                  }
                  disabled={isDisabled}
                  style={{
                    height: '50px',
                    width: '50px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    color: 'red',
                    fontSize: '18px',
                    fontWeight: '600',
                    opacity: isDisabled ? 0.5 : 1,
                    padding: '0',
                  }}
                  title={`${item} CCW - Red`}
                >
                  {label}
                </button>
                {/* Gap */}
                <div style={{ flex: 1 }} />
                {/* Blue CW */}
                <button
                  onClick={() =>
                    handleItemClick(`${item} CW`, null, COLORS.BLUE)
                  }
                  disabled={isDisabled}
                  style={{
                    height: '50px',
                    width: '50px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    color: 'blue',
                    fontSize: '18px',
                    fontWeight: '600',
                    opacity: isDisabled ? 0.5 : 1,
                    padding: '0',
                  }}
                  title={`${item} CW - Blue`}
                >
                  {label}
                </button>
                {/* Blue CCW */}
                <button
                  onClick={() =>
                    handleItemClick(`${item} CCW`, null, COLORS.BLUE)
                  }
                  disabled={isDisabled}
                  style={{
                    height: '50px',
                    width: '50px',
                    backgroundColor: 'white',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    color: 'blue',
                    fontSize: '18px',
                    fontWeight: '600',
                    opacity: isDisabled ? 0.5 : 1,
                    padding: '0',
                  }}
                  title={`${item} CCW - Blue`}
                >
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #ddd',
      }}
    >
      {/* Tab Headers */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #ddd',
          backgroundColor: '#fff',
        }}
      >
        {Object.entries(tabs).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              padding: '15px 10px',
              backgroundColor: activeTab === key ? '#fff' : '#e9ecef',
              border: 'none',
              borderBottom:
                activeTab === key
                  ? '3px solid #007bff'
                  : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === key ? 'bold' : 'normal',
              color: activeTab === key ? '#007bff' : '#666',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: '#E2E2E2',
        }}
      >
        {activeTab === TAB_KEYS.FOOTWORK && renderFeetButtons()}
        {activeTab === TAB_KEYS.MOVEMENT && renderMovementButtons()}
        {activeTab === TAB_KEYS.SIGNALS && renderSignalsButtons()}
      </div>
    </div>
  );
};

export default Sidebar;
