import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ApiConnectionLeg {
  fromIata: string;
  fromCity?: string;
  fromLat: number;
  fromLon: number;
  toIata: string;
  toCity?: string;
  toLat: number;
  toLon: number;
  airline?: string;
  airlineIcao?: string;
  weeklyFreq: number;
  confidence: number;
  status?: string;
}

export interface ApiConnection {
  from: string;
  to: string;
  stops: number;
  totalDistanceKm: number;
  directDistanceKm: number;
  detourRatio: number;
  reasonability: number; // 0..1
  legs: ApiConnectionLeg[];
}

export interface DirectFlight {
  destIata: string;
  destCity?: string;
  destLat: number;
  destLon: number;
  airline?: string;
  weeklyFreq: number;
  confidence: number;
  status?: string;
}

const DIRECT_QUERY = `query Direct($from:String!){
  connections(from:$from){
    dest{ iata city latitude longitude }
    airline{ name }
    weeklyFreq confidence status
  }
}`;

const QUERY = `query Conn($from:String!,$to:String!,$maxStops:Int!,$limit:Int!){
  reasonableConnections(from:$from,to:$to,maxStops:$maxStops,limit:$limit){
    from to stops totalDistanceKm directDistanceKm detourRatio reasonability
    legs{ fromIata fromCity fromLat fromLon toIata toCity toLat toLon
          airline airlineIcao weeklyFreq confidence status }
  }
}`;

/** Fetches ranked, reasonability-scored connections from the JetHop GraphQL API. */
@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  async getConnections(from: string, to: string, maxStops = 2, limit = 10): Promise<ApiConnection[]> {
    const res = await fetch(`${environment.apiBase}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { from, to, maxStops, limit } }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return (json.data?.reasonableConnections ?? []) as ApiConnection[];
  }

  /** All direct flights departing `from`, one entry per destination (busiest kept). */
  async getDirectFlights(from: string): Promise<DirectFlight[]> {
    const res = await fetch(`${environment.apiBase}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: DIRECT_QUERY, variables: { from } }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);

    const rows = (json.data?.connections ?? []) as Array<{
      dest?: { iata: string; city?: string; latitude: number; longitude: number };
      airline?: { name?: string };
      weeklyFreq: number;
      confidence: number;
      status?: string;
    }>;

    const byDest = new Map<string, DirectFlight>();
    for (const r of rows) {
      if (!r.dest?.iata) continue;
      const df: DirectFlight = {
        destIata: r.dest.iata,
        destCity: r.dest.city,
        destLat: r.dest.latitude,
        destLon: r.dest.longitude,
        airline: r.airline?.name,
        weeklyFreq: r.weeklyFreq ?? 0,
        confidence: r.confidence ?? 0,
        status: r.status,
      };
      const ex = byDest.get(df.destIata);
      if (!ex || df.weeklyFreq > ex.weeklyFreq) byDest.set(df.destIata, df);
    }
    return [...byDest.values()].sort((a, b) => b.weeklyFreq - a.weeklyFreq);
  }
}
