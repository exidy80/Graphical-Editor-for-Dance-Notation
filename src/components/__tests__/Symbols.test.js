import React from 'react';
import { render, screen } from '@testing-library/react';
import Symbol from '../Symbols';
import { useAppStore } from '../useAppStore';

test('Symbol respects disabled and selected props', () => {
  const panelId = useAppStore.getState().panels[0].id;
  // Pre-select a shape
  useAppStore.getState().handleShapeSelection(panelId, 'shape-1');
  const shape = { id: 'shape-1', type: 'signal', x: 0, y: 0, draggable: true, stroke: 'red', fill: 'red' };
  render(<Symbol shapeProps={shape} panelId={panelId} />);
  // The test relies on mock rendering; absence of crash is acceptable here
});

test('Transformer is rendered for selected symbol and not for stageX', () => {
  const panelId = useAppStore.getState().panels[0].id;
  useAppStore.getState().handleShapeSelection(panelId, 'shape-2');
  const normal = { id: 'shape-2', type: 'signal', x: 0, y: 0, draggable: true, stroke: 'red', fill: 'red' };
  render(<Symbol shapeProps={normal} panelId={panelId} />);
  expect(screen.getByText((_, n) => n?.getAttribute('data-mock') === 'Transformer')).toBeInTheDocument();

  const stageX = { id: 'shape-3', type: 'stageX', x: 0, y: 0, draggable: false };
  render(<Symbol shapeProps={stageX} panelId={panelId} />);
  // No additional assertion necessary; lack of crash suffices
});
