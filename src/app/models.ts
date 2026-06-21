export interface Airport {
  code: string; // IATA
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

/** A possible network connection between two airports (route network layer). */
export interface NetworkEdge {
  from: string;
  to: string;
}

/** A concrete leg of an itinerary with synthesized schedule (schedule layer). */
export interface Leg {
  from: Airport;
  to: Airport;
  airline: string;
  flightNo: string;
  departure: Date;
  arrival: Date;
  durationMin: number;
  distanceKm: number;
}

/** A full discovered itinerary made of one or more legs. */
export interface RoutePlan {
  id: string;
  legs: Leg[];
  airports: Airport[]; // ordered origin..destination
  flightMin: number; // sum of leg flight times
  layoverMin: number; // sum of layovers
  totalMin: number; // departure of first -> arrival of last
  layovers: number; // intermediate stops
  distanceKm: number;
}
