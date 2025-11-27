import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoePrints,
  faArrowRight,
  faSyncAlt,
  faLongArrowAltRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../stores';

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
  'Curved Line': { type: 'curvedLine' },
  '2 Spin': { type: 'spinThree' },
  '1.5 Spin': { type: 'spinTwo' },
  '1 Spin': { type: 'spinOne' },
  'Half Spin': { type: 'spinHalf' },
  'Quarter Spin': { type: 'spinQuarter' },
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
  const [activeTab, setActiveTab] = useState(TAB_KEYS.FOOTWORK);

  //Tabs and their contents
  const tabs = {
    [TAB_KEYS.FOOTWORK]: {
      label: 'Footwork',
      icon: <FontAwesomeIcon icon={faShoePrints} />,
      items: ['Basic', 'Heel', 'Ball', 'Whole', 'Hover'],
      type: 'feet',
    },
    [TAB_KEYS.MOVEMENT]: {
      label: 'Movement',
      icon: <FontAwesomeIcon icon={faArrowRight} />,
      categories: {
        motion: ['Straight Line', 'Curved Line'],
        spin: ['2 Spin', '1.5 Spin', '1 Spin', 'Half Spin', 'Quarter Spin'],
      },
      type: 'movement',
    },
    [TAB_KEYS.SIGNALS]: {
      label: 'Signals',
      icon: <FontAwesomeIcon icon={faLongArrowAltRight} />,
      items: ['Direction', 'Knee', 'Waist', 'Shoulder', 'Overhead'],
      type: 'signals',
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
          color === COLORS.RED ? shapeProps.imageKeyRed : shapeProps.imageKeyBlue; //display colour based on color parameter
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
      if (selectedPanel !== null) {
        //Make sure a panel is selected
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

  //different feet layout (grid)
  const renderFeetButtons = () => {
    const items = tabs[TAB_KEYS.FOOTWORK].items;
    return (
      <div>
        {/* Red buttons section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '48%' }}>
              <h3
                style={{
                  color: 'black',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                Left
              </h3>
              {items.map((item) => (
                <button
                  key={`red-left-${item}`}
                  onClick={() => handleItemClick(item, SIDES.LEFT, COLORS.RED)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div style={{ width: '48%' }}>
              <h3
                style={{
                  color: 'black',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                Right
              </h3>
              {items.map((item) => (
                <button
                  key={`red-right-${item}`}
                  onClick={() => handleItemClick(item, SIDES.RIGHT, COLORS.RED)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blue buttons section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '48%' }}>
              {items.map((item) => (
                <button
                  key={`blue-left-${item}`}
                  onClick={() => handleItemClick(item, SIDES.LEFT, COLORS.BLUE)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: 'blue',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div style={{ width: '48%' }}>
              {items.map((item) => (
                <button
                  key={`blue-right-${item}`}
                  onClick={() => handleItemClick(item, SIDES.RIGHT, COLORS.BLUE)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: 'blue',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render buttons for movement tab (motion + spin)
  const renderMovementButtons = () => {
    const { categories } = tabs[TAB_KEYS.MOVEMENT];
    return (
      <div>
        <h3 style={{ color: 'black', marginBottom: '10px' }}>Motion</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ width: '48%' }}>
            {categories.motion.map((item) => (
              <button
                key={`red-${item}`}
                onClick={() => handleItemClick(item, null, COLORS.RED)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '5px',
                  marginBottom: '5px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div style={{ width: '48%' }}>
            {categories.motion.map((item) => (
              <button
                key={`blue-${item}`}
                onClick={() => handleItemClick(item, null, COLORS.BLUE)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '5px',
                  marginBottom: '5px',
                  backgroundColor: 'blue',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        
        <h3 style={{ color: 'black', marginBottom: '10px' }}>Spin</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '48%' }}>
            {categories.spin.map((item) => (
              <button
                key={`red-${item}`}
                onClick={() => handleItemClick(item, null, COLORS.RED)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '5px',
                  marginBottom: '5px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div style={{ width: '48%' }}>
            {categories.spin.map((item) => (
              <button
                key={`blue-${item}`}
                onClick={() => handleItemClick(item, null, COLORS.BLUE)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '5px',
                  marginBottom: '5px',
                  backgroundColor: 'blue',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render buttons for signals tab
  const renderSignalsButtons = () => {
    const items = tabs[TAB_KEYS.SIGNALS].items;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '48%' }}>
          {items.map((item) => (
            <button
              key={`red-${item}`}
              onClick={() => handleItemClick(item, null, COLORS.RED)}
              style={{
                display: 'block',
                width: '100%',
                padding: '5px',
                marginBottom: '5px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div style={{ width: '48%' }}>
          {items.map((item) => (
            <button
              key={`blue-${item}`}
              onClick={() => handleItemClick(item, null, COLORS.BLUE)}
              style={{
                display: 'block',
                width: '100%',
                padding: '5px',
                marginBottom: '5px',
                backgroundColor: 'blue',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
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
              borderBottom: activeTab === key ? '3px solid #007bff' : '3px solid transparent',
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
