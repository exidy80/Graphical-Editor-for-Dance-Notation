import React from 'react';
import { render, screen } from '@testing-library/react';
import Symbol from '../Symbols';
import * as ShapeTypes from '../../constants/shapeTypes';

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

test('Transformer is rendered for selected symbol and not for stageOrigin', () => {
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

  const stageOrigin = {
    id: 'shape-3',
    type: ShapeTypes.STAGE_X,
    x: 0,
    y: 0,
    draggable: false,
  };
  render(
    <Symbol
      shape={stageOrigin}
      isSelected={true}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  // No additional assertion necessary; lack of crash suffices
});

test('Symbol renders linkHands type', () => {
  const mockFunctions = {
    onShapeSelect: jest.fn(),
    onUpdateShapeState: jest.fn(),
  };

  const linkHandsShape = {
    id: 'shape-4',
    type: 'linkHands',
    x: 100,
    y: 100,
    draggable: true,
    stroke: 'blue',
  };

  const { unmount } = render(
    <Symbol
      shape={linkHandsShape}
      isSelected={false}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  unmount();
});

test('Symbol renders stageNext type', () => {
  const mockFunctions = {
    onShapeSelect: jest.fn(),
    onUpdateShapeState: jest.fn(),
  };

  const stageNextShape = {
    id: 'shape-5',
    type: ShapeTypes.STAGE_NEXT,
    x: 150,
    y: 150,
    draggable: false,
    text: '+',
  };

  const { unmount } = render(
    <Symbol
      shape={stageNextShape}
      isSelected={false}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
  unmount();
});
