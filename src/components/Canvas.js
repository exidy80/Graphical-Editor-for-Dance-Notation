import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppContext } from './AppContext';

const Canvas = ({ panel }) => {
  const {
    panelSize,
    opacity,
    handleCanvasClick,
    handleDancerSelection,
    handleHandClick,
    handleShapeSelection,
    updateDancerState,
    updateShapeState,
    selectedDancer,
    selectedHand,
    selectedShapeId,
  } = useAppContext();

  // If it's not found for some reason, don't render anything
  if (!panel) return null;
  // Get the data from the panel
  const { dancers, headShapes, handShapes, shapes } = panel;

  //Triggers if the user clicks on the canvas itself
  const handleCanvasClickInternal = (e) => {
    if (e.target === e.target.getStage()) {
      handleCanvasClick();
    }
  };

  //Konva stage
  return (
    <Stage
      width={panelSize.width - 4} //Slightly smaller than container
      height={panelSize.height - 4}
      onMouseDown={handleCanvasClickInternal} // Lets you deselect the dancer/shape currently selected by clicking an empty area
    >
      <Layer>
        {/* Render the shapes */}
        {shapes.map((shape) => {
          const isSelected =
            selectedShapeId && selectedShapeId.shapeId === shape.id;
          return (
            <Symbol
              key={shape.id}
              shapeProps={shape}
              opacity={opacity.symbols.value} //pass opacity
              disabled={opacity.symbols.disabled} //pass whether object is disabled
              isSelected={isSelected} //pass whether the object is selected
              handleShapeSelection={(...args) =>
                handleShapeSelection(panel.id, ...args)
              }
              updateShapeState={(...args) =>
                updateShapeState(panel.id, ...args)
              }
            />
          );
        })}
        {/* Render the dancers */}
        {dancers.map((dancer, index) => {
          const isSelected =
            selectedDancer && selectedDancer.dancerId === dancer.id;
          const handSelection =
            selectedHand && selectedHand.dancerId === dancer.id
              ? selectedHand
              : null;
          return (
            <Dancer
              dancer={dancer}
              key={dancer.id}
              chosenHead={headShapes[index]} //pass the chosen head
              chosenHandShapes={handShapes[index]} //pass the chosen hand
              opacity={opacity.dancers.value} //pass opacity
              disabled={opacity.dancers.disabled} //pass whether the object is disabled
              handleDancerSelection={(...args) =>
                handleDancerSelection(panel.id, ...args)
              }
              handleHandClick={(...args) => handleHandClick(panel.id, ...args)}
              updateDancerState={(...args) =>
                updateDancerState(panel.id, ...args)
              }
              isSelected={isSelected}
              selectedHand={handSelection}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default Canvas;
