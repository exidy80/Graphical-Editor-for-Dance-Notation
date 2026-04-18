import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoePrints } from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../stores';
import images from './ImageMapping';
import {
  COLORS,
  SIDES,
  feetButtonMapping,
  shapeMapping,
} from './sidebarConstants';

const FootworkTab = ({ selectedPanel }) => {
  const armFeetPlacement = useAppStore((state) => state.armFeetPlacement);
  const items = ['Basic', 'Hover', 'Heel', 'Ball', 'Whole'];
  const isDisabled = selectedPanel === null;

  // Shared styles
  const buttonStyle = {
    height: '40px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '5px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    opacity: isDisabled ? 0.5 : 1,
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '5px',
    marginBottom: '8px',
  };

  // Helper to get image key for footwork items
  const getFootImageKey = (item, side, color) => {
    const shapeKey = feetButtonMapping[item][side];
    const shapeProps = shapeMapping[shapeKey];
    return color === COLORS.RED
      ? shapeProps.imageKeyRed
      : shapeProps.imageKeyBlue;
  };

  // Handle footwork button click - arms feet placement mode
  const handleFootworkClick = (item, side, color) => {
    if (selectedPanel === null) return;

    const shapeKey = feetButtonMapping[item][side];
    const shapeProps = shapeMapping[shapeKey];
    const imageKey =
      color === COLORS.RED ? shapeProps.imageKeyRed : shapeProps.imageKeyBlue;

    armFeetPlacement({
      panelId: selectedPanel,
      symbolDraft: {
        id: uuidv4(),
        ...shapeProps,
        imageKey,
        draggable: true,
      },
    });
  };

  // Reusable button component
  const FootButton = ({ item, side, color, extraStyle = {} }) => (
    <button
      onClick={() => handleFootworkClick(item, side, color)}
      disabled={isDisabled}
      style={{
        ...buttonStyle,
        backgroundImage: `url(${images[getFootImageKey(item, side, color)]})`,
        ...extraStyle,
      }}
      title={`${item} - ${color === COLORS.RED ? 'Red' : 'Blue'} ${
        side === SIDES.LEFT ? 'Left' : 'Right'
      }`}
    />
  );

  return (
    <div>
      {items.map((item) => (
        <div key={item} style={rowStyle}>
          <FootButton item={item} side={SIDES.LEFT} color={COLORS.BLUE} />
          <FootButton
            item={item}
            side={SIDES.RIGHT}
            color={COLORS.BLUE}
            extraStyle={{ marginRight: '10px' }}
          />
          <FootButton item={item} side={SIDES.LEFT} color={COLORS.RED} />
          <FootButton item={item} side={SIDES.RIGHT} color={COLORS.RED} />
        </div>
      ))}
    </div>
  );
};

// Tab metadata for parent component
export const footworkTabConfig = {
  key: 'footwork',
  label: 'Footwork',
  icon: <FontAwesomeIcon icon={faShoePrints} />,
  component: FootworkTab,
};

export default FootworkTab;
