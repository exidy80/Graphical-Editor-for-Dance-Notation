import React from 'react';
import { render, screen } from '@testing-library/react';
import PanelFileHandler from '../PanelFileHandler';

test('renders Open, Save, and Save As buttons', () => {
  render(<PanelFileHandler />);
  expect(screen.getByText(/Open/i)).toBeInTheDocument();
  expect(screen.getByText(/^Save$/i)).toBeInTheDocument();
  expect(screen.getByText(/Save As/i)).toBeInTheDocument();
});
