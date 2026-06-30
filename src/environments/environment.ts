import { MAPBOX_TOKEN } from './mapbox-token';

export const environment = {
  production: false,
  // Loaded from the gitignored ./mapbox-token.ts (copy mapbox-token.example.ts).
  mapboxToken: MAPBOX_TOKEN,
  mapStyle: 'mapbox://styles/mapbox/light-v11',
  // JetHop API (REST + GraphQL). Dev points at the local container; prod needs
  // the API deployed and this swapped to its public URL.
  apiUrl: 'http://localhost:5080/graphql',
};
