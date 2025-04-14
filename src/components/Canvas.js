import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppContext } from './AppContext';

const Canvas = ({ panelId }) => {
  const {
    panels,
    panelSize,
    opacity,
    handleCanvasClick,
    handleDancerSelection,
    handleHandClick,
    updateDancerState,
    selectedDancer,
    selectedHand,
  } = useAppContext();

  // Find the panel data based on the supplied ID
  const panel = panels.find((p) => p.id === panelId);

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
        {shapes.map((shape) => (
          <Symbol
            key={shape.id}
            shapeProps={shape}
            panelId={panelId}
            opacity={opacity.symbols.value} //pass opacity
            disabled={opacity.symbols.disabled} //pass whether object is disabled
          />
        ))}
        {/* Render the dancers */}
        {dancers.map((dancer, index) => (
          <Dancer
            dancer={dancer}
            key={dancer.id}
            chosenHead={headShapes[index]} //pass the chosen head
            chosenHandShapes={handShapes[index]} //pass the chosen hand
            opacity={opacity.dancers.value} //pass opacity
            disabled={opacity.dancers.disabled} //pass whether the object is disabled
            initialState={dancer}
            handleDancerSelection={(...args) =>
              handleDancerSelection(panelId, ...args)
            }
            handleHandClick={(...args) => handleHandClick(panelId, ...args)}
            updateDancerState={(...args) => updateDancerState(panelId, ...args)}
            isSelected={selectedDancer && selectedDancer.dancerId === dancer.id}
            selectedHand={
              selectedHand && selectedHand.dancerId === dancer.id
                ? selectedHand
                : null
            }
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default Canvas;
