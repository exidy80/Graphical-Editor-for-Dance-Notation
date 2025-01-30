import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext(); // create context

//Creates the initial panel with default dancer positions and shapes
const createInitialPanel = () => ({
  id: uuidv4(),
  dancers: [
    //Dancers have initial values set which are then updated as they are moved etc
    {
      //Red dancer
      id: uuidv4(),
      x: 150,
      y: 40,
      colour: 'red',
      rotation: 180, //So the dancer faces the other one
      scaleX: 1,
      scaleY: 1,
      leftHandPos: { x: -30, y: -40 }, // Add initial positions
      rightHandPos: { x: 30, y: -40 },
      leftElbowPos: { x: -45, y: -12 },
      rightElbowPos: { x: 45, y: -12 },
      leftHandRotation: 0,
      rightHandRotation: 0,
      leftUpperArmThickness: 'thick',
      leftLowerArmThickness: 'thick',
      rightUpperArmThickness: 'thick',
      rightLowerArmThickness: 'thick',
    },
    {
      //blue dancer
      id: uuidv4(),
      x: 150,
      y: 220,
      colour: 'blue',
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      leftHandPos: { x: -30, y: -40 }, // Add initial positions
      rightHandPos: { x: 30, y: -40 },
      leftElbowPos: { x: -45, y: -12 },
      rightElbowPos: { x: 45, y: -12 },
      leftHandRotation: 0,
      rightHandRotation: 0,
      leftArmThickness: 'thick',
      rightArmThickness: 'thick',
    },
  ],
  headShapes: ['Upright', 'Upright'], //default head shapes
  handShapes: [
    //default hand shapes for each hand/dancer
    { left: 'Waist', right: 'Waist' },
    { left: 'Waist', right: 'Waist' },
  ],
  shapes: [
    {
      // X on the floor indicating the middle of stage
      id: uuidv4(),
      type: 'stageX',
      x: 147,
      y: 127,
      width: 20,
      height: 20,
      draggable: true,
      text: 'X',
      fontSize: 20,
      fill: 'black',
    },
  ],
});

