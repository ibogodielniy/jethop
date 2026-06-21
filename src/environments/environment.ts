import { MAPBOX_TOKEN } from './mapbox-token';

export const environment = {
  production: false,
  // Loaded from the gitignored ./mapbox-token.ts (copy mapbox-token.example.ts).
  mapboxToken: MAPBOX_TOKEN,
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
};
