import { parseDietary } from './dietary';
import type { DietaryKind } from '../types';
import type { GuestWithRsvp } from './admin';

export interface RsvpStats {
  invites: number;
  responded: number;
  noResponse: number;
  attending: number; // parties attending
  declined: number;
  adults: number;
  kids: number;
  headcount: number; // adults + kids across attending parties
  dietary: Record<DietaryKind, number>;
}

/** Aggregate RSVP totals + dietary tally from the admin guest list. */
export function computeStats(guests: GuestWithRsvp[]): RsvpStats {
  const stats: RsvpStats = {
    invites: guests.length,
    responded: 0,
    noResponse: 0,
    attending: 0,
    declined: 0,
    adults: 0,
    kids: 0,
    headcount: 0,
    dietary: { none: 0, vegetarian: 0, vegan: 0, other: 0 },
  };

  for (const g of guests) {
    if (!g.rsvp) {
      stats.noResponse++;
      continue;
    }
    stats.responded++;
    if (g.rsvp.attending) {
      stats.attending++;
      stats.adults += g.rsvp.num_adults;
      stats.kids += g.rsvp.num_kids;
      stats.dietary[parseDietary(g.rsvp.dietary).kind]++;
    } else {
      stats.declined++;
    }
  }
  stats.headcount = stats.adults + stats.kids;
  return stats;
}
