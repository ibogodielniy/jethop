import { Airport } from '../models';

/**
 * Curated subset of major international airports (MVP static dataset).
 * Coordinates are approximate airport reference points.
 */
export const AIRPORTS: Airport[] = [
  // North America
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'Canada', lat: 49.1947, lon: -123.1792 },
  { code: 'YUL', name: 'Montréal-Trudeau', city: 'Montréal', country: 'Canada', lat: 45.4706, lon: -73.7408 },
  { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
  { code: 'ORD', name: "Chicago O'Hare", city: 'Chicago', country: 'United States', lat: 41.9742, lon: -87.9073 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.379 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'United States', lat: 25.7959, lon: -80.287 },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'United States', lat: 33.6407, lon: -84.4277 },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', country: 'United States', lat: 32.8998, lon: -97.0403 },
  { code: 'BOS', name: 'Boston Logan', city: 'Boston', country: 'United States', lat: 42.3656, lon: -71.0096 },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'United States', lat: 47.4502, lon: -122.3088 },
  { code: 'MEX', name: 'Mexico City Intl', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },

  // Europe
  { code: 'KEF', name: 'Keflavík Intl', city: 'Reykjavík', country: 'Iceland', lat: 63.985, lon: -22.6056 },
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom', lat: 51.47, lon: -0.4543 },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'United Kingdom', lat: 51.1537, lon: -0.1821 },
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  { code: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid', city: 'Madrid', country: 'Spain', lat: 40.4983, lon: -3.5676 },
  { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany', lat: 48.3538, lon: 11.7861 },
  { code: 'ZRH', name: 'Zürich', city: 'Zürich', country: 'Switzerland', lat: 47.4647, lon: 8.5492 },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697 },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark', lat: 55.618, lon: 12.6508 },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland', lat: 53.4264, lon: -6.2499 },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Türkiye', lat: 41.2753, lon: 28.7519 },

  // Middle East & Africa
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657 },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.608 },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056 },
  { code: 'JNB', name: 'O. R. Tambo', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lon: 28.246 },
  { code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa', lat: -33.9715, lon: 18.6021 },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lon: 36.9278 },

  // Asia
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', lat: 22.308, lon: 113.9185 },
  { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.772, lon: 140.3929 },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { code: 'ICN', name: 'Seoul Incheon', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
  { code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031 },
  { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083 },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.69, lon: 100.7501 },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1 },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },

  // Oceania & South America
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  { code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia', lat: -37.669, lon: 144.841 },
  { code: 'AKL', name: 'Auckland', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lon: 174.785 },
  { code: 'GRU', name: 'São Paulo Guarulhos', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lon: -46.4731 },
  { code: 'GIG', name: 'Rio de Janeiro Galeão', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8099, lon: -43.2505 },
  { code: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lon: -58.5358 },
];

export const AIRPORT_BY_CODE: Record<string, Airport> = AIRPORTS.reduce(
  (acc, a) => {
    acc[a.code] = a;
    return acc;
  },
  {} as Record<string, Airport>,
);
