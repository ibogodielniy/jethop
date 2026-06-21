import { Injectable } from '@angular/core';
import { AIRPORT_BY_CODE } from '../data/airports';
import { ADJACENCY } from '../data/routes';
import { Airport, Leg, RoutePlan } from '../models';
import { haversineKm } from './geo';

const CRUISE_KMH = 850; // average incl. climb/descent
const TAXI_MIN = 25; // fixed overhead per leg
const MIN_LAYOVER_MIN = 60;
const MAX_RESULTS = 12;
const BASE_DEPARTURE_HOUR = 8; // first leg departs 08:00 local-ish (synthetic, UTC-based)

/**
 * Client-side Route Engine (MVP stand-in for the .NET Route Engine).
 *
 * Route Network Layer  -> ADJACENCY graph (possible connections).
 * Schedule Layer       -> synthesized deterministically from distance here,
 *                         so the same query always yields the same times.
 */
@Injectable({ providedIn: 'root' })
export class RouteEngineService {
  /** Discover itineraries from origin to destination with up to `maxLayovers` stops. */
  findRoutes(fromCode: string, toCode: string, maxLayovers = 3): RoutePlan[] {
    const from = AIRPORT_BY_CODE[fromCode];
    const to = AIRPORT_BY_CODE[toCode];
    if (!from || !to || fromCode === toCode) return [];

    const maxDepth = maxLayovers + 1; // number of legs
    const paths: string[][] = [];
    const visited = new Set<string>([fromCode]);

    const dfs = (node: string, path: string[]) => {
      if (paths.length >= 400) return; // safety guard against explosion
      if (node === toCode) {
        if (path.length >= 2) paths.push([...path]);
        return;
      }
      if (path.length - 1 >= maxDepth) return;
      for (const next of ADJACENCY[node] ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        path.push(next);
        dfs(next, path);
        path.pop();
        visited.delete(next);
      }
    };
    dfs(fromCode, [fromCode]);

    const plans = paths.map((p, i) => this.buildPlan(p, i));
    // Rank by total travel time, then fewer layovers.
    plans.sort((a, b) => a.totalMin - b.totalMin || a.layovers - b.layovers);
    return plans.slice(0, MAX_RESULTS);
  }

  private buildPlan(codes: string[], index: number): RoutePlan {
    const airports = codes.map((c) => AIRPORT_BY_CODE[c]);
    const legs: Leg[] = [];

    let cursor = new Date(Date.UTC(2026, 5, 21, BASE_DEPARTURE_HOUR, 0, 0));
    let flightMin = 0;
    let layoverMin = 0;
    let distanceKm = 0;

    for (let i = 0; i < airports.length - 1; i++) {
      const a = airports[i];
      const b = airports[i + 1];
      const dist = haversineKm(a, b);
      const durationMin = Math.round((dist / CRUISE_KMH) * 60) + TAXI_MIN;

      if (i > 0) {
        // Synthetic layover: scales a little with hub size, deterministic.
        const lay = MIN_LAYOVER_MIN + (hash(a.code + b.code) % 6) * 20;
        cursor = new Date(cursor.getTime() + lay * 60000);
        layoverMin += lay;
      }

      const departure = new Date(cursor);
      const arrival = new Date(cursor.getTime() + durationMin * 60000);
      cursor = arrival;

      legs.push({
        from: a,
        to: b,
        airline: airlineFor(a.code, b.code),
        flightNo: flightNoFor(a.code, b.code),
        departure,
        arrival,
        durationMin,
        distanceKm: Math.round(dist),
      });
      flightMin += durationMin;
      distanceKm += dist;
    }

    const totalMin = Math.round(
      (legs[legs.length - 1].arrival.getTime() - legs[0].departure.getTime()) / 60000,
    );

    return {
      id: codes.join('-') + '#' + index,
      legs,
      airports,
      flightMin,
      layoverMin,
      totalMin,
      layovers: airports.length - 2,
      distanceKm: Math.round(distanceKm),
    };
  }
}

const AIRLINES = [
  'Air Canada',
  'Lufthansa',
  'British Airways',
  'Emirates',
  'Singapore Airlines',
  'Qatar Airways',
  'KLM',
  'United',
  'Air France',
  'Turkish Airlines',
];

function airlineFor(a: string, b: string): string {
  return AIRLINES[hash(a + b) % AIRLINES.length];
}

function flightNoFor(a: string, b: string): string {
  const code = airlineFor(a, b)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return `${code}${100 + (hash(b + a) % 899)}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
