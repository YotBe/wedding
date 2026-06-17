import type { DietaryKind } from '../types';

// The schema stores `dietary` as a single free-text column. The form works
// with a kind + optional free text; these helpers map between the two.

export const DIETARY_KINDS: DietaryKind[] = ['none', 'vegetarian', 'vegan', 'other'];

const KNOWN: ReadonlySet<string> = new Set(['none', 'vegetarian', 'vegan']);

/** Turn a stored dietary string back into { kind, other } for the form. */
export function parseDietary(stored: string | null): { kind: DietaryKind; other: string } {
  if (!stored) return { kind: 'none', other: '' };
  if (KNOWN.has(stored)) return { kind: stored as DietaryKind, other: '' };
  return { kind: 'other', other: stored };
}

/** Collapse the form's { kind, other } back into a single value to store. */
export function serializeDietary(kind: DietaryKind, other: string): string | null {
  if (kind === 'none') return null;
  if (kind === 'other') return other.trim() || null;
  return kind;
}
