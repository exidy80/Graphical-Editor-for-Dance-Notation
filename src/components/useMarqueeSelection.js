import { useState, useRef, useEffect, useCallback } from 'react';
import { getDancerAABB } from './DancerCoordination';

/**
 * Manages rubber-band (marquee) selection on a Konva stage.
 *
 * Returns:
 *   marquee      — current { x1, y1, x2, y2 } rect in stage coords, or null
 *   onMouseDown  — call from the stage's onMouseDown when placement mode is inactive
 */
const useMarqueeSelection = ({
  stageRef,
  panelId,
  panel,
  isObjectHidden,
  opacity,
  nonSelectableTypes,
  baseOffsetX,
  baseOffsetY,
  contentScale,
  setSelectedPanel,
  setSelectedItems,
  handleCanvasClick,
}) => {
  const [marquee, setMarquee] = useState(null);
  const isMarqueeing = useRef(false);
  const handleMarqueeFinish = useRef(() => {});

  // Keep stable refs so the finish handler always sees the latest values
  const handleCanvasClickRef = useRef(handleCanvasClick);
  const setSelectedPanelRef = useRef(setSelectedPanel);
  const setSelectedItemsRef = useRef(setSelectedItems);
  handleCanvasClickRef.current = handleCanvasClick;
  setSelectedPanelRef.current = setSelectedPanel;
  setSelectedItemsRef.current = setSelectedItems;

  // Window-level listeners so the marquee survives the cursor briefly
  // leaving the stage boundary mid-drag
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
  }, [stageRef]);

  // Returns the AABB in layer space for a shape by querying the actual Konva node.
  const getShapeAABB = useCallback(
    (shape) => {
      if (!stageRef.current) {
        return { minX: shape.x, maxX: shape.x, minY: shape.y, maxY: shape.y };
      }
      const nodes = stageRef.current.find(
        (node) => node.getAttr && node.getAttr('shapeId') === shape.id,
      );
      if (nodes.length > 0) {
        const clientRect = nodes[0].getClientRect();
        return {
          minX: (clientRect.x - baseOffsetX) / contentScale,
          minY: (clientRect.y - baseOffsetY) / contentScale,
          maxX: (clientRect.x + clientRect.width - baseOffsetX) / contentScale,
          maxY: (clientRect.y + clientRect.height - baseOffsetY) / contentScale,
        };
      }
      return { minX: shape.x, maxX: shape.x, minY: shape.y, maxY: shape.y };
    },
    [stageRef, baseOffsetX, baseOffsetY, contentScale],
  );

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

      setMarquee(null);

      setTimeout(() => {
        // Tiny drag → treat as background click (deselect all)
        if (maxSX - minSX < 5 && maxSY - minSY < 5) {
          setSelectedPanelRef.current(panelId);
          handleCanvasClickRef.current();
          return;
        }

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

        dancers
          .filter(
            (d) => !isObjectHidden(d, 'dancer') && !opacity.dancers.disabled,
          )
          .forEach((dancer) => {
            if (isEnclosed(getDancerAABB(dancer)))
              newSelected.push({ type: 'dancer', panelId, id: dancer.id });
          });

        shapes
          .filter(
            (s) =>
              !isObjectHidden(s, 'shape') &&
              !opacity.disabled.includes(s.id) &&
              !opacity.symbols.disabled &&
              !nonSelectableTypes.has(s.type),
          )
          .forEach((shape) => {
            if (isEnclosed(getShapeAABB(shape)))
              newSelected.push({ type: 'shape', panelId, id: shape.id });
          });

        if (newSelected.length > 0) {
          setSelectedPanelRef.current(panelId);
          setSelectedItemsRef.current(newSelected);
        } else {
          setSelectedPanelRef.current(panelId);
          handleCanvasClickRef.current();
        }
      }, 0);
    };
  }, [
    marquee,
    panel,
    isObjectHidden,
    opacity,
    nonSelectableTypes,
    panelId,
    baseOffsetX,
    baseOffsetY,
    contentScale,
    getShapeAABB,
  ]);

  const onMouseDown = useCallback((e) => {
    if (e.target !== e.target.getStage()) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    isMarqueeing.current = true;
    setMarquee({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  }, []);

  return { marquee, onMouseDown };
};

export default useMarqueeSelection;
