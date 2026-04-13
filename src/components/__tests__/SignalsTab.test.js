import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SignalsTab from '../SignalsTab';
import * as ShapeTypes from '../../constants/shapeTypes';

describe('SignalsTab other symbols', () => {
  test('clicking Hash and Asterisk buttons draws correct symbol types', () => {
    const handleShapeDraw = jest.fn();

    render(
      <SignalsTab selectedPanel="panel-1" handleShapeDraw={handleShapeDraw} />,
    );

    // Click one red and one blue variant to validate both button rows are wired.
    fireEvent.click(screen.getByTitle('Hash - Red'));
    fireEvent.click(screen.getByTitle('Asterisk - Blue'));

    expect(handleShapeDraw).toHaveBeenCalledTimes(2);

    const firstShape = handleShapeDraw.mock.calls[0][0];
    const secondShape = handleShapeDraw.mock.calls[1][0];

    expect(firstShape.type).toBe(ShapeTypes.HASH_SIGN);
    expect(firstShape.stroke).toBe('red');
    expect(firstShape.fill).toBe('red');

    expect(secondShape.type).toBe(ShapeTypes.ASTERISK_SIGN);
    expect(secondShape.stroke).toBe('blue');
    expect(secondShape.fill).toBe('blue');
  });
});