export const AppProvider = ({ children }) => {
  // State declarations
  const [panelSize] = useState({ width: 300, height: 300 });
  //null so that nothing is selected to begin with
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedHand, setSelectedHand] = useState(null);
  const [selectedDancer, setSelectedDancer] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [panels, setPanels] = useState([createInitialPanel()]);
  const [opacity, setOpacity] = useState({
    dancers: { value: 1, disabled: false },
    symbols: { value: 1, disabled: false },
  });

  // Handler functions
  //Selects the dancer when clicked
  const handleDancerSelection = (panelId, dancerId) => {
    setSelectedPanel(panelId);
    setSelectedDancer((prevSelected) => {
      if (
        prevSelected &&
        prevSelected.panelId === panelId &&
        prevSelected.dancerId === dancerId
      ) {
        return null; // Deselect if clicking the same dancer
      }
      return { panelId, dancerId };
    });
  };
  // Selects hand when clicked
  const handleHandClick = (panelId, dancerId, handSide) => {
    setSelectedPanel(panelId); //So that panel is selected at same time, so no need to click twice
    setSelectedHand((prevHand) => {
      if (
        prevHand &&
        prevHand.panelId === panelId &&
        prevHand.dancerId === dancerId &&
        prevHand.handSide === handSide
      ) {
        return null; // Deselect if clicking the same hand
      }
      return { panelId, dancerId, handSide };
    });
  };

  //Deselects everything when the canvas is clicked so user can clear current selections easily
  const handleCanvasClick = () => {
    setSelectedPanel(null);
    setSelectedHand(null);
    setSelectedDancer(null);
    setSelectedShapeId(null);
  };

  // Handles opacity and interactivity of Dancers/shapes when toggled
  const handleOpacityChange = (type) => {
    setOpacity((prev) => ({
      ...prev,
      [type]: {
        value: prev[type].value === 1 ? 0.5 : 1,
        disabled: prev[type].value === 1,
      },
    }));
  };

  //Updates the shape of the selected hand when chosen from dropdown
  const handleHeadSelection = (shape) => {
    if (selectedDancer) {
      setPanels((prevPanels) =>
        prevPanels.map((panel) => {
          if (panel.id === selectedDancer.panelId) {
            const dancerIndex = panel.dancers.findIndex(
              (dancer) => dancer.id === selectedDancer.dancerId,
            );
            if (dancerIndex !== -1) {
              const newHeadShapes = [...panel.headShapes];
              newHeadShapes[dancerIndex] = shape;
              return { ...panel, headShapes: newHeadShapes };
            }
          }
          return panel;
        }),
      );
    }
  };

  //Updates the shape of the selected hand when chosen from dropdown
  const handleHandSelection = (shape) => {
    if (selectedHand) {
      setPanels((prevPanels) =>
        prevPanels.map((panel) => {
          if (panel.id === selectedHand.panelId) {
            const dancerIndex = panel.dancers.findIndex(
              (dancer) => dancer.id === selectedHand.dancerId,
            );
            const newHandShapes = [...panel.handShapes];
            newHandShapes[dancerIndex] = {
              ...newHandShapes[dancerIndex],
              [selectedHand.handSide]: shape,
            };
            return { ...panel, handShapes: newHandShapes };
          }
          return panel;
        }),
      );
    }
  };

  //Updates selected panel. Used to know which panel to add shapes to etc
  const handlePanelSelection = (panelId) => {
    //updates the ID of selected Panel
    setSelectedPanel(panelId);
  };

  //Selects and deselects shapes when clicked
  const handleShapeSelection = (panelId, shapeId) => {
    setSelectedPanel(panelId);
    setSelectedShapeId((prevSelected) => {
      if (
        prevSelected &&
        prevSelected.panelId === panelId &&
        prevSelected.shapeId === shapeId
      ) {
        return null; // Deselect if clicking the same shape
      }
      return { panelId, shapeId };
    });
  };

  // Adds a new shape to the selected panel
  const handleShapeDraw = (shape) => {
    if (selectedPanel !== null) {
      setPanels((prevPanels) =>
        prevPanels.map((panel) => {
          if (panel.id === selectedPanel) {
            return { ...panel, shapes: [...panel.shapes, shape] };
          }
          return panel;
        }),
      );
    }
  };

  // Deletes a shape
  const handleDelete = (selectedShape) => {
    if (!selectedShape) {
      return;
    }
    const { panelId, shapeId } = selectedShape;
    setPanels((prevPanels) => {
      const updatedPanels = prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            shapes: panel.shapes.filter((shape) => shape.id !== shapeId),
          };
        }
        return panel;
      });
      return updatedPanels;
    });
    setSelectedShapeId(null); //Clears the shape from being selected after deletion
  };

  //Adds a new panel
  const addPanel = () => {
    const newPanel = createInitialPanel(); //initializes with the default contents
    setPanels((prevPanels) => [...prevPanels, newPanel]); // add it to the array
  };

  //Deletes Panel
  const deleteSelectedPanel = useCallback(
    (panelId) => {
      if (panelId && panels.length > 1) {
        setPanels((prevPanels) =>
          prevPanels.filter((panel) => panel.id !== panelId),
        );

        if (selectedPanel === panelId) {
          //Deselect everything
          setSelectedPanel(null);
          setSelectedDancer(null);
          setSelectedHand(null);
          setSelectedShapeId(null);
        }
      }
    },
    [panels.length, selectedPanel],
  );

  //Updates state of a dancer
  const updateDancerState = useCallback((panelId, dancerId, newState) => {
    setPanels((prevPanels) =>
      prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            dancers: panel.dancers.map((dancer) => {
              if (dancer.id === dancerId) {
                return { ...dancer, ...newState };
              }
              return dancer;
            }),
          };
        }
        return panel;
      }),
    );
  }, []);

  //Updates state of shape
  const updateShapeState = useCallback((panelId, shapeId, newProps) => {
    setPanels((prevPanels) =>
      prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            shapes: panel.shapes.map((shape) => {
              if (shape.id === shapeId) {
                return { ...shape, ...newProps };
              }
              return shape;
            }),
          };
        }
        return panel;
      }),
    );
  }, []);

  //Creates a copy of a panel for serialization
  const serializePanel = (panelId) => {
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return null;

    return {
      ...panel,
      dancers: panel.dancers.map((dancer) => ({
        id: dancer.id,
        x: dancer.x,
        y: dancer.y,
        rotation: dancer.rotation,
        scaleX: dancer.scaleX,
        scaleY: dancer.scaleY,
        colour: dancer.colour,
        headShape: panel.headShapes[panel.dancers.indexOf(dancer)],
        handShapes: panel.handShapes[panel.dancers.indexOf(dancer)],
        leftHandPos: dancer.leftHandPos,
        rightHandPos: dancer.rightHandPos,
        leftElbowPos: dancer.leftElbowPos,
        rightElbowPos: dancer.rightElbowPos,
        leftHandRotation: dancer.leftHandRotation,
        rightHandRotation: dancer.rightHandRotation,
        leftLowerArmThickness: dancer.leftLowerArmThickness,
        leftUpperArmThickness: dancer.leftUpperArmThickness,
        rightLowerArmThickness: dancer.rightLowerArmThickness,
        rightUpperArmThickness: dancer.rightUpperArmThickness,
      })),
      shapes: panel.shapes.map((shape) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        draggable: shape.draggable,
        rotation: shape.rotation,
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
        opacity: shape.opacity,
        stroke: shape.stroke,
        fill: shape.fill,
        imageKey: shape.imageKey, // for image shapes
      })),
    };
  };

  // Creates a new panel from serialized data, assigning new IDs
  const deserializePanel = (serializedPanel) => {
    return {
      ...serializedPanel,
      id: uuidv4(), // New ID for the cloned panel
      dancers: serializedPanel.dancers.map((dancer) => ({
        ...dancer,
        id: uuidv4(), // New ID for each cloned dancer
      })),
      shapes: serializedPanel.shapes.map((shape) => ({
        ...shape,
        id: uuidv4(), // New ID for each cloned shape
      })),
    };
  };

  // Clones a panel and adds it to the list of panels
  const clonePanel = (panelId) => {
    const serializedPanel = serializePanel(panelId);
    if (!serializedPanel) return;

    const clonedPanel = deserializePanel(serializedPanel);

    setPanels((prevPanels) => {
      const index = prevPanels.findIndex((panel) => panel.id === panelId);
      const newPanels = [...prevPanels];
      newPanels.splice(index + 1, 0, clonedPanel); //So that it is placed next to the cloned panel
      return newPanels;
    });
  };

  //Move a panel left or right in the order
  const movePanel = (panelId, direction) => {
    setPanels((prevPanels) => {
      const panelIndex = prevPanels.findIndex((panel) => panel.id === panelId);
      if (panelIndex === -1) return prevPanels;

      const newPanels = [...prevPanels];
      const panel = newPanels[panelIndex];

      if (direction === 'right' && panelIndex < newPanels.length - 1) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex + 1, 0, panel);
      } else if (direction === 'left' && panelIndex > 0) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex - 1, 0, panel);
      }

      return newPanels;
    });
  };

  // Context for Children
  return (
    <AppContext.Provider
      value={{
        panels,
        setPanels,
        panelSize,
        movePanel,
        selectedPanel,
        setSelectedPanel,
        selectedHand,
        setSelectedHand,
        selectedDancer,
        setSelectedDancer,
        selectedShapeId,
        setSelectedShapeId,
        opacity,
        setOpacity,
        handleDancerSelection,
        handleHandClick,
        handleCanvasClick,
        handleOpacityChange,
        handleHeadSelection,
        handleHandSelection,
        handlePanelSelection,
        handleShapeDraw,
        handleDelete,
        handleShapeSelection,
        addPanel,
        updateDancerState,
        updateShapeState,
        serializePanel,
        deserializePanel,
        clonePanel,
        deleteSelectedPanel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
