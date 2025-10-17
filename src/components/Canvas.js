import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from './useAppStore';

const Canvas = ({ panelId }) => {
  const panels = useAppStore(state => state.panels);
  const panelSize = useAppStore(state => state.panelSize);
  const opacity = useAppStore(state => state.opacity);
  const handleCanvasClick = useAppStore(state => state.handleCanvasClick);

  // Find the panel data based on the supplied ID
  const panel = panels.find(p => p.id === panelId);
  
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
            opacity={opacity.symbols.value}//pass opacity
            disabled={opacity.symbols.disabled}//pass whether object is disabled
          />
        ))}
        {/* Render the dancers */}
        {dancers.map((dancer, index) => (
          <Dancer
            key={dancer.id}
            id={dancer.id}
            panelId={panelId}
            chosenHead={headShapes[index]} //pass the chosen head
            chosenHandShapes={handShapes[index]}//pass the chosen hand
            opacity={opacity.dancers.value}//pass opacity
            disabled={opacity.dancers.disabled}//pass whether the object is disabled
            initialState={dancer}
            {...dancer}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default Canvas;