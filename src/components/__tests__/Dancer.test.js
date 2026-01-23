import React from 'react';
import { render } from '@testing-library/react';
import Dancer from '../Dancer';
import { useAppStore } from '../../stores';

test('Dancer renders without errors and uses store data', () => {
  const panel = useAppStore.getState().panels[0];
  const dancer = panel.dancers[0];
  const dancerIndex = panel.dancers.indexOf(dancer);

  // Mock functions
  const mockFunctions = {
    onDancerSelect: jest.fn(),
    onHandClick: jest.fn(),
    onUpdateDancerState: jest.fn(),
    onUpdateHandPosition: jest.fn(),
    onUpdateHandRotation: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  };

  render(
    <Dancer
      dancer={dancer}
      chosenHead={panel.headShapes[dancerIndex]}
      chosenHandShapes={panel.handShapes[dancerIndex]}
      isSelected={false}
      selectedHandSide={null}
      handFlash={[]}
      disabled={false}
      opacity={1}
      {...mockFunctions}
    />,
  );
});

test('Dancer renders all hand shape types including Hip', () => {
  const panel = useAppStore.getState().panels[0];
  const dancer = panel.dancers[0];
  const dancerIndex = panel.dancers.indexOf(dancer);

  const mockFunctions = {
    onDancerSelect: jest.fn(),
    onHandClick: jest.fn(),
    onUpdateDancerState: jest.fn(),
    onUpdateHandPosition: jest.fn(),
    onUpdateHandRotation: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  };

  const handShapeTypes = ['Overhead', 'Shoulder', 'Waist', 'Hip', 'Knee'];

  handShapeTypes.forEach((handShape) => {
    const { unmount } = render(
      <Dancer
        dancer={dancer}
        chosenHead={panel.headShapes[dancerIndex]}
        chosenHandShapes={{ left: handShape, right: handShape }}
        isSelected={false}
        selectedHandSide={null}
        handFlash={[]}
        disabled={false}
        opacity={1}
        {...mockFunctions}
      />,
    );
    unmount();
  });
});
