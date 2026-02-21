import React from 'react';
import { Stage, Layer } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from '../stores';
import { UI_DIMENSIONS } from '../utils/dimensions';
import { LAYER_KEYS, isShapeInCategory } from 'utils/layersConfig';

const Canvas = ({ panelId, panelViewportSize }) => {
  const panels = useAppStore((state) => state.panels);
  const panelSize = useAppStore((state) => state.panelSize);
  const opacity = useAppStore((state) => state.opacity);
  const hideList = useAppStore((state) => state.hideList);
  const selectedItems = useAppStore((state) => state.selectedItems);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const handFlash = useAppStore((state) => state.handFlash);
  const symbolFlash = useAppStore((state) => state.symbolFlash);
  const dancerFlash = useAppStore((state) => state.dancerFlash);
  const handleCanvasClick = useAppStore((state) => state.handleCanvasClick);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const magnifyEnabled = useAppStore((state) => state.magnifyEnabled);
  const handleDancerSelection = useAppStore(
    (state) => state.handleDancerSelection,
  );
  const handleHandClick = useAppStore((state) => state.handleHandClick);
  const updateHandPosition = useAppStore((state) => state.updateHandPosition);
  const updateHandRotation = useAppStore((state) => state.updateHandRotation);
  const startDragMode = useAppStore((state) => state.startDragMode);
  const endDragMode = useAppStore((state) => state.endDragMode);
  const handleShapeSelection = useAppStore(
    (state) => state.handleShapeSelection,
  );
  const movePrimaryAndSelection = useAppStore(
    (state) => state.movePrimaryAndSelection,
  );
  const layerOrder = useAppStore((state) => state.layerOrder);
  const openContextMenu = useAppStore((state) => state.openContextMenu);
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);

  const effectivePanelSize = panelViewportSize || panelSize;
  const isMagnified = magnifyEnabled && selectedPanel === panelId;
  const contentScale = isMagnified ? UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE : 1;
  const scaledCanvasWidth = UI_DIMENSIONS.CANVAS_SIZE.width * contentScale;
  const scaledCanvasHeight = UI_DIMENSIONS.CANVAS_SIZE.height * contentScale;
  const baseOffsetX = (effectivePanelSize.width - scaledCanvasWidth) / 2;
  const baseOffsetY = (effectivePanelSize.height - scaledCanvasHeight) / 2;

  const panel = panels.find((p) => p.id === panelId);
  if (!panel) return null;

  const { dancers, headShapes, handShapes, shapes } = panel;

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

  const findAncestor = (node, predicate) => {
    let current = node;
    while (current && current.getStage && current !== current.getStage()) {
      if (predicate(current)) return current;
      current = current.getParent();
    }
    return null;
  };

  const getHandSideFromNode = (node) => {
    if (!node || !node.name) return null;
    const name = node.name();
    if (name === 'leftHand') return 'left';
    if (name === 'rightHand') return 'right';
    return null;
  };

  const handleContextMenu = (e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    const stage = e.target.getStage();
    if (!stage) {
      closeContextMenu();
      return;
    }

    if (e.target === stage) {
      closeContextMenu();
      return;
    }

    const pointer = stage.getPointerPosition();
    const rect = stage.container().getBoundingClientRect();
    const clientX =
      e.evt && typeof e.evt.clientX === 'number' ? e.evt.clientX : null;
    const clientY =
      e.evt && typeof e.evt.clientY === 'number' ? e.evt.clientY : null;

    if (clientX === null || clientY === null) {
      if (!pointer || !rect) {
        closeContextMenu();
        return;
      }
    }

    const x = clientX !== null ? clientX : rect.left + pointer.x;
    const y = clientY !== null ? clientY : rect.top + pointer.y;

    const handNode = findAncestor(e.target, (node) =>
      Boolean(getHandSideFromNode(node)),
    );

    if (handNode) {
      const handSide = getHandSideFromNode(handNode);
      const dancerNode = findAncestor(
        handNode,
        (node) => node.getAttr && node.getAttr('dancerId'),
      );
      const dancerId = dancerNode ? dancerNode.getAttr('dancerId') : null;

      if (dancerId && handSide) {
        openContextMenu({
          x,
          y,
          target: { kind: 'hand', panelId, dancerId, handSide },
        });
        return;
      }
    }

    const shapeNode = findAncestor(
      e.target,
      (node) =>
        node.getAttr &&
        ((node.getAttr('shapeId') && node.getAttr('shapeType')) ||
          (node.getAttr('id') && node.getAttr('type'))),
    );

    if (shapeNode) {
      const shapeId = shapeNode.getAttr('shapeId') || shapeNode.getAttr('id');
      const shapeType =
        shapeNode.getAttr('shapeType') || shapeNode.getAttr('type');
      const shapeStub = { type: shapeType };

      if (isShapeInCategory(shapeStub, 'signals')) {
        openContextMenu({
          x,
          y,
          target: { kind: 'handSymbol', panelId, shapeId, shapeType },
        });
        return;
      }

      if (isShapeInCategory(shapeStub, 'feet')) {
        openContextMenu({
          x,
          y,
          target: { kind: 'footSymbol', panelId, shapeId, shapeType },
        });
        return;
      }
    }

    closeContextMenu();
  };

  //Konva stage
  return (
    <Stage
      width={effectivePanelSize.width - 4} //Slightly smaller than container
      height={effectivePanelSize.height - 4}
      onMouseDown={handleCanvasClickInternal}
      onContextMenu={handleContextMenu}
    >
      <Layer
        x={baseOffsetX}
        y={baseOffsetY}
        scaleX={contentScale}
        scaleY={contentScale}
      >
        {layerOrder.map((layerKey) => {
          if (layerKey === 'body') {
            // Filter out hidden dancers
            const visibleDancers = dancers.filter(
              (d) => !hideList.includes('body'),
            );

            // Helper to create dancer props
            const getDancerProps = (dancer, index) => {
              const isSelected = selectedItems.some(
                (item) => item.id === dancer.id,
              );

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
                onDancerSelect: (e) =>
                  handleDancerSelection(panelId, dancer.id, !!e?.evt?.shiftKey),
                onHandClick: (handSide) =>
                  handleHandClick(panelId, dancer.id, handSide),
                onUpdateDancerState: (newState) =>
                  movePrimaryAndSelection(
                    panelId,
                    dancer.id,
                    'dancer',
                    newState,
                  ),
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
            const bodies = visibleDancers.map((dancer, index) => (
              <Dancer
                key={`${dancer.id}-body`}
                {...getDancerProps(dancer, index)}
                renderOnly="body"
              />
            ));

            const arms = visibleDancers.map((dancer, index) => (
              <Dancer
                key={`${dancer.id}-arms`}
                {...getDancerProps(dancer, index)}
                renderOnly="arms"
              />
            ));

            // Add one invisible complete dancer for transformers and interaction
            const interactionLayer = visibleDancers.map((dancer, index) => {
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
          return list
            .filter((shape) => !hideList.includes(shape.id))
            .map((shape) => {
              // Create bound functions that inject panelId and shapeId
              const boundUpdateShapeState = (newState) =>
                movePrimaryAndSelection(panelId, shape.id, 'shape', newState);
              const boundHandleShapeSelection = (multiSelect) =>
                handleShapeSelection(panelId, shape.id, multiSelect);

              // Check if this shape is selected
              const isSelected = selectedItems.some(
                (item) => item.id === shape.id,
              );

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
                  onDragStart={startDragMode}
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
