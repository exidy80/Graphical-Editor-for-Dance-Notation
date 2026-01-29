import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

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
});
