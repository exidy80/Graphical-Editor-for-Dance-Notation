import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect as KonvaRect } from 'react-konva';
import Dancer from './Dancer';
import Symbol from './Symbols';
import { useAppStore } from '../stores';
import {
  UI_DIMENSIONS,
  DANCER_DIMENSIONS,
  HAND_DIMENSIONS,
} from '../utils/dimensions';
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
  const setSelectedItems = useAppStore((state) => state.setSelectedItems);
  const setSelectedPanel = useAppStore((state) => state.setSelectedPanel);
  const layerOrder = useAppStore((state) => state.layerOrder);
  const openContextMenu = useAppStore((state) => state.openContextMenu);
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);

  // Marquee (rubber-band) selection state
  const [marquee, setMarquee] = useState(null); // { x1, y1, x2, y2 } in stage coords
  const isMarqueeing = useRef(false);
  const stageRef = useRef(null);
  const handleMarqueeFinish = useRef(() => {});

  // Store stable references - update them during render (allowed for refs)
  const handleCanvasClickRef = useRef(handleCanvasClick);
  const setSelectedPanelRef = useRef(setSelectedPanel);
  const setSelectedItemsRef = useRef(setSelectedItems);

  // Update refs during render (not in useEffect to avoid triggering during render)
  handleCanvasClickRef.current = handleCanvasClick;
  setSelectedPanelRef.current = setSelectedPanel;
  setSelectedItemsRef.current = setSelectedItems;

  const effectivePanelSize = panelViewportSize || panelSize;
  const isMagnified = magnifyEnabled && selectedPanel === panelId;
  const contentScale = isMagnified ? UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE : 1;
  const scaledCanvasWidth = UI_DIMENSIONS.CANVAS_SIZE.width * contentScale;
  const scaledCanvasHeight = UI_DIMENSIONS.CANVAS_SIZE.height * contentScale;
  const baseOffsetX = (effectivePanelSize.width - scaledCanvasWidth) / 2;
  const baseOffsetY = (effectivePanelSize.height - scaledCanvasHeight) / 2;

  // Attach window-level listeners once so the marquee survives the cursor
  // briefly leaving the stage boundary mid-drag
  useEffect(() => {
    const onWindowMouseMove = (e) => {
      if (!isMarqueeing.current || !stageRef.current) return;
      const rect = stageRef.current.container().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMarquee((m) => m && { ...m, x2: x, y2: y });
    };
    const onWindowMouseUp = () => handleMarqueeFinish.current?.();
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, []);

  const panel = panels.find((p) => p.id === panelId);

  // Returns the axis-aligned bounding box (AABB) in layer space for a dancer,
  // accounting for rotation and scale. Uses local points to better match
  // the dancer's origin (shoulders) instead of assuming a centered rectangle.
  const getDancerAABB = useCallback((dancer) => {
    const scaleX = dancer.scaleX || 1;
    const scaleY = dancer.scaleY || 1;
    const r = ((dancer.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);

    const bodyHalfWidth = DANCER_DIMENSIONS.BODY_WIDTH / 2;
    const headBaseY = DANCER_DIMENSIONS.HEAD_SIZE / 4;
    const headTop = headBaseY - DANCER_DIMENSIONS.HEAD_SIZE / 2;
    const bodyBottom = headBaseY + DANCER_DIMENSIONS.BODY_HEIGHT;
    const handPad = Math.max(HAND_DIMENSIONS.WIDTH, HAND_DIMENSIONS.HEIGHT) / 2;
    const elbowPad = 3;

    const points = [
      { x: -bodyHalfWidth, y: headTop },
      { x: bodyHalfWidth, y: headTop },
      { x: -bodyHalfWidth, y: bodyBottom },
      { x: bodyHalfWidth, y: bodyBottom },
    ];

    const leftHand = dancer.leftHandPos || { x: 0, y: 0 };
    const rightHand = dancer.rightHandPos || { x: 0, y: 0 };
    const leftElbow = dancer.leftElbowPos || { x: 0, y: 0 };
    const rightElbow = dancer.rightElbowPos || { x: 0, y: 0 };

    const addPointWithPad = (pt, pad) => {
      points.push(
        { x: pt.x - pad, y: pt.y - pad },
        { x: pt.x + pad, y: pt.y + pad },
      );
    };

    addPointWithPad(leftHand, handPad);
    addPointWithPad(rightHand, handPad);
    addPointWithPad(leftElbow, elbowPad);
    addPointWithPad(rightElbow, elbowPad);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    points.forEach((pt) => {
      const sx = pt.x * scaleX;
      const sy = pt.y * scaleY;
      const rx = sx * cos - sy * sin;
      const ry = sx * sin + sy * cos;
      const worldX = dancer.x + rx;
      const worldY = dancer.y + ry;
      minX = Math.min(minX, worldX);
      maxX = Math.max(maxX, worldX);
      minY = Math.min(minY, worldY);
      maxY = Math.max(maxY, worldY);
    });

    return { minX, maxX, minY, maxY };
  }, []);

  // Returns the AABB in layer space for a shape by querying the actual rendered Konva node.
  // This matches exactly what the Transformer sees.
  const getShapeAABB = useCallback(
    (shape) => {
      if (!stageRef.current) {
        // Stage not ready yet - return minimal bbox at shape position
        return { minX: shape.x, maxX: shape.x, minY: shape.y, maxY: shape.y };
      }

      // Query the actual rendered node from the stage
      const nodes = stageRef.current.find((node) => {
        return node.getAttr && node.getAttr('shapeId') === shape.id;
      });

      if (nodes.length > 0) {
        // Get the client rect (AABB) from the actual rendered node
        const node = nodes[0];
        const clientRect = node.getClientRect();

        // clientRect is in stage coordinates, we need to convert to layer coordinates
        // to match the marquee coordinates which are also converted to layer space
        const layerMinX = (clientRect.x - baseOffsetX) / contentScale;
        const layerMinY = (clientRect.y - baseOffsetY) / contentScale;
        const layerMaxX =
          (clientRect.x + clientRect.width - baseOffsetX) / contentScale;
        const layerMaxY =
          (clientRect.y + clientRect.height - baseOffsetY) / contentScale;

        return {
          minX: layerMinX,
          maxX: layerMaxX,
          minY: layerMinY,
          maxY: layerMaxY,
        };
      }

      // Node not found - return minimal bbox at shape position
      return { minX: shape.x, maxX: shape.x, minY: shape.y, maxY: shape.y };
    },
    [baseOffsetX, baseOffsetY, contentScale],
  );

  // Update the marquee finish logic whenever dependencies change
  useEffect(() => {
    if (!panel) return;

    const { dancers, shapes } = panel;

    handleMarqueeFinish.current = () => {
      if (!isMarqueeing.current) return;
      isMarqueeing.current = false;

      if (!marquee) return;

      const { x1, y1, x2, y2 } = marquee;
      const minSX = Math.min(x1, x2);
      const maxSX = Math.max(x1, x2);
      const minSY = Math.min(y1, y2);
      const maxSY = Math.max(y1, y2);

      // Clear marquee immediately
      setMarquee(null);

      // Defer selection updates to avoid setState-during-render warnings
      setTimeout(() => {
        // Tiny drag → treat as background click (deselect all)
        if (maxSX - minSX < 5 && maxSY - minSY < 5) {
          handleCanvasClickRef.current();
          return;
        }

        // Convert marquee from stage coords to layer coords
        const toLayer = (sx, sy) => ({
          x: (sx - baseOffsetX) / contentScale,
          y: (sy - baseOffsetY) / contentScale,
        });
        const tl = toLayer(minSX, minSY);
        const br = toLayer(maxSX, maxSY);

        const isEnclosed = (bbox) =>
          bbox.minX >= tl.x &&
          bbox.maxX <= br.x &&
          bbox.minY >= tl.y &&
          bbox.maxY <= br.y;

        const newSelected = [];

        // Check visible, enabled dancers
        dancers
          .filter(
            (d) => !isObjectHidden(d, 'dancer') && !opacity.dancers.disabled,
          )
          .forEach((dancer) => {
            if (isEnclosed(getDancerAABB(dancer)))
              newSelected.push({ type: 'dancer', panelId, id: dancer.id });
          });

        // Check shapes: skip hidden, individually-disabled, globally-disabled,
        // and non-interactive stage markers (STAGE_CENTER)
        shapes
          .filter(
            (s) =>
              !isObjectHidden(s, 'shape') &&
              !opacity.disabled.includes(s.id) &&
              !opacity.symbols.disabled &&
              !NON_SELECTABLE_TYPES.has(s.type),
          )
          .forEach((shape) => {
            if (isEnclosed(getShapeAABB(shape)))
              newSelected.push({ type: 'shape', panelId, id: shape.id });
          });

        // Update selection
        if (newSelected.length > 0) {
          setSelectedPanelRef.current(panelId);
          setSelectedItemsRef.current(newSelected);
        } else {
          handleCanvasClickRef.current();
        }
      }, 0);
    };
  }, [
    marquee,
    panel,
    hiddenLayers,
    isObjectHidden,
    opacity,
    panelId,
    baseOffsetX,
    baseOffsetY,
    contentScale,
    getDancerAABB,
    getShapeAABB,
  ]);

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

  const handleStageMouseDown = (e) => {
    if (e.target !== e.target.getStage()) return;
    const pos = e.target.getStage().getPointerPosition();
    isMarqueeing.current = true;
    setMarquee({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
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
      ref={stageRef}
      width={effectivePanelSize.width - 4} //Slightly smaller than container
      height={effectivePanelSize.height - 4}
      onContextMenu={handleContextMenu}
      onMouseDown={handleStageMouseDown}
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
              (d) => !isObjectHidden(d, 'dancer'),
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
