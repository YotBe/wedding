import { describe, it, expect } from 'vitest';
import { parseDietary, serializeDietary } from './dietary';

describe('dietary mapping', () => {
  it('treats null/empty as "none"', () => {
    expect(parseDietary(null)).toEqual({ kind: 'none', other: '' });
  });

  it('round-trips known kinds', () => {
    expect(parseDietary('vegetarian')).toEqual({ kind: 'vegetarian', other: '' });
    expect(serializeDietary('vegetarian', '')).toBe('vegetarian');
    expect(serializeDietary('vegan', '')).toBe('vegan');
  });

  it('stores nothing for "none"', () => {
    expect(serializeDietary('none', '')).toBeNull();
  });

  it('maps unknown stored text to "other" with free text', () => {
    expect(parseDietary('no nuts please')).toEqual({ kind: 'other', other: 'no nuts please' });
    expect(serializeDietary('other', '  no nuts please  ')).toBe('no nuts please');
  });

  it('treats an empty "other" as no preference', () => {
    expect(serializeDietary('other', '   ')).toBeNull();
  });
});
