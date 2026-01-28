import { fireEvent, screen, act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import React from 'react';
import { render } from '@testing-library/react';
import PositionPanel from '../PositionPanel';

test('PositionPanel renders without crashing', () => {
  render(<PositionPanel />);
});

test('addPanel selects the newly added panel', () => {
  render(<PositionPanel />);
  const addButton = screen.getAllByTitle('Add Panel')[0];
  act(() => {
    fireEvent.click(addButton);
  });
  const panels = useAppStore.getState().panels;
  const selectedPanel = useAppStore.getState().selectedPanel;
  expect(selectedPanel).toBe(panels[panels.length - 1].id);
});

test('clonePanel selects the newly cloned panel', () => {
  render(<PositionPanel />);
  // Add a panel to ensure at least one exists
  const addButton = screen.getAllByTitle('Add Panel')[0];
  act(() => {
    fireEvent.click(addButton);
  });
  // Clone the last panel
  const cloneButtons = screen.getAllByTitle('Clone Panel');
  act(() => {
    fireEvent.click(cloneButtons[cloneButtons.length - 1]);
  });
  const panels = useAppStore.getState().panels;
  const selectedPanel = useAppStore.getState().selectedPanel;
  expect(selectedPanel).toBe(panels[panels.length - 1].id);
});


