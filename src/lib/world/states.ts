// Abuja Life — Nigeria states for the world map. Safe for client and server.

export type StateStatus = "live" | "next" | "soon";

export interface GameState {
  id: string;
  name: string;
  capital: string;
  row: number;
  col: number;
  status: StateStatus;
  teaser?: string;
}

// Tile map: each state is one square, roughly where it sits in Nigeria.
export const STATES: GameState[] = [
  { id: "sokoto", name: "Sokoto", capital: "Sokoto", row: 0, col: 1, status: "soon" },
  { id: "katsina", name: "Katsina", capital: "Katsina", row: 0, col: 2, status: "soon" },
  { id: "kano", name: "Kano", capital: "Kano", row: 0, col: 3, status: "soon", teaser: "Kurmi Market traders, groundnut pyramids and textile empires." },
  { id: "jigawa", name: "Jigawa", capital: "Dutse", row: 0, col: 4, status: "soon" },
  { id: "yobe", name: "Yobe", capital: "Damaturu", row: 0, col: 5, status: "soon" },
  { id: "borno", name: "Borno", capital: "Maiduguri", row: 0, col: 6, status: "soon" },

  { id: "kebbi", name: "Kebbi", capital: "Birnin Kebbi", row: 1, col: 0, status: "soon" },
  { id: "zamfara", name: "Zamfara", capital: "Gusau", row: 1, col: 1, status: "soon" },
  { id: "kaduna", name: "Kaduna", capital: "Kaduna", row: 1, col: 2, status: "soon" },
  { id: "bauchi", name: "Bauchi", capital: "Bauchi", row: 1, col: 3, status: "soon" },
  { id: "gombe", name: "Gombe", capital: "Gombe", row: 1, col: 4, status: "soon" },
  { id: "adamawa", name: "Adamawa", capital: "Yola", row: 1, col: 6, status: "soon" },

  { id: "niger", name: "Niger", capital: "Minna", row: 2, col: 1, status: "soon" },
  { id: "fct", name: "FCT Abuja", capital: "Abuja", row: 2, col: 2, status: "live", teaser: "Live now: Wuse, Maitama, Garki, Gwarinpa and more." },
  { id: "nasarawa", name: "Nasarawa", capital: "Lafia", row: 2, col: 3, status: "soon" },
  { id: "plateau", name: "Plateau", capital: "Jos", row: 2, col: 4, status: "soon" },
  { id: "taraba", name: "Taraba", capital: "Jalingo", row: 2, col: 5, status: "soon" },

  { id: "kwara", name: "Kwara", capital: "Ilorin", row: 3, col: 0, status: "soon" },
  { id: "kogi", name: "Kogi", capital: "Lokoja", row: 3, col: 2, status: "soon" },
  { id: "benue", name: "Benue", capital: "Makurdi", row: 3, col: 3, status: "soon" },

  { id: "oyo", name: "Oyo", capital: "Ibadan", row: 4, col: 0, status: "soon" },
  { id: "osun", name: "Osun", capital: "Osogbo", row: 4, col: 1, status: "soon" },
  { id: "ekiti", name: "Ekiti", capital: "Ado-Ekiti", row: 4, col: 2, status: "soon" },
  { id: "enugu", name: "Enugu", capital: "Enugu", row: 4, col: 3, status: "soon" },
  { id: "ebonyi", name: "Ebonyi", capital: "Abakaliki", row: 4, col: 4, status: "soon" },

  { id: "ogun", name: "Ogun", capital: "Abeokuta", row: 5, col: 0, status: "soon" },
  { id: "ondo", name: "Ondo", capital: "Akure", row: 5, col: 1, status: "soon" },
  { id: "edo", name: "Edo", capital: "Benin City", row: 5, col: 2, status: "soon" },
  { id: "anambra", name: "Anambra", capital: "Awka", row: 5, col: 3, status: "soon" },
  { id: "cross-river", name: "Cross River", capital: "Calabar", row: 5, col: 4, status: "soon" },

  { id: "lagos", name: "Lagos", capital: "Ikeja", row: 6, col: 0, status: "next", teaser: "Coming next: Lekki, VI, Ikeja, Yaba tech hubs, danfo hustle and Third Mainland traffic." },
  { id: "delta", name: "Delta", capital: "Asaba", row: 6, col: 1, status: "soon" },
  { id: "imo", name: "Imo", capital: "Owerri", row: 6, col: 2, status: "soon" },
  { id: "abia", name: "Abia", capital: "Umuahia", row: 6, col: 3, status: "soon" },
  { id: "akwa-ibom", name: "Akwa Ibom", capital: "Uyo", row: 6, col: 4, status: "soon" },

  { id: "bayelsa", name: "Bayelsa", capital: "Yenagoa", row: 7, col: 1, status: "soon" },
  { id: "rivers", name: "Rivers", capital: "Port Harcourt", row: 7, col: 2, status: "soon", teaser: "Oil & gas careers, Garden City nightlife." },
];

export function getState(id: string) {
  return STATES.find((s) => s.id === id) ?? null;
}
