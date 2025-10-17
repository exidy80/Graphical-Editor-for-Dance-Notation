import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

test('renders category buttons and expands', () => {
  render(<Sidebar />);
  // Click first icon button (movement)
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[0]);
});


