import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toolbar from '../Toolbar';
import { useAppStore } from '../../stores';

jest.mock('../PanelFileHandler', () => () => (
  <div data-testid="panel-file-handler" />
));

beforeEach(() => {
  act(() => {
    useAppStore.setState({
      panels: [useAppStore.getState().panels[0]], // Keep only first panel
      selectedPanel: null,
      selectedDancer: null,
      selectedHand: null,
      selectedShapeId: null,
    });
  });
});

test('renders head and hand dropdowns and lock controls', () => {
  render(<Toolbar />);
  expect(screen.getByText('Select Head')).toBeInTheDocument();
  expect(screen.getByText('Select Hand')).toBeInTheDocument();
  expect(screen.getByText('Hold Hands')).toBeInTheDocument();
  expect(screen.getByText('Delete Symbol')).toBeInTheDocument();
});

test('lock mode toggle button toggles variant', () => {
  render(<Toolbar />);
  const lockBtn = screen.getByText('Hold Hands').closest('button');
  expect(lockBtn).toHaveClass('btn-outline-primary');
  fireEvent.click(lockBtn);
  // Variant should flip to primary
  expect(lockBtn).toHaveClass('btn-primary');
});

test('opacity toggles for dancers and symbols', () => {
  render(<Toolbar />);
  const dancerBtn = screen.getByText('Dancers').closest('button');
  const symbolBtn = screen.getByText('Symbols').closest('button');
  expect(dancerBtn).toHaveClass('btn-outline-primary');
  expect(symbolBtn).toHaveClass('btn-outline-primary');
  fireEvent.click(dancerBtn);
  fireEvent.click(symbolBtn);
  expect(dancerBtn).toHaveClass('btn-primary');
  expect(symbolBtn).toHaveClass('btn-primary');
});

test('hand selection dropdown includes all elevation options', () => {
  // Select first panel, dancer, and hand so dropdown is enabled
  act(() => {
    const panel = useAppStore.getState().panels[0];
    useAppStore.getState().setSelectedPanel(panel.id);
    useAppStore.getState().setSelectedDancer(panel.id, panel.dancers[0].id);
    useAppStore
      .getState()
      .setSelectedHand(panel.id, panel.dancers[0].id, 'left');
  });

  render(<Toolbar />);
  const handDropdown = screen.getByText('Select Hand').closest('button');
  fireEvent.click(handDropdown);

  // Check all hand elevation options are present
  expect(screen.getByText('Overhead')).toBeInTheDocument();
  expect(screen.getByText('Shoulder')).toBeInTheDocument();
  expect(screen.getByText('Waist')).toBeInTheDocument();
  expect(screen.getByText('Hip')).toBeInTheDocument();
  expect(screen.getByText('Knee')).toBeInTheDocument();
});
