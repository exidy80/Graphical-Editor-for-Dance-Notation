import React, { useEffect, useMemo, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useAppStore } from '../stores';
import images from './ImageMapping';
import { SHAPE_STYLE } from '../utils/dimensions';
import Symbol from './Symbols';
import { getSymbolPlacementHotspotOffset } from '../utils/symbolPlacement';

const SymbolPlacementGhostOverlay = () => {
  const symbolPlacement = useAppStore((state) => state.symbolPlacement);
  const isArmed =
    symbolPlacement.active && Boolean(symbolPlacement.symbolDraft);
  const shapeDraft = symbolPlacement.symbolDraft;
  const [cursor, setCursor] = useState(null);
  const [isDropAllowed, setIsDropAllowed] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isArmed) {
      setCursor(null);
      setIsDropAllowed(false);
      return;
    }

    const handleMouseMove = (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const target = document.elementFromPoint(x, y);
      const overKonvaStage = Boolean(target?.closest('.konvajs-content'));

      setCursor({ x, y });
      setIsDropAllowed(overKonvaStage);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isArmed]);

  const hotspotOffset = useMemo(() => {
    return getSymbolPlacementHotspotOffset(shapeDraft, imageSize);
  }, [imageSize.height, imageSize.width, shapeDraft]);

  if (!isArmed || !cursor) return null;

  const hasImageGhost = Boolean(
    shapeDraft?.imageKey && images[shapeDraft.imageKey],
  );
  const ghostShape = {
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
  const left = cursor.x - hotspotOffset.x;
  const top = cursor.y - hotspotOffset.y;

  return (
    <div className="symbol-ghost-overlay" aria-hidden="true">
      {hasImageGhost ? (
        <img
          src={images[shapeDraft.imageKey]}
          alt=""
          className="symbol-ghost-image"
          style={{
            left,
            top,
            transform: `scale(${scaleX}, ${scaleY})`,
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
            left: cursor.x - hotspotOffset.x - 48,
            top: cursor.y - hotspotOffset.y - 48,
            opacity: isDropAllowed ? 0.72 : 0.42,
          }}
        >
          <Stage width={96} height={96}>
            <Layer>
              <Symbol
                shape={ghostShape}
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
