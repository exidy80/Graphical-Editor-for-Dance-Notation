import { useCallback } from 'react';
import { useImage } from 'react-konva-utils';
import { useAppStore } from '../stores';
import images from './ImageMapping';
import {
  getSymbolPlacementHotspotOffset,
  isSymbolPlacementTargetPanel,
} from '../utils/symbolPlacement';
import { UI_DIMENSIONS } from '../utils/dimensions';

/**
 * Encapsulates all symbol-placement concerns:
 * - store subscriptions for placement state/actions
 * - derived flags (isArmed, isPlacementPanelAllowed)
 * - coordinate helpers
 * - stage event handlers for placement mode
 *
 * Returns:
 *   isArmed          — true when a symbol draft is active
 *   handleMouseDown  — stage onMouseDown handler (placement branch only)
 *   handleClick      — stage onClick handler (placement branch only)
 *   handleMouseMove  — stage onMouseMove handler (placement branch only)
 */
const useSymbolPlacement = ({
  panelId,
  magnifyEnabled,
  selectedPanel,
  toLayerCoordinates,
  isInsidePanelBounds,
}) => {
  const symbolPlacement = useAppStore((state) => state.symbolPlacement);
  const updateSymbolPlacementPreview = useAppStore(
    (state) => state.updateSymbolPlacementPreview,
  );
  const commitSymbolPlacement = useAppStore(
    (state) => state.commitSymbolPlacement,
  );
  const cancelSymbolPlacement = useAppStore(
    (state) => state.cancelSymbolPlacement,
  );
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);

  const isArmed =
    symbolPlacement.active && Boolean(symbolPlacement.symbolDraft);

  const isPlacementPanelAllowed = isSymbolPlacementTargetPanel({
    candidatePanelId: panelId,
    magnifyEnabled,
    selectedPanel,
  });

  const [placementImage] = useImage(
    isArmed && symbolPlacement.symbolDraft.imageKey
      ? images[symbolPlacement.symbolDraft.imageKey]
      : null,
  );

  const getPlacementTopLeft = useCallback(
    (cursorPoint) => {
      if (!cursorPoint || !isArmed || !symbolPlacement.symbolDraft) return null;
      const hotspotOffset = getSymbolPlacementHotspotOffset(
        symbolPlacement.symbolDraft,
        {
          width: placementImage?.width,
          height: placementImage?.height,
        },
      );
      return {
        x: cursorPoint.x - hotspotOffset.x,
        y: cursorPoint.y - hotspotOffset.y,
      };
    },
    [symbolPlacement.symbolDraft, placementImage, isArmed],
  );

  // Returns true if the event was handled (so caller can skip other logic)
  const handleMouseDown = useCallback(
    (e) => {
      if (!isArmed) return false;
      e.evt.preventDefault();
      e.evt.stopPropagation();
      const stage = e.target.getStage();
      if (e.evt.button !== 0 || !stage) return true;
      const pointer = stage.getPointerPosition();
      if (!pointer) return true;

      const cursorPoint = toLayerCoordinates(pointer.x, pointer.y);
      const insidePanel =
        isPlacementPanelAllowed && isInsidePanelBounds(cursorPoint);
      updateSymbolPlacementPreview(
        panelId,
        cursorPoint.x,
        cursorPoint.y,
        insidePanel,
      );

      if (!insidePanel) return true;
      const topLeft = getPlacementTopLeft(cursorPoint);
      if (!topLeft) return true;
      commitSymbolPlacement(panelId, {
        x: topLeft.x,
        y: topLeft.y,
        insidePanel: true,
      });
      return true;
    },
    [
      isArmed,
      isPlacementPanelAllowed,
      panelId,
      toLayerCoordinates,
      isInsidePanelBounds,
      getPlacementTopLeft,
      updateSymbolPlacementPreview,
      commitSymbolPlacement,
    ],
  );

  const handleClick = useCallback(
    (e) => {
      if (!isArmed) return false;
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return true;
    },
    [isArmed],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isArmed) return false;
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return true;
      const cursorPoint = toLayerCoordinates(pointer.x, pointer.y);
      const insidePanel =
        isPlacementPanelAllowed && isInsidePanelBounds(cursorPoint);
      updateSymbolPlacementPreview(
        panelId,
        cursorPoint.x,
        cursorPoint.y,
        insidePanel,
      );
      return true;
    },
    [
      isArmed,
      isPlacementPanelAllowed,
      panelId,
      toLayerCoordinates,
      isInsidePanelBounds,
      updateSymbolPlacementPreview,
    ],
  );

  const handleContextMenu = useCallback(
    (e) => {
      if (!isArmed) return false;
      e.evt.preventDefault();
      e.evt.stopPropagation();
      closeContextMenu();
      cancelSymbolPlacement();
      return true;
    },
    [isArmed, closeContextMenu, cancelSymbolPlacement],
  );

  return {
    isArmed,
    handleMouseDown,
    handleClick,
    handleMouseMove,
    handleContextMenu,
  };
};

export default useSymbolPlacement;
