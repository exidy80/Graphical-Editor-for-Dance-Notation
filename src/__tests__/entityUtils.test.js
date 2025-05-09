import { describe, it, expect } from '@jest/globals';
import { addEntities, removeEntities, cloneEntities } from 'utils/entityUtils';

describe('entityUtils', () => {
  it('addEntities correctly adds entities to byId and allIds', () => {
    const initial = { byId: {}, allIds: [] };
    const newEntities = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const result = addEntities(initial, newEntities);
    expect(result.byId['1'].name).toBe('A');
    expect(result.byId['2'].name).toBe('B');
    expect(result.allIds).toEqual(['1', '2']);
  });

  it('removeEntities removes entities by ID', () => {
    const initial = {
      byId: { 1: { id: '1' }, 2: { id: '2' }, 3: { id: '3' } },
      allIds: ['1', '2', '3'],
    };
    const result = removeEntities(initial, ['2']);
    expect(result.byId['2']).toBeUndefined();
    expect(result.allIds).toEqual(['1', '3']);
  });

  it('cloneEntities creates deep clones with new IDs', () => {
    const source = {
      a: { id: 'a', val: 1 },
      b: { id: 'b', val: 2 },
    };
    const { clones, idMap } = cloneEntities(source, ['a', 'b']);
    expect(clones.length).toBe(2);
    clones.forEach((clone) => {
      expect(clone.id).not.toBe('a');
      expect(clone.id).not.toBe('b');
    });
    expect(Object.keys(idMap)).toEqual(['a', 'b']);
  });
});
