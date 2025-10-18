import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from './useAppStore';

const Canvas = ({ panelId }) => {
  const panels = useAppStore((state) => state.panels);
  const panelSize = useAppStore((state) => state.panelSize);
  const opacity = useAppStore((state) => state.opacity);
  const handleCanvasClick = useAppStore((state) => state.handleCanvasClick);

  const panel = panels.find((p) => p.id === panelId);
  if (!panel) return null;

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
        {shapes.map((shape) => (
          <Symbol
            key={shape.id}
            shapeProps={shape}
            panelId={panelId}
            opacity={opacity.symbols.value}
            disabled={opacity.symbols.disabled}
          />
        ))}
        {dancers.map((dancer, index) => (
          <Dancer
            key={dancer.id}
            id={dancer.id}
            panelId={panelId}
            chosenHead={headShapes[index]}
            chosenHandShapes={handShapes[index]}
            opacity={opacity.dancers.value}
            disabled={opacity.dancers.disabled}
            initialState={dancer}
            {...dancer}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default Canvas;
