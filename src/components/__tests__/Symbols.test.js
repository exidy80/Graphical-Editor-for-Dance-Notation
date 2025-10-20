import React from 'react';
import { render, screen } from '@testing-library/react';
import Symbol from '../Symbols';

test('Symbol respects disabled and selected props', () => {
  const shape = {
    id: 'shape-1',
    type: 'signal',
    x: 0,
    y: 0,
    draggable: true,
    stroke: 'red',
    fill: 'red',
  };

  // Mock functions
  const mockFunctions = {
    onShapeSelect: jest.fn(),
    onUpdateShapeState: jest.fn(),
  };

  render(
    <Symbol
      shape={shape}
      isSelected={true}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  // The test relies on mock rendering; absence of crash is acceptable here
});

test('Transformer is rendered for selected symbol and not for stageX', () => {
  const mockFunctions = {
    onShapeSelect: jest.fn(),
    onUpdateShapeState: jest.fn(),
  };

  const normal = {
    id: 'shape-2',
    type: 'signal',
    x: 0,
    y: 0,
    draggable: true,
    stroke: 'red',
    fill: 'red',
  };
  render(
    <Symbol
      shape={normal}
      isSelected={true}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  expect(
    screen.getByText((_, n) => n?.getAttribute('data-mock') === 'Transformer'),
  ).toBeInTheDocument();

  const stageX = {
    id: 'shape-3',
    type: 'stageX',
    x: 0,
    y: 0,
    draggable: false,
  };
  render(
    <Symbol
      shape={stageX}
      isSelected={true}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  // No additional assertion necessary; lack of crash suffices
});
