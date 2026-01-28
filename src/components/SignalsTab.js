import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSyncAlt,
  faArrowUp,
  faArrowDown,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import { COLORS, shapeMapping } from './sidebarConstants';

const SignalsTab = ({ selectedPanel, handleShapeDraw }) => {
  const isDisabled = selectedPanel === null;

  const elevationItems = [
    { name: 'Overhead', shape: 'filledDiamond' },
    { name: 'Shoulder', shape: 'emptyDiamond' },
    { name: 'Waist', shape: 'rect' },
    { name: 'Hip', shape: 'emptyCircle' },
    { name: 'Knee', shape: 'filledCircle' },
  ];

  // Shared styles
  const buttonStyle = {
    height: '30px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '5px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
  };

  const labelStyle = {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  };

  const threeColRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '8px',
  };

  // Handle signal button click - creates shape with proper properties
  const handleSignalClick = (shapeKey, color) => {
    if (selectedPanel === null) return;

    const shapeProps = shapeMapping[shapeKey];
    if (!shapeProps) return;

    const shapeData = {
      id: uuidv4(),
      ...shapeProps,
      stroke: color,
      x: 200,
      y: 200,
      draggable: true,
    };

    // Only add fill for shapes that should have it
    if (shapeProps.type !== 'hip' && shapeProps.type !== 'shoulder') {
      shapeData.fill = color;
    }

    handleShapeDraw(shapeData);
  };

  // Helper to render the elevation shape
  const renderElevationShape = (shape, color) => {
    const shapeColor = color === COLORS.RED ? 'red' : 'blue';

    switch (shape) {
      case 'filledDiamond':
        return (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ pointerEvents: 'none' }}
          >
            <polygon
              points="12,6 18,12 12,18 6,12"
              fill={shapeColor}
              stroke={shapeColor}
              strokeWidth="2"
            />
          </svg>
        );
      case 'emptyDiamond':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <polygon
              points="12,6 18,12 12,18 6,12"
              fill="none"
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
      case 'emptyCircle':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="4"
              fill="none"
              stroke={shapeColor}
              strokeWidth="2"
            />
          </svg>
        );
      case 'filledCircle':
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

  // Reusable button component
  const SignalButton = ({ shapeName, color, children, extraStyle = {} }) => (
    <button
      onClick={() => handleSignalClick(shapeName, color)}
      disabled={isDisabled}
      style={{ ...buttonStyle, color, width: '100%', ...extraStyle }}
      title={`${shapeName} - ${color === COLORS.RED ? 'Red' : 'Blue'}`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Direction Section */}
      <h3 style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}>
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
        <SignalButton
          shapeName="Direction Up"
          color={COLORS.RED}
          extraStyle={{ fontSize: '20px' }}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            style={{ width: '20px', height: '20px' }}
          />
        </SignalButton>
        <SignalButton
          shapeName="Direction Down"
          color={COLORS.RED}
          extraStyle={{ fontSize: '20px' }}
        >
          <FontAwesomeIcon
            icon={faArrowDown}
            style={{ width: '20px', height: '20px' }}
          />
        </SignalButton>
        <SignalButton
          shapeName="Direction Up"
          color={COLORS.BLUE}
          extraStyle={{ fontSize: '20px' }}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            style={{ width: '20px', height: '20px' }}
          />
        </SignalButton>
        <SignalButton
          shapeName="Direction Down"
          color={COLORS.BLUE}
          extraStyle={{ fontSize: '20px' }}
        >
          <FontAwesomeIcon
            icon={faArrowDown}
            style={{ width: '20px', height: '20px' }}
          />
        </SignalButton>
      </div>

      {/* Elevation Section */}
      <h3 style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}>
        Elevation
      </h3>
      <div style={{ marginBottom: '25px' }}>
        {elevationItems.map((item) => (
          <div key={item.name} style={threeColRowStyle}>
            <SignalButton shapeName={item.name} color={COLORS.RED}>
              {renderElevationShape(item.shape, COLORS.RED)}
            </SignalButton>
            <div style={labelStyle}>{item.name}</div>
            <SignalButton shapeName={item.name} color={COLORS.BLUE}>
              {renderElevationShape(item.shape, COLORS.BLUE)}
            </SignalButton>
          </div>
        ))}
      </div>

      {/* Other Section */}
      <h3 style={{ color: 'black', marginBottom: '10px', textAlign: 'center' }}>
        Other
      </h3>
      <div style={{ marginBottom: '10px' }}>
        {/* Block */}
        <div style={threeColRowStyle}>
          <SignalButton
            shapeName="Block"
            color={COLORS.RED}
            extraStyle={{ fontSize: '24px' }}
          >
            ■
          </SignalButton>
          <div style={labelStyle}>Block</div>
          <SignalButton
            shapeName="Block"
            color={COLORS.BLUE}
            extraStyle={{ fontSize: '24px' }}
          >
            ■
          </SignalButton>
        </div>

        {/* Split Hands */}
        <div style={threeColRowStyle}>
          <SignalButton
            shapeName="Split Hands"
            color={COLORS.RED}
            extraStyle={{ fontSize: '20px', fontWeight: 'bold' }}
          >
            ×
          </SignalButton>
          <div style={labelStyle}>Split Hands</div>
          <SignalButton
            shapeName="Split Hands"
            color={COLORS.BLUE}
            extraStyle={{ fontSize: '20px', fontWeight: 'bold' }}
          >
            ×
          </SignalButton>
        </div>

        {/* Link Hands */}
        <div style={threeColRowStyle}>
          <SignalButton
            shapeName="Link Hands"
            color={COLORS.RED}
            extraStyle={{ fontSize: '18px' }}
          >
            <FontAwesomeIcon icon={faLink} />
          </SignalButton>
          <div style={labelStyle}>Link Hands</div>
          <SignalButton
            shapeName="Link Hands"
            color={COLORS.BLUE}
            extraStyle={{ fontSize: '18px' }}
          >
            <FontAwesomeIcon icon={faLink} />
          </SignalButton>
        </div>
      </div>
    </div>
  );
};

// Tab metadata for parent component
export const signalsTabConfig = {
  key: 'signals',
  label: 'Signals',
  icon: <FontAwesomeIcon icon={faSyncAlt} />,
  component: SignalsTab,
};

export default SignalsTab;
