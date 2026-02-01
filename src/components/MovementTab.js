import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faRedo,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { COLORS, shapeMapping } from './sidebarConstants';

const MovementTab = ({ selectedPanel, handleShapeDraw }) => {
  const isDisabled = selectedPanel === null;
  const motionItems = [
    'Straight Line',
    'Half Curved Line',
    'Quarter Curved Line',
  ];
  const spinItems = [
    'Quarter Spin',
    'Half Spin',
    '1 Spin',
    '1.5 Spin',
    '2 Spin',
  ];

  // Shared styles
  const buttonStyle = {
    height: '30px',
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
  };

  const spinButtonStyle = {
    ...buttonStyle,
    fontSize: '18px',
    fontWeight: '600',
  };

  const rowStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'center',
  };

  const indicatorStyle = {
    width: '50px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  };

  // Handle movement button click - creates shape with proper properties
  const handleMovementClick = (shapeKey, color) => {
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

  // Helper to render quarter curved line icon
  const renderQuarterCurvedLineIcon = (color, direction = 'up') => {
    const isUp = direction === 'up';
    const lineColor = color === COLORS.RED ? 'red' : 'blue';
    const markerId = `arrowhead-quarter-${color}-${direction}`; // Unique ID for each variant

    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 Z" fill={lineColor} />
          </marker>
        </defs>

        <path
          d={isUp ? 'M16 24 Q 8 16 16 8' : 'M16 8 Q 8 16 16 24'}
          stroke={lineColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
    );
  };

  // Helper to render half-turn curved line icon
  const renderHalfCurvedLineIcon = (color, direction = 'up') => {
    const isUp = direction === 'up';
    const lineColor = color === COLORS.RED ? 'red' : 'blue';
    const markerId = `arrowhead-half-${color}-${direction}`; // Unique ID for each variant

    return (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <marker
            id={markerId}
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 Z" fill={lineColor} />
          </marker>
        </defs>

        <path
          d={isUp ? 'M20 24 Q 4 16 20 8' : 'M20 8 Q 4 16 20 24'}
          stroke={lineColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
    );
  };

  // Get icon for item based on direction
  const getIcon = (item, color, direction) => {
    if (item === 'Straight Line') {
      return renderArrowIcon(color, direction);
    } else if (item === 'Quarter Curved Line') {
      return renderQuarterCurvedLineIcon(color, direction);
    } else if (item === 'Half Curved Line') {
      return renderHalfCurvedLineIcon(color, direction);
    }
    return null;
  };

  // Reusable button component
  const MovementButton = ({ item, direction, color, children, style = {} }) => (
    <button
      onClick={() => handleMovementClick(`${item} ${direction}`, color)}
      disabled={isDisabled}
      style={{ ...buttonStyle, color, ...style }}
      title={`${item} ${direction} - ${color === COLORS.RED ? 'Red' : 'Blue'}`}
    >
      {children}
    </button>
  );

  const SpinButton = ({ item, rotation, color, label }) => (
    <button
      onClick={() => handleMovementClick(`${item} ${rotation}`, color)}
      disabled={isDisabled}
      style={{ ...spinButtonStyle, color }}
      title={`${item} ${rotation} - ${color === COLORS.RED ? 'Red' : 'Blue'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Motion Section */}
      <h3 style={{ color: 'black', marginBottom: '15px', textAlign: 'center' }}>
        Move
      </h3>
      <div style={{ marginBottom: '20px' }}>
        {motionItems.map((item) => (
          <div key={item} style={rowStyle}>
            <MovementButton item={item} direction="Up" color={COLORS.RED}>
              {getIcon(item, COLORS.RED, 'up')}
            </MovementButton>
            <MovementButton item={item} direction="Down" color={COLORS.RED}>
              {getIcon(item, COLORS.RED, 'down')}
            </MovementButton>
            <div style={{ flex: 1 }} />
            <MovementButton item={item} direction="Up" color={COLORS.BLUE}>
              {getIcon(item, COLORS.BLUE, 'up')}
            </MovementButton>
            <MovementButton item={item} direction="Down" color={COLORS.BLUE}>
              {getIcon(item, COLORS.BLUE, 'down')}
            </MovementButton>
          </div>
        ))}
      </div>

      {/* Spin Section */}
      <h3 style={{ color: 'black', marginBottom: '15px', textAlign: 'center' }}>
        Spin
      </h3>

      {/* Spin Indicators Header */}
      <div style={rowStyle}>
        <div style={{ ...indicatorStyle, color: 'red' }}>
          <FontAwesomeIcon icon={faRedo} />
        </div>
        <div style={{ ...indicatorStyle, color: 'red' }}>
          <FontAwesomeIcon icon={faUndo} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ ...indicatorStyle, color: 'blue' }}>
          <FontAwesomeIcon icon={faRedo} />
        </div>
        <div style={{ ...indicatorStyle, color: 'blue' }}>
          <FontAwesomeIcon icon={faUndo} />
        </div>
      </div>

      {/* Spin Buttons */}
      <div style={{ marginBottom: '20px' }}>
        {spinItems.map((item) => {
          const spinMap = {
            'Quarter Spin': '1/4',
            'Half Spin': '1/2',
            '1 Spin': '1',
            '1.5 Spin': '1.5',
            '2 Spin': '2',
          };
          const label = spinMap[item] || item;

          return (
            <div key={item} style={rowStyle}>
              <SpinButton
                item={item}
                rotation="CW"
                color={COLORS.RED}
                label={label}
              />
              <SpinButton
                item={item}
                rotation="CCW"
                color={COLORS.RED}
                label={label}
              />
              <div style={{ flex: 1 }} />
              <SpinButton
                item={item}
                rotation="CW"
                color={COLORS.BLUE}
                label={label}
              />
              <SpinButton
                item={item}
                rotation="CCW"
                color={COLORS.BLUE}
                label={label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Tab metadata for parent component
export const movementTabConfig = {
  key: 'movement',
  label: 'Movement',
  icon: <FontAwesomeIcon icon={faArrowRight} />,
  component: MovementTab,
};

export default MovementTab;
