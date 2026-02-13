import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from '../stores';
import { UI_DIMENSIONS } from '../utils/dimensions';
import { LAYER_KEYS, isShapeInCategory } from 'utils/layersConfig';

const Canvas = ({ panelId }) => {
  const panels = useAppStore((state) => state.panels);
  const panelSize = useAppStore((state) => state.panelSize);
  const opacity = useAppStore((state) => state.opacity);
  const selectedDancer = useAppStore((state) => state.selectedDancer);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const handFlash = useAppStore((state) => state.handFlash);
  const symbolFlash = useAppStore((state) => state.symbolFlash);
  const dancerFlash = useAppStore((state) => state.dancerFlash);
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
  const layerOrder = useAppStore((state) => state.layerOrder);

  const panel = panels.find((p) => p.id === panelId);
  if (!panel) return null;

  const { dancers, headShapes, handShapes, shapes } = panel;

  // Calculate viewport offset to center on the canvas
  // At 100% canvas size (300x300 panel), we offset by -150 to show center region
  // At 200% canvas size (600x600 panel), we offset by 0 to show entire canvas (0-600)
  const viewportOffsetX =
    (panelSize.width - UI_DIMENSIONS.CANVAS_SIZE.width) / 2;
  const viewportOffsetY =
    (panelSize.height - UI_DIMENSIONS.CANVAS_SIZE.height) / 2;

  const SHAPE_LAYER_KEYS = LAYER_KEYS.filter((key) => key !== 'body');

  const shapesByCategory = Object.fromEntries(
    SHAPE_LAYER_KEYS.map((key) => [key, []]),
  );

  // bucket shapes by category
  shapes.forEach((shape) => {
    for (const key of SHAPE_LAYER_KEYS) {
      if (isShapeInCategory(shape, key)) {
        shapesByCategory[key].push(shape);
        break; // assume a shape belongs to at most one category
      }
    }
  });

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
      <Layer x={viewportOffsetX} y={viewportOffsetY}>
        {layerOrder.map((layerKey) => {
          if (layerKey === 'body') {
            // Helper to create dancer props
            const getDancerProps = (dancer, index) => {
              const isSelected =
                selectedDancer &&
                selectedDancer.panelId === panelId &&
                selectedDancer.dancerId === dancer.id;

              const selectedHandSide =
                selectedHand &&
                selectedHand.panelId === panelId &&
                selectedHand.dancerId === dancer.id
                  ? selectedHand.handSide
                  : null;

              const dancerHandFlash = handFlash.filter(
                (h) => h.panelId === panelId && h.dancerId === dancer.id,
              );

              const isGlowing = dancerFlash.some(
                (f) => f.panelId === panelId && f.dancerId === dancer.id,
              );

              return {
                dancer,
                chosenHead: headShapes[index],
                chosenHandShapes: handShapes[index],
                isSelected,
                selectedHandSide,
                handFlash: dancerHandFlash,
                disabled: opacity.dancers.disabled,
                opacity: opacity.dancers.value,
                onDancerSelect: () => handleDancerSelection(panelId, dancer.id),
                onHandClick: (handSide) =>
                  handleHandClick(panelId, dancer.id, handSide),
                onUpdateDancerState: (newState) =>
                  updateDancerState(panelId, dancer.id, newState),
                onUpdateHandPosition: (side, newPos) =>
                  updateHandPosition(panelId, dancer.id, side, newPos),
                onUpdateHandRotation: (side, rotation) =>
                  updateHandRotation(panelId, dancer.id, side, rotation),
                onDragStart: startDragMode,
                onDragEnd: endDragMode,
                isGlowing,
              };
            };

            // Render all dancer bodies first, then all arms
            const bodies = dancers.map((dancer, index) => (
              <Dancer
                key={`${dancer.id}-body`}
                {...getDancerProps(dancer, index)}
                renderOnly="body"
              />
            ));

            const arms = dancers.map((dancer, index) => (
              <Dancer
                key={`${dancer.id}-arms`}
                {...getDancerProps(dancer, index)}
                renderOnly="arms"
              />
            ));

            // Add one invisible complete dancer for transformers and interaction
            const interactionLayer = dancers.map((dancer, index) => {
              const props = getDancerProps(dancer, index);
              // Only render transformers for selected dancers
              if (!props.isSelected && !props.selectedHandSide) return null;

              return (
                <Dancer
                  key={`${dancer.id}-interaction`}
                  {...props}
                  renderOnly="all"
                />
              );
            });

            return [...bodies, ...arms, ...interactionLayer];
          }

          const list = shapesByCategory[layerKey];
          return list.map((shape) => {
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

            const isSymbolDisabled =
              opacity.disabled.includes(shape.id) || opacity.symbols.disabled;
            const symbolOpacity = isSymbolDisabled
              ? 0.5
              : opacity.symbols.value;

            // Check if this symbol should glow
            const isGlowing = symbolFlash.some(
              (f) => f.panelId === panelId && f.symbolId === shape.id,
            );
            return (
              <Symbol
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                disabled={isSymbolDisabled}
                opacity={symbolOpacity}
                onShapeSelect={boundHandleShapeSelection}
                onUpdateShapeState={boundUpdateShapeState}
                isGlowing={isGlowing}
              />
            );
          });
        })}
      </Layer>
    </Stage>
  );
};

export default Canvas;
