import { describe, it, expect } from 'vitest';
import { computeStats } from './stats';
import type { GuestWithRsvp } from './admin';
import type { Rsvp } from '../types';

function guest(rsvp: Partial<Rsvp> | null): GuestWithRsvp {
  return {
    id: crypto.randomUUID(),
    full_name: 'X',
    phone: null,
    invite_token: 't',
    party_label: null,
    max_party: 4,
    side: null,
    language: 'he',
    created_at: '',
    table_name: null,
    table_id: null,
    seats: null,
    rsvp: rsvp
      ? { id: '', guest_id: '', attending: true, num_adults: 0, num_kids: 0, dietary: null, blessing: null, responded_at: '', ...rsvp }
      : null,
  };
}

describe('computeStats', () => {
  it('counts responses, headcount and dietary', () => {
    const stats = computeStats([
      guest({ attending: true, num_adults: 2, num_kids: 1, dietary: 'vegetarian' }),
      guest({ attending: true, num_adults: 1, num_kids: 0, dietary: null }),
      guest({ attending: false }),
      guest(null),
    ]);

    expect(stats.invites).toBe(4);
    expect(stats.responded).toBe(3);
    expect(stats.noResponse).toBe(1);
    expect(stats.attending).toBe(2);
    expect(stats.declined).toBe(1);
    expect(stats.adults).toBe(3);
    expect(stats.kids).toBe(1);
    expect(stats.headcount).toBe(4);
    expect(stats.dietary.vegetarian).toBe(1);
    expect(stats.dietary.none).toBe(1);
  });

  it('ignores headcount for declined parties', () => {
    const stats = computeStats([guest({ attending: false, num_adults: 5, num_kids: 5 })]);
    expect(stats.headcount).toBe(0);
    expect(stats.declined).toBe(1);
  });
});
