import { MAPBOX_TOKEN } from './mapbox-token';

export const environment = {
  production: false,
  // Loaded from the gitignored ./mapbox-token.ts (copy mapbox-token.example.ts).
  mapboxToken: MAPBOX_TOKEN,
  mapStyle: 'mapbox://styles/mapbox/light-v11',
  // JetHop API base (REST at /api/*, GraphQL at /graphql). Dev points at the
  // local container; prod needs the API deployed and this swapped to its URL.
  apiBase: 'http://localhost:5080',
};
