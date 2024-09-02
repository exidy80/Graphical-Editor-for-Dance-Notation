import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoePrints, faArrowRight, faSyncAlt, faLongArrowAltRight, faArrowLeft, faHand } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from './AppContext';

// Map the shapes to their types 
const shapeMapping = {
  'Straight Line': { type: 'straightLine' },
  'Curved Line': { type: 'curvedLine' },
  '2 Spin': { type: 'spinThree' },
  '1.5 Spin': { type: 'spinTwo' },
  '1 Spin': { type: 'spinOne' },
  'Half Spin': { type: 'spinHalf' },
  'Quarter Spin': { type: 'spinQuarter' },
  'Signal': { type: 'signal' },
  'Left Foot Basic': { type: 'image', imageKeyRed: 'leftFootBasicRed', imageKeyBlue: 'leftFootBasicBlue' },
  'Right Foot Basic': { type: 'image', imageKeyRed: 'rightFootBasicRed', imageKeyBlue: 'rightFootBasicBlue' },
  'Left Heel': { type: 'image', imageKeyRed: 'leftHeelRed', imageKeyBlue: 'leftHeelBlue' },
  'Right Heel': { type: 'image', imageKeyRed: 'rightHeelRed', imageKeyBlue: 'rightHeelBlue' },
  'Left Ball': { type: 'image', imageKeyRed: 'leftBallRed', imageKeyBlue: 'leftBallBlue' },
  'Right Ball': { type: 'image', imageKeyRed: 'rightBallRed', imageKeyBlue: 'rightBallBlue' },
  'Whole Left': { type: 'image', imageKeyRed: 'wholeRedLeft', imageKeyBlue: 'wholeBlueLeft' },
  'Whole Right': { type: 'image', imageKeyRed: 'wholeRedRight', imageKeyBlue: 'wholeBlueRight' },
  'Hov Left': { type: 'image', imageKeyRed: 'hovRedLeft', imageKeyBlue: 'hovBlueLeft' },
  'Hov Right': { type: 'image', imageKeyRed: 'hovRedRight', imageKeyBlue: 'hovBlueRight' },
  'Centre Point': { type: 'image', imageKeyRed: 'centrePoint', imageKeyBlue: 'centrePoint'},
  'Knee': { type: 'knee'},
  'Waist': { type: 'waist'},
  'Shoulder': { type: 'shoulder'},
  'Overhead': {type: 'overhead'}
};

// Map the feet types to left or right
const feetButtonMapping = {
  'Basic': { left: 'Left Foot Basic', right: 'Right Foot Basic' },
  'Heel': { left: 'Left Heel', right: 'Right Heel' },
  'Ball': { left: 'Left Ball', right: 'Right Ball' },
  'Whole': { left: 'Whole Left', right: 'Whole Right' },
  'Hover': { left: 'Hov Left', right: 'Hov Right' },
};


const Sidebar = () => {
  // Funcs from context
  const { handleShapeDraw, selectedPanel } = useAppContext();
  //Local states for the sidebar
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isRed, setIsRed] = useState(true);

  //Categories and the shapes in them
  const categories = {
    movement: { 
      icon: <FontAwesomeIcon icon={faArrowRight} style={{ color: 'white' }} />,
      items: ['Straight Line', 'Curved Line']
    },
    spin: { 
      icon: <FontAwesomeIcon icon={faSyncAlt} style={{ color: 'white' }} />, 
      items: ['2 Spin', '1.5 Spin', '1 Spin', 'Half Spin', 'Quarter Spin']
    },
    signal: {
      icon: <FontAwesomeIcon icon={faLongArrowAltRight} style={{ color: 'white' }} />,
      items: ['Signal']
    },
    feet: {
      icon: <FontAwesomeIcon icon={faShoePrints} style={{ color: 'white' }} />,
      items: ['Basic', 'Heel', 'Ball', 'Whole', 'Hover']
    },
    hands: {
      icon: <FontAwesomeIcon icon={faHand} style={{ color: 'white'}} />,
      items: ['Knee', 'Waist', 'Shoulder', 'Overhead']
    },
  };

  //Handle clicking on a shape in the sidebar
  const handleItemClick = (item, side = null) => {
    let shapeKey = item;
    if (selectedCategory === 'feet' && side) { //SPecial case for the feet
      shapeKey = feetButtonMapping[item][side]; //Get key for L/R versions
      const shapeProps = shapeMapping[shapeKey];
      if (selectedPanel !== null) {//Make sure a panel is selected
        const imageKey = isRed ? shapeProps.imageKeyRed : shapeProps.imageKeyBlue;//display colour based on toggle
        handleShapeDraw({
          id: uuidv4(),
          ...shapeProps,
          imageKey,
          x: 50,
          y: 50,
          draggable: true
        });
      }
    } else { //other shapes
      const shapeProps = shapeMapping[shapeKey];
      if (selectedPanel !== null) { //Make sure a panel is selected
        const colour = isRed ? 'red' : 'blue';//Colour based on toggle
        handleShapeDraw({
          id: uuidv4(),
          ...shapeProps,
          stroke: colour,
          fill: colour,
          x: 50,
          y: 50,
          draggable: true
        });
      }
    }
  };

  //Handle clicking on a category
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setIsExpanded(true);//OPen the sidebar
  };

  //different feet layout (grid)
  const renderFeetButtons = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '48%' }}>
          <h3 style={{ color: 'black', textAlign: 'center', marginBottom: '10px' }}>Left</h3>
          {categories.feet.items.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item, 'left')}
              style={{ 
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '5px',
                backgroundColor: isRed ? 'red' : 'blue',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div style={{ width: '48%' }}>
          <h3 style={{ color: 'black', textAlign: 'center', marginBottom: '10px' }}>Right</h3>
          {categories.feet.items.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item, 'right')}
              style={{ 
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '5px',
                backgroundColor: isRed ? 'red' : 'blue',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
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
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <div style={{ 
        width: isExpanded ? '250px' : '60px', //Sizes for both states
        height: '100vh',
        backgroundColor: '#333', 
        transition: 'width 0.3s',//Go to and from current size to new size in 0.3s
        overflow: 'hidden'
      }}>
        {Object.entries(categories).map(([key, { icon }]) => (
          <button 
            key={key} 
            onClick={() => handleCategoryClick(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              width: '100%',
              padding: '30px',
              gap: '10px',
              marginBottom: '10px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: '1'
            }}
          >
            {icon} {isExpanded && key}
          </button>
        ))}
      </div>
      {isExpanded && (
        <div style={{ width: '200px', padding: '20px', backgroundColor: '#E2E2E2', position: 'relative' }}>
          <button 
            onClick={() => setIsExpanded(false)}
            style={{ 
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'transparent',
              color: 'black',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2>{selectedCategory}</h2>
          <div style={{ marginBottom: '20px' }}>
            {/* Toggle button */}
            <Toggle
              checked={isRed}
              icons={false}
              onChange={() => setIsRed(!isRed)}
              className="colour-toggle"
            />
          </div>
          {selectedCategory && selectedCategory !== 'feet' && categories[selectedCategory].items.map((item) => (
            /* Buttons for selected category */
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              style={{ 
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '5px',
                backgroundColor: isRed ? 'red' : 'blue',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {item}
            </button>
          ))}
           {selectedCategory === 'feet' && renderFeetButtons()} {/* Feet version */}
        </div>
      )}
    </div>
  );
};

export default Sidebar;