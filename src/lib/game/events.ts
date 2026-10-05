// src/lib/game/events.ts

export type EventCategory =
  | 'social'
  | 'sports'
  | 'business'
  | 'career'
  | 'entertainment'
  | 'community'
  | 'competition'
  | 'mystery'
  | 'city';

export interface GameEvent {
  id: string;
  name: string;
  description: string;

  category: EventCategory;

  // Abuja location
  locationId?: string;

  // Event schedule
  startHour: number;
  endHour: number;

  // Player reward
  reward: number;

  // Search/filter information
  tags: string[];

  // Optional event information
  career?: string;
  competition?: string;
  maxPlayers?: number;
  featured?: boolean;
  recurring?: boolean;

  // Allows future event properties without breaking the type
  [key: string]: unknown;
}

export const EVENTS: GameEvent[] = [
  {
    id: 'wuse-market-rush',
    name: 'Wuse Market Rush',
    description:
      'A busy market challenge in Wuse. Complete shopping and delivery tasks before time runs out.',
    category: 'business',
    locationId: 'wuse-market',
    startHour: 9,
    endHour: 18,
    reward: 5000,
    tags: ['business', 'shopping', 'wuse', 'market'],
    featured: true,
    recurring: true,
  },

  {
    id: 'jabi-lake-party',
    name: 'Jabi Lake Party',
    description:
      'Meet other players around Jabi Lake, enjoy music, social activities and compete in mini challenges.',
    category: 'social',
    locationId: 'jabi-lake',
    startHour: 16,
    endHour: 23,
    reward: 3500,
    tags: ['jabi', 'lake', 'party', 'social', 'music'],
    featured: true,
    recurring: true,
  },

  {
    id: 'maitama-car-meet',
    name: 'Maitama Car Meet',
    description:
      'Bring your vehicle to the city car meet and compete for reputation and prizes.',
    category: 'social',
    locationId: 'maitama',
    startHour: 17,
    endHour: 22,
    reward: 10000,
    tags: ['cars', 'vehicles', 'maitama', 'social', 'competition'],
    competition: 'vehicle-showcase',
    featured: true,
    recurring: true,
  },

  {
    id: 'abuja-football-challenge',
    name: 'Abuja Football Challenge',
    description:
      'Join a football competition and represent your area against other players.',
    category: 'sports',
    locationId: 'stadium',
    startHour: 15,
    endHour: 20,
    reward: 7500,
    tags: ['football', 'sports', 'competition', 'stadium'],
    competition: 'football',
    maxPlayers: 22,
    featured: true,
    recurring: true,
  },

  {
    id: 'mystery-delivery',
    name: 'Mystery Delivery',
    description:
      'A surprise delivery mission appears somewhere in Abuja. Find the destination before another player gets there.',
    category: 'mystery',
    locationId: 'abuja-city',
    startHour: 8,
    endHour: 23,
    reward: 12000,
    tags: ['mystery', 'delivery', 'mission', 'secret', 'city'],
    featured: true,
  },

  {
    id: 'business-networking-night',
    name: 'Business Networking Night',
    description:
      'Meet entrepreneurs, business owners and ambitious players while building your reputation.',
    category: 'business',
    locationId: 'wuse-2',
    startHour: 18,
    endHour: 22,
    reward: 5000,
    tags: ['business', 'networking', 'shops', 'entrepreneurs'],
    career: 'business-owner',
    recurring: true,
  },

  {
    id: 'gwarinpa-street-race',
    name: 'Gwarinpa Street Race',
    description:
      'Take part in a high-speed city race and compete for money and reputation.',
    category: 'competition',
    locationId: 'gwarinpa',
    startHour: 20,
    endHour: 23,
    reward: 15000,
    tags: ['race', 'cars', 'gwarinpa', 'competition', 'vehicles'],
    competition: 'street-race',
    maxPlayers: 16,
  },

  {
    id: 'millennium-park-picnic',
    name: 'Millennium Park Picnic',
    description:
      'Relax at Millennium Park, meet players and participate in casual social activities.',
    category: 'community',
    locationId: 'millennium-park',
    startHour: 12,
    endHour: 18,
    reward: 2500,
    tags: ['park', 'picnic', 'social', 'friends', 'millennium'],
    recurring: true,
  },

  {
    id: 'photography-hunt',
    name: 'Abuja Photography Hunt',
    description:
      'Explore Abuja and photograph hidden landmarks before the timer expires.',
    category: 'career',
    locationId: 'abuja-city',
    startHour: 10,
    endHour: 19,
    reward: 6500,
    tags: ['photography', 'career', 'exploration', 'landmarks'],
    career: 'photographer',
  },

  {
    id: 'chef-cookoff',
    name: 'Abuja Chef Cook-Off',
    description:
      'Chefs compete to prepare the best meal and win money, reputation and customers.',
    category: 'competition',
    locationId: 'wuse-2',
    startHour: 17,
    endHour: 21,
    reward: 9000,
    tags: ['chef', 'food', 'cooking', 'competition'],
    career: 'chef',
    competition: 'cook-off',
    maxPlayers: 12,
  },

  {
    id: 'developer-hack-night',
    name: 'Developer Hack Night',
    description:
      'Developers gather for a timed technology challenge and compete for a cash reward.',
    category: 'career',
    locationId: 'central-business-district',
    startHour: 18,
    endHour: 23,
    reward: 10000,
    tags: ['developer', 'technology', 'coding', 'career', 'competition'],
    career: 'developer',
    competition: 'hackathon',
    maxPlayers: 20,
  },

  {
    id: 'jabi-shopping-festival',
    name: 'Jabi Shopping Festival',
    description:
      'Special shops open across Jabi with discounts, challenges and limited-time items.',
    category: 'business',
    locationId: 'jabi',
    startHour: 10,
    endHour: 22,
    reward: 6000,
    tags: ['jabi', 'shopping', 'shops', 'business', 'festival'],
    recurring: true,
  },

  {
    id: 'abuja-comedy-night',
    name: 'Abuja Comedy Night',
    description:
      'Enjoy a comedy night with other players and compete in audience popularity challenges.',
    category: 'entertainment',
    locationId: 'wuse-2',
    startHour: 19,
    endHour: 23,
    reward: 4000,
    tags: ['comedy', 'entertainment', 'nightlife', 'social'],
    recurring: true,
  },

  {
    id: 'city-cleanup',
    name: 'Abuja City Cleanup',
    description:
      'Players work together to clean selected parts of Abuja and earn community reputation.',
    category: 'community',
    locationId: 'abuja-city',
    startHour: 8,
    endHour: 14,
    reward: 3000,
    tags: ['community', 'cleanup', 'city', 'reputation'],
    recurring: true,
  },

  {
    id: 'airport-delivery',
    name: 'Airport Delivery Run',
    description:
      'Collect an important package from the airport and deliver it safely before the deadline.',
    category: 'career',
    locationId: 'abuja-airport',
    startHour: 7,
    endHour: 21,
    reward: 8000,
    tags: ['airport', 'delivery', 'driver', 'mission'],
    career: 'driver',
  },

  {
    id: 'lost-item-hunt',
    name: 'Lost Item Hunt',
    description:
      'A valuable item has disappeared somewhere in Abuja. Search the city and return it for a reward.',
    category: 'mystery',
    locationId: 'abuja-city',
    startHour: 9,
    endHour: 22,
    reward: 10000,
    tags: ['mystery', 'hunt', 'lost-item', 'exploration'],
  },

  {
    id: 'pool-party',
    name: 'Abuja Pool Party',
    description:
      'A limited-time pool party brings players together for music, games and social challenges.',
    category: 'entertainment',
    locationId: 'maitama',
    startHour: 16,
    endHour: 23,
    reward: 4500,
    tags: ['pool', 'party', 'music', 'social', 'nightlife'],
    recurring: true,
  },

  {
    id: 'gaming-tournament',
    name: 'Abuja Gaming Tournament',
    description:
      'Compete against other players in a city-wide gaming tournament for money and reputation.',
    category: 'competition',
    locationId: 'wuse-2',
    startHour: 18,
    endHour: 23,
    reward: 12500,
    tags: ['gaming', 'tournament', 'competition', 'esports'],
    competition: 'gaming',
    maxPlayers: 32,
  },

  {
    id: 'construction-contract',
    name: 'Construction Contract',
    description:
      'A new construction project needs workers. Complete tasks and earn money as part of the development team.',
    category: 'career',
    locationId: 'garki',
    startHour: 8,
    endHour: 18,
    reward: 7000,
    tags: ['construction', 'contractor', 'career', 'building'],
    career: 'contractor',
  },

  {
    id: 'abuja-news-assignment',
    name: 'Abuja News Assignment',
    description:
      'Investigate a developing story around the city and submit your report before the deadline.',
    category: 'career',
    locationId: 'central-business-district',
    startHour: 9,
    endHour: 20,
    reward: 6000,
    tags: ['journalist', 'news', 'career', 'investigation'],
    career: 'journalist',
  },
];

