import { describe, it, expect } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('parseCsv', () => {
  it('parses a simple table', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles quoted fields with commas and newlines', () => {
    expect(parseCsv('name,note\n"Cohen, family","line1\nline2"')).toEqual([
      ['name', 'note'],
      ['Cohen, family', 'line1\nline2'],
    ]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([['a'], ['say "hi"']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('toCsv', () => {
  it('serializes and quotes cells that need it', () => {
    const out = toCsv(['name', 'seats'], [['Cohen, family', 2], [null, 1]]);
    // Strip the leading BOM for the assertion.
    expect(out.replace(/^﻿/, '')).toBe('name,seats\n"Cohen, family",2\n,1');
  });
});
