import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { useAppStore } from '../../stores';

beforeEach(() => {
  const panelId = useAppStore.getState().panels[0]?.id || null;
  act(() => {
    useAppStore.setState({
      selectedPanel: panelId,
      symbolPlacement: {
        active: false,
        panelId: null,
        symbolDraft: null,
        preview: null,
      },
    });
  });
});

test('renders category buttons and expands', () => {
  render(<Sidebar />);
  // Click first icon button (movement)
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[0]);
});

test('renders all elevation options in Signals tab', () => {
  render(<Sidebar />);

  // Find and click the Signals tab button
  const signalsTabButton = screen.getByRole('button', { name: /signals/i });
  fireEvent.click(signalsTabButton);

  // Check all elevation options are present
  expect(screen.getByText('Overhead')).toBeInTheDocument();
  expect(screen.getByText('Shoulder')).toBeInTheDocument();
  expect(screen.getByText('Waist')).toBeInTheDocument();
  expect(screen.getByText('Hip')).toBeInTheDocument();
  expect(screen.getByText('Knee')).toBeInTheDocument();
});

test('renders Link Hands option in Signals Other section', () => {
  render(<Sidebar />);

  // Find and click the Signals tab button
  const signalsTabButton = screen.getByRole('button', { name: /signals/i });
  fireEvent.click(signalsTabButton);

  // Check Link Hands is present in Other section
  expect(screen.getByText('Link Hands')).toBeInTheDocument();
  expect(screen.getByText('Block')).toBeInTheDocument();
  expect(screen.getByText('Split Hands')).toBeInTheDocument();
  expect(screen.getByText('Hash')).toBeInTheDocument();
  expect(screen.getByText('Asterisk')).toBeInTheDocument();
});

test('foot button click arms symbol placement instead of immediate insert', () => {
  const panelId = useAppStore.getState().panels[0].id;
  const initialShapeCount = useAppStore
    .getState()
    .panels.find((p) => p.id === panelId).shapes.length;

  render(<Sidebar />);

  const footworkTabButton = screen.getByRole('button', { name: /footwork/i });
  fireEvent.click(footworkTabButton);

  const footButtons = screen.getAllByRole('button', {
    name: /basic - blue left/i,
  });
  fireEvent.click(footButtons[0]);

  const { symbolPlacement, panels } = useAppStore.getState();
  const currentShapeCount = panels.find((p) => p.id === panelId).shapes.length;

  expect(symbolPlacement.active).toBe(true);
  expect(symbolPlacement.symbolDraft).not.toBeNull();
  expect(currentShapeCount).toBe(initialShapeCount);
});

test('movement button click arms placement instead of immediate insert', () => {
  const panelId = useAppStore.getState().panels[0].id;
  const initialShapeCount = useAppStore
    .getState()
    .panels.find((p) => p.id === panelId).shapes.length;

  render(<Sidebar />);

  const movementTabButton = screen.getByRole('button', { name: /movement/i });
  fireEvent.click(movementTabButton);

  const movementButton = screen.getByTitle('Straight Line Up - Red');
  fireEvent.click(movementButton);

  const { symbolPlacement, panels } = useAppStore.getState();
  const currentShapeCount = panels.find((p) => p.id === panelId).shapes.length;

  expect(symbolPlacement.active).toBe(true);
  expect(symbolPlacement.symbolDraft).not.toBeNull();
  expect(currentShapeCount).toBe(initialShapeCount);
});

test('signals button click arms placement instead of immediate insert', () => {
  const panelId = useAppStore.getState().panels[0].id;
  const initialShapeCount = useAppStore
    .getState()
    .panels.find((p) => p.id === panelId).shapes.length;

  render(<Sidebar />);

  const signalsTabButton = screen.getByRole('button', { name: /signals/i });
  fireEvent.click(signalsTabButton);

  const signalButton = screen.getByTitle('Direction Up - Red');
  fireEvent.click(signalButton);

  const { symbolPlacement, panels } = useAppStore.getState();
  const currentShapeCount = panels.find((p) => p.id === panelId).shapes.length;

  expect(symbolPlacement.active).toBe(true);
  expect(symbolPlacement.symbolDraft).not.toBeNull();
  expect(currentShapeCount).toBe(initialShapeCount);
});
