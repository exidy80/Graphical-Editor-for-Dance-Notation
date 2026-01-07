import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from '../Toolbar';

jest.mock('../PanelFileHandler', () => () => (
  <div data-testid="panel-file-handler" />
));

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
