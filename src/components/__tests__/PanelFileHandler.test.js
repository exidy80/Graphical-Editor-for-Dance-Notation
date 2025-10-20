import React from 'react';
import { render, screen } from '@testing-library/react';
import PanelFileHandler from '../PanelFileHandler';

test('renders save and import buttons', () => {
  render(<PanelFileHandler />);
  expect(screen.getByText(/Save Dance/i)).toBeInTheDocument();
  expect(screen.getByText(/Import Dance/i)).toBeInTheDocument();
});
