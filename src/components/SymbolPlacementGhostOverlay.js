import React, { useEffect, useMemo, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useAppStore } from '../stores';
import images from './ImageMapping';
import { SHAPE_STYLE, UI_DIMENSIONS } from '../utils/dimensions';
import Symbol from './Symbols';
import {
  getSymbolPlacementHotspotOffset,
  isSymbolPlacementTargetPanel,
} from '../utils/symbolPlacement';

const SymbolPlacementGhostOverlay = () => {
  const symbolPlacement = useAppStore((state) => state.symbolPlacement);
  const magnifyEnabled = useAppStore((state) => state.magnifyEnabled);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const isPlacementActive =
    symbolPlacement.active && Boolean(symbolPlacement.symbolDraft);
  const shapeDraft = symbolPlacement.symbolDraft;
  const [cursor, setCursor] = useState(null);
  const [isDropAllowed, setIsDropAllowed] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const { width: imageWidth, height: imageHeight } = imageSize;

  useEffect(() => {
    const syncPointerState = (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const target = document.elementFromPoint(x, y);
      const overKonvaStage = Boolean(target?.closest('.konvajs-content'));
      const hoveredPanel = target?.closest('.position-panel');
      const hoveredPanelId = hoveredPanel?.dataset.panelId;
      const dropAllowed =
        overKonvaStage &&
        isSymbolPlacementTargetPanel({
          candidatePanelId: hoveredPanelId,
          magnifyEnabled,
          selectedPanel,
        });

      setCursor({ x, y });
      setIsDropAllowed(isPlacementActive ? dropAllowed : false);
    };

    window.addEventListener('mousemove', syncPointerState);
    window.addEventListener('pointerdown', syncPointerState);
    return () => {
      window.removeEventListener('mousemove', syncPointerState);
      window.removeEventListener('pointerdown', syncPointerState);
    };
  }, [isPlacementActive, magnifyEnabled, selectedPanel]);

  const hotspotOffset = useMemo(() => {
    return getSymbolPlacementHotspotOffset(shapeDraft, {
      width: imageWidth,
      height: imageHeight,
    });
  }, [imageHeight, imageWidth, shapeDraft]);

  if (!isPlacementActive || !cursor) return null;

  const hasPlacementImage = Boolean(
    shapeDraft?.imageKey && images[shapeDraft.imageKey],
  );
  const placementScale =
    magnifyEnabled && selectedPanel ? UI_DIMENSIONS.MAGNIFY_CONTENT_SCALE : 1;
  const previewShape = {
    ...shapeDraft,
    x: 48,
    y: 48,
    draggable: false,
  };

  const scaleX =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleX !== undefined ? shapeDraft.scaleX : 1);
  const scaleY =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleY !== undefined ? shapeDraft.scaleY : 1);
  const left = cursor.x - hotspotOffset.x * placementScale;
  const top = cursor.y - hotspotOffset.y * placementScale;

  return (
    <div className="symbol-ghost-overlay" aria-hidden="true">
      {hasPlacementImage ? (
        <img
          src={images[shapeDraft.imageKey]}
          alt=""
          className="symbol-ghost-image"
          style={{
            left,
            top,
            transform: `scale(${scaleX * placementScale}, ${scaleY * placementScale})`,
            opacity: isDropAllowed ? 0.45 : 0.22,
          }}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setImageSize({ width: naturalWidth, height: naturalHeight });
          }}
        />
      ) : (
        <div
          className="symbol-ghost-konva"
          style={{
            left: cursor.x - (hotspotOffset.x + 48) * placementScale,
            top: cursor.y - (hotspotOffset.y + 48) * placementScale,
            transform: `scale(${placementScale})`,
            transformOrigin: 'top left',
            opacity: isDropAllowed ? 0.72 : 0.42,
          }}
        >
          <Stage width={96} height={96}>
            <Layer>
              <Symbol
                shape={previewShape}
                isSelected={false}
                disabled={true}
                opacity={1}
                onShapeSelect={() => {}}
                onUpdateShapeState={() => {}}
                onDragStart={() => {}}
                onDragEnd={() => {}}
                isGlowing={false}
                onRegisterNode={() => {}}
              />
            </Layer>
          </Stage>
        </div>
      )}
      {!isDropAllowed && (
        <div
          className="symbol-ghost-no-drop"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          <span className="symbol-ghost-no-drop-slash" />
        </div>
      )}
    </div>
  );
};

export default SymbolPlacementGhostOverlay;
