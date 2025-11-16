import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from '../stores';

const Canvas = ({ panelId }) => {
  const panels = useAppStore((state) => state.panels);
  const panelSize = useAppStore((state) => state.panelSize);
  const opacity = useAppStore((state) => state.opacity);
  const selectedDancer = useAppStore((state) => state.selectedDancer);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const handFlash = useAppStore((state) => state.handFlash);
  const handleCanvasClick = useAppStore((state) => state.handleCanvasClick);
  const handleDancerSelection = useAppStore(
    (state) => state.handleDancerSelection,
  );
  const handleHandClick = useAppStore((state) => state.handleHandClick);
  const updateDancerState = useAppStore((state) => state.updateDancerState);
  const updateHandPosition = useAppStore((state) => state.updateHandPosition);
  const updateHandRotation = useAppStore((state) => state.updateHandRotation);
  const startDragMode = useAppStore((state) => state.startDragMode);
  const endDragMode = useAppStore((state) => state.endDragMode);
  const selectedShapeId = useAppStore((state) => state.selectedShapeId);
  const handleShapeSelection = useAppStore(
    (state) => state.handleShapeSelection,
  );
  const updateShapeState = useAppStore((state) => state.updateShapeState);

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
        {shapes.map((shape) => {
          // Create bound functions that inject panelId and shapeId
          const boundUpdateShapeState = (newState) =>
            updateShapeState(panelId, shape.id, newState);
          const boundHandleShapeSelection = () =>
            handleShapeSelection(panelId, shape.id);

          // Check if this shape is selected
          const isSelected =
            selectedShapeId &&
            selectedShapeId.panelId === panelId &&
            selectedShapeId.shapeId === shape.id;

          return (
            <Symbol
              key={shape.id}
              shape={shape}
              isSelected={isSelected}
              disabled={opacity.symbols.disabled}
              opacity={opacity.symbols.value}
              onShapeSelect={boundHandleShapeSelection}
              onUpdateShapeState={boundUpdateShapeState}
            />
          );
        })}
        {dancers.map((dancer, index) => {
          // Create bound functions that inject panelId and dancerId
          const boundUpdateDancerState = (newState) =>
            updateDancerState(panelId, dancer.id, newState);
          const boundUpdateHandPosition = (side, newPos) =>
            updateHandPosition(panelId, dancer.id, side, newPos);
          const boundUpdateHandRotation = (side, rotation) =>
            updateHandRotation(panelId, dancer.id, side, rotation);
          const boundHandleDancerSelection = () =>
            handleDancerSelection(panelId, dancer.id);
          const boundHandleHandClick = (handSide) =>
            handleHandClick(panelId, dancer.id, handSide);

          // Drag mode handlers
          const handleDancerDragStart = () => startDragMode();
          const handleDancerDragEnd = (finalState) => {
            endDragMode();
            // Final update with history tracking enabled
            updateDancerState(panelId, dancer.id, finalState);
          };
          const handleDancerTransformStart = () => startDragMode();
          const handleDancerTransformEnd = (finalState) => {
            endDragMode();
            // Final update with history tracking enabled
            updateDancerState(panelId, dancer.id, finalState);
          };

          // Check if this dancer is selected
          const isSelected =
            selectedDancer &&
            selectedDancer.panelId === panelId &&
            selectedDancer.dancerId === dancer.id;

          // Check if any hand of this dancer is selected
          const selectedHandSide =
            selectedHand &&
            selectedHand.panelId === panelId &&
            selectedHand.dancerId === dancer.id
              ? selectedHand.handSide
              : null;

          // Get flash state for this dancer's hands
          const dancerHandFlash = handFlash.filter(
            (h) => h.panelId === panelId && h.dancerId === dancer.id,
          );

          return (
            <Dancer
              key={dancer.id}
              dancer={dancer}
              chosenHead={headShapes[index]}
              chosenHandShapes={handShapes[index]}
              isSelected={isSelected}
              selectedHandSide={selectedHandSide}
              handFlash={dancerHandFlash}
              disabled={opacity.dancers.disabled}
              opacity={opacity.dancers.value}
              onDancerSelect={boundHandleDancerSelection}
              onHandClick={boundHandleHandClick}
              onUpdateDancerState={boundUpdateDancerState}
              onUpdateHandPosition={boundUpdateHandPosition}
              onUpdateHandRotation={boundUpdateHandRotation}
              onDragStart={handleDancerDragStart}
              onDragEnd={handleDancerDragEnd}
              onTransformStart={handleDancerTransformStart}
              onTransformEnd={handleDancerTransformEnd}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default Canvas;
