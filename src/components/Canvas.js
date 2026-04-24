import React, { useRef, useCallback } from 'react';
import { Stage, Layer, Rect as KonvaRect } from 'react-konva';
import DancerCoordination from './DancerCoordination';
import Symbol from './Symbols';
import useMarqueeSelection from './useMarqueeSelection';
import useSymbolPlacement from './useSymbolPlacement';
import { useAppStore } from '../stores';
import { UI_DIMENSIONS } from '../utils/dimensions';
import { LAYER_KEYS, isShapeInCategory } from 'utils/layersConfig';
import { STAGE_CENTER } from '../constants/shapeTypes';

// Shape types that are never user-selectable
const NON_SELECTABLE_TYPES = new Set([STAGE_CENTER]);

const Canvas = ({ panelId, panelViewportSize }) => {
  const panels = useAppStore((state) => state.panels);
  const panelSize = useAppStore((state) => state.panelSize);
  const opacity = useAppStore((state) => state.opacity);
  const hiddenLayers = useAppStore((state) => state.hiddenLayers);
  const selectedItems = useAppStore((state) => state.selectedItems);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const handFlash = useAppStore((state) => state.handFlash);
  const symbolFlash = useAppStore((state) => state.symbolFlash);
  const dancerFlash = useAppStore((state) => state.dancerFlash);
  const handleCanvasClick = useAppStore((state) => state.handleCanvasClick);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const magnifyEnabled = useAppStore((state) => state.magnifyEnabled);

  // Helper to check if an object should be hidden based on its layer
  const isObjectHidden = useCallback(
    (object, objectType) => {
      if (objectType === 'dancer') {
        return hiddenLayers.includes('body');
      }
      // Never hide STAGE_CENTER (green circle) - it's always visible as a reference point
      if (object.type === STAGE_CENTER) {
        return false;
      }
      // For shapes, determine which layer they belong to
      for (const layerKey of hiddenLayers) {
        if (layerKey !== 'body' && isShapeInCategory(object, layerKey)) {
          return true;
        }
      }
      return false;
    },
    [hiddenLayers],
  );

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
  const registerCanvasNode = useAppStore((state) => state.registerCanvasNode);
  const setSelectedItems = useAppStore((state) => state.setSelectedItems);
  const setSelectedPanel = useAppStore((state) => state.setSelectedPanel);
  const layerOrder = useAppStore((state) => state.layerOrder);
  const openContextMenu = useAppStore((state) => state.openContextMenu);
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);

  const stageRef = useRef(null);

  const effectivePanelSize = panelViewportSize || panelSize;
  const drawableViewportSize = {
    width: effectivePanelSize.width,
    height: Math.max(
      0,
      effectivePanelSize.height - UI_DIMENSIONS.PANEL_NOTES_HEIGHT,
    ),
  };
  const isMagnified = magnifyEnabled && selectedPanel === panelId;
  const contentScale = isMagnified ? UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE : 1;
  const scaledCanvasWidth = UI_DIMENSIONS.CANVAS_SIZE.width * contentScale;
  const scaledCanvasHeight = UI_DIMENSIONS.CANVAS_SIZE.height * contentScale;
  const baseOffsetX = (drawableViewportSize.width - scaledCanvasWidth) / 2;
  const baseOffsetY = (drawableViewportSize.height - scaledCanvasHeight) / 2;

  const toLayerCoordinates = useCallback(
    (stageX, stageY) => ({
      x: (stageX - baseOffsetX) / contentScale,
      y: (stageY - baseOffsetY) / contentScale,
    }),
    [baseOffsetX, baseOffsetY, contentScale],
  );

  const isInsidePanelBounds = useCallback((point) => {
    if (!point) return false;
    return (
      point.x >= 0 &&
      point.y >= 0 &&
      point.x <= UI_DIMENSIONS.CANVAS_SIZE.width &&
      point.y <= UI_DIMENSIONS.CANVAS_SIZE.height
    );
  }, []);

  const panel = panels.find((p) => p.id === panelId);

  const placement = useSymbolPlacement({
    panelId,
    magnifyEnabled,
    selectedPanel,
    toLayerCoordinates,
    isInsidePanelBounds,
  });

  const { marquee, onMouseDown: marqueeOnMouseDown } = useMarqueeSelection({
    stageRef,
    panelId,
    panel,
    isObjectHidden,
    opacity,
    nonSelectableTypes: NON_SELECTABLE_TYPES,
    baseOffsetX,
    baseOffsetY,
    contentScale,
    setSelectedPanel,
    setSelectedItems,
    handleCanvasClick,
  });

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

  const getDancerProps = (dancer, index) => {
    const isSelected = selectedItems.some((item) => item.id === dancer.id);

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
      onHandClick: (handSide) => handleHandClick(panelId, dancer.id, handSide),
      onUpdateDancerState: (newState) =>
        movePrimaryAndSelection(panelId, dancer.id, 'dancer', newState),
      onUpdateHandPosition: (side, newPos) =>
        updateHandPosition(panelId, dancer.id, side, newPos),
      onUpdateHandRotation: (side, rotation) =>
        updateHandRotation(panelId, dancer.id, side, rotation),
      onDragStart: startDragMode,
      onDragEnd: endDragMode,
      isGlowing,
      onRegisterNode: (node) =>
        registerCanvasNode(panelId, dancer.id, 'dancer', node),
    };
  };

  const handleStageMouseDown = (e) => {
    if (placement.handleMouseDown(e)) return;
    marqueeOnMouseDown(e);
  };

  const handleStageClick = (e) => {
    placement.handleClick(e);
  };

  const handleStageMouseMove = (e) => {
    placement.handleMouseMove(e);
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
    if (placement.handleContextMenu(e)) return;

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
      ref={stageRef}
      width={drawableViewportSize.width}
      height={drawableViewportSize.height}
      onContextMenu={handleContextMenu}
      onMouseDown={handleStageMouseDown}
      onClick={handleStageClick}
      onMouseMove={handleStageMouseMove}
    >
      <Layer
        x={baseOffsetX}
        y={baseOffsetY}
        scaleX={contentScale}
        scaleY={contentScale}
      >
        {layerOrder.map((layerKey) => {
          if (layerKey === 'body') {
            return (
              <DancerCoordination
                key="dancer-coordination"
                dancers={dancers}
                getDancerProps={getDancerProps}
                isObjectHidden={isObjectHidden}
              />
            );
          }

          const list = shapesByCategory[layerKey];
          return list
            .filter((shape) => !isObjectHidden(shape, 'shape'))
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
                  onDragEnd={endDragMode}
                  isGlowing={isGlowing}
                  onRegisterNode={(node) =>
                    registerCanvasNode(panelId, shape.id, 'shape', node)
                  }
                />
              );
            });
        })}
      </Layer>

      {/* Marquee overlay — no transform, drawn in stage coordinates */}
      {marquee && (
        <Layer listening={false}>
          <KonvaRect
            x={Math.min(marquee.x1, marquee.x2)}
            y={Math.min(marquee.y1, marquee.y2)}
            width={Math.abs(marquee.x2 - marquee.x1)}
            height={Math.abs(marquee.y2 - marquee.y1)}
            fill="rgba(100, 160, 255, 0.12)"
            stroke="rgba(80, 140, 255, 0.85)"
            strokeWidth={1}
            dash={[4, 3]}
          />
        </Layer>
      )}
    </Stage>
  );
};

export default Canvas;
