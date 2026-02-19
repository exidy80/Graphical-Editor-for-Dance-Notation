import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { useAppStore } from '../stores';

const CanvasSizeControl = () => {
  const increaseCanvasSize = useAppStore((state) => state.increaseCanvasSize);
  const decreaseCanvasSize = useAppStore((state) => state.decreaseCanvasSize);
  const canIncreaseCanvasSize = useAppStore(
    (state) => state.canIncreaseCanvasSize,
  );
  const canDecreaseCanvasSize = useAppStore(
    (state) => state.canDecreaseCanvasSize,
  );
  const globalCanvasSize = useAppStore((state) => state.globalCanvasSize);

  return (
    <ButtonGroup className="canvas-size-control">
      <Button
        onClick={decreaseCanvasSize}
        variant="outline-primary"
        disabled={!canDecreaseCanvasSize()}
        title="Decrease canvas size"
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
          color: 'black',
          borderColor: '#0d6efd',
          cursor: 'default',
          minWidth: '80px',
        }}
      >
        Canvas: {globalCanvasSize.toFixed(1)}
      </Button>
      <Button
        onClick={increaseCanvasSize}
        variant="outline-primary"
        disabled={!canIncreaseCanvasSize()}
        title="Increase canvas size"
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

export default CanvasSizeControl;