/**
 * Get every event.
 */
export function getAllEvents(): GameEvent[] {
  return EVENTS;
}

/**
 * Get events happening during a particular hour.
 */
export function getEventsForHour(hour: number): GameEvent[] {
  return EVENTS.filter(
    (event) => hour >= event.startHour && hour <= event.endHour
  );
}

/**
 * Get events by category.
 */
export function getEventsByCategory(
  category: EventCategory
): GameEvent[] {
  return EVENTS.filter((event) => event.category === category);
}

/**
 * Get events at a particular Abuja location.
 */
export function getEventsByLocation(locationId: string): GameEvent[] {
  const normalized = locationId.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return EVENTS.filter(
    (event) => event.locationId?.toLowerCase() === normalized
  );
}

/**
 * Get featured events.
 */
export function getFeaturedEvents(): GameEvent[] {
  return EVENTS.filter((event) => event.featured === true);
}

/**
 * Get recurring events.
 */
export function getRecurringEvents(): GameEvent[] {
  return EVENTS.filter((event) => event.recurring === true);
}

/**
 * Get events for a particular career.
 */
export function getEventsByCareer(career: string): GameEvent[] {
  const normalized = career.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return EVENTS.filter(
    (event) => event.career?.toLowerCase() === normalized
  );
}

/**
 * Search events by name, description, category, career,
 * location or tags.
 */
export function searchEvents(query: string): GameEvent[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return EVENTS.filter((event) =>
    [
      event.name,
      event.description,
      event.category,
      event.career ?? '',
      event.competition ?? '',
      event.locationId ?? '',
      ...event.tags,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}