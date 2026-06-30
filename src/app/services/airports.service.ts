import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Airport } from '../models';

/** Fetches the served-airport lookup (route_airports) from the JetHop REST API. */
@Injectable({ providedIn: 'root' })
export class AirportsService {
  async getAll(): Promise<Airport[]> {
    const res = await fetch(`${environment.apiBase}/api/airports?limit=5000`);
    if (!res.ok) throw new Error(`airports ${res.status}`);
    const data = (await res.json()) as Array<{
      iata: string;
      name: string;
      city?: string;
      country?: string;
      latitude: number;
      longitude: number;
      scope?: string;
      countriesServed?: number;
    }>;
    return data
      .filter((a) => a.iata && a.latitude != null && a.longitude != null)
      .map((a) => ({
        code: a.iata,
        name: a.name ?? a.iata,
        city: a.city ?? '',
        country: a.country ?? '',
        lat: a.latitude,
        lon: a.longitude,
        scope: a.scope ?? 'regional',
        countriesServed: a.countriesServed ?? 0,
      }));
  }
}
