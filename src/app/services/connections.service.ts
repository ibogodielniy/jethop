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
    const res = await fetch(environment.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { from, to, maxStops, limit } }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return (json.data?.reasonableConnections ?? []) as ApiConnection[];
  }
}
