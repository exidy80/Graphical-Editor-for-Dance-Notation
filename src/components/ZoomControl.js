import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { useAppStore } from '../stores';

const ZoomControl = () => {
  const zoomIn = useAppStore((state) => state.zoomIn);
  const zoomOut = useAppStore((state) => state.zoomOut);
  const canZoomIn = useAppStore((state) => state.canZoomIn);
  const canZoomOut = useAppStore((state) => state.canZoomOut);
  const globalZoomLevel = useAppStore((state) => state.globalZoomLevel);

  // Format zoom level as percentage
  const zoomPercentage = Math.round(globalZoomLevel * 100);

  return (
    <ButtonGroup className="zoom-control">
      <Button
        onClick={zoomOut}
        variant="outline-primary"
        disabled={!canZoomOut()}
        title="Zoom out"
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        −
      </Button>
      <Button
        variant="outline-secondary"
        disabled
        style={{
          borderRadius: 0,
          cursor: 'default',
          minWidth: '80px',
        }}
      >
        Zoom {zoomPercentage}%
      </Button>
      <Button
        onClick={zoomIn}
        variant="outline-primary"
        disabled={!canZoomIn()}
        title="Zoom in"
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      >
        +
      </Button>
    </ButtonGroup>
  );
};

export default ZoomControl;
