import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { environment } from '../environments/environment';
import { AIRPORTS } from './data/airports';
import { Airport, RoutePlan } from './models';
import { RouteEngineService } from './services/route-engine.service';
import { ConnectionsService, ApiConnection } from './services/connections.service';
import { greatCircle } from './services/geo';

type Field = 'origin' | 'destination';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map!: mapboxgl.Map;
  private mapReady = false;

  // map view: globe (planet) vs flat mercator
  isGlobe = true;

  // search state
  originQuery = '';
  destQuery = '';
  origin: Airport | null = null;
  destination: Airport | null = null;
  maxLayovers = 3;
  suggestions: Airport[] = [];
  activeField: Field | null = null;

  // results state
  routes: RoutePlan[] = [];
  selected: RoutePlan | null = null;
  searched = false;

  // API connections (ranked by reasonability)
  connections: ApiConnection[] = [];
  loading = false;
  error = '';

  constructor(
    private engine: RouteEngineService,
    private connSvc: ConnectionsService,
  ) {}

  // ---- Map lifecycle ----------------------------------------------------
  ngAfterViewInit(): void {
    mapboxgl.accessToken = environment.mapboxToken;
    this.map = new mapboxgl.Map({
      container: this.mapEl.nativeElement,
      style: environment.mapStyle,
      center: [10, 30],
      zoom: 1.6,
      projection: 'globe',
      attributionControl: false,
    });
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    this.map.on('style.load', () => {
      // Light, non-glowing sky: a single light tone for haze, atmosphere and space,
      // with a near-flat horizon so the globe has no luminous atmospheric halo.
      this.map.setFog({
        color: 'rgb(234, 242, 250)',        // lower atmosphere haze at the horizon
        'high-color': 'rgb(234, 242, 250)', // match space -> no glowing rim
        'space-color': 'rgb(234, 242, 250)',// the space/sky behind the globe
        'horizon-blend': 0.02,              // flat horizon, no atmospheric glow
        'star-intensity': 0.0,
      });
      this.addAirportLayers();
      this.addRouteLayers();
      this.mapReady = true;
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  toggleProjection(): void {
    if (!this.map) return;
    this.isGlobe = !this.isGlobe;
    this.map.setProjection(this.isGlobe ? 'globe' : 'mercator');
  }

  private addAirportLayers(): void {
    this.map.addSource('airports', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: AIRPORTS.map((a) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.lon, a.lat] },
          properties: { code: a.code, city: a.city },
        })),
      },
    });
    this.map.addLayer({
      id: 'airport-dots',
      type: 'circle',
      source: 'airports',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 2.2, 6, 5],
        'circle-color': '#1f6fb2',
        'circle-opacity': 0.85,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });
    this.map.addLayer({
      id: 'airport-labels',
      type: 'symbol',
      source: 'airports',
      minzoom: 2.4,
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 11,
        'text-offset': [0, 1.1],
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#1b3a5b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.4,
      },
    });

    this.map.on('mouseenter', 'airport-dots', () => (this.map.getCanvas().style.cursor = 'pointer'));
    this.map.on('mouseleave', 'airport-dots', () => (this.map.getCanvas().style.cursor = ''));
    this.map.on('click', 'airport-dots', (e) => {
      const code = (e.features?.[0]?.properties as { code?: string } | undefined)?.code;
      const airport = AIRPORTS.find((a) => a.code === code);
      if (airport) this.pickFromMap(airport);
    });
  }

  private addRouteLayers(): void {
    this.map.addSource('route', { type: 'geojson', data: emptyFC() });
    this.map.addSource('route-stops', { type: 'geojson', data: emptyFC() });
    this.map.addLayer({
      id: 'route-arc',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#fb8500',
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.8, 6, 3.5],
        // opacity carries reasonability: most reasonable solid, least transparent
        'line-opacity': ['coalesce', ['get', 'opacity'], 0.95],
      },
    });
    this.map.addLayer({
      id: 'route-stop-dots',
      type: 'circle',
      source: 'route-stops',
      paint: {
        'circle-radius': 6,
        'circle-color': '#fb8500',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
        'circle-opacity': ['coalesce', ['get', 'opacity'], 1],
        'circle-stroke-opacity': ['coalesce', ['get', 'opacity'], 1],
      },
    });
    this.map.addLayer({
      id: 'route-stop-labels',
      type: 'symbol',
      source: 'route-stops',
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 13,
        'text-offset': [0, 1.4],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#7a3300',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.6,
      },
    });
  }

  // ---- Search / autocomplete -------------------------------------------
  onSearchInput(field: Field): void {
    this.activeField = field;
    const q = (field === 'origin' ? this.originQuery : this.destQuery).trim().toLowerCase();
    if (!q) {
      this.suggestions = [];
      return;
    }
    this.suggestions = AIRPORTS.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q),
    ).slice(0, 7);
  }

  selectSuggestion(a: Airport): void {
    if (this.activeField === 'origin') {
      this.origin = a;
      this.originQuery = `${a.code} — ${a.city}`;
    } else if (this.activeField === 'destination') {
      this.destination = a;
      this.destQuery = `${a.code} — ${a.city}`;
    }
    this.suggestions = [];
    this.activeField = null;
  }

  private pickFromMap(a: Airport): void {
    if (!this.origin) {
      this.origin = a;
      this.originQuery = `${a.code} — ${a.city}`;
    } else if (!this.destination && a.code !== this.origin.code) {
      this.destination = a;
      this.destQuery = `${a.code} — ${a.city}`;
    } else {
      // restart selection
      this.origin = a;
      this.originQuery = `${a.code} — ${a.city}`;
      this.destination = null;
      this.destQuery = '';
    }
  }

  swap(): void {
    [this.origin, this.destination] = [this.destination, this.origin];
    [this.originQuery, this.destQuery] = [this.destQuery, this.originQuery];
  }

  async search(): Promise<void> {
    if (!this.origin || !this.destination) return;
    this.searched = true;
    this.loading = true;
    this.error = '';
    try {
      this.connections = await this.connSvc.getConnections(
        this.origin.code,
        this.destination.code,
        this.maxLayovers,
        10,
      );
      this.drawConnections();
    } catch (e) {
      this.error = 'Could not reach the connections API.';
      this.connections = [];
      this.clearRoute();
      console.warn('connections fetch failed', e);
    } finally {
      this.loading = false;
    }
  }

  selectRoute(plan: RoutePlan): void {
    this.selected = plan;
    this.drawRoute(plan);
  }

  /** Draw every returned connection, opacity scaled to its reasonability. */
  private drawConnections(): void {
    if (!this.mapReady) return;
    if (!this.connections.length) {
      this.clearRoute();
      return;
    }

    const rs = this.connections.map((c) => c.reasonability);
    const min = Math.min(...rs);
    const max = Math.max(...rs);
    const opacityOf = (r: number) => (max > min ? 0.18 + 0.77 * ((r - min) / (max - min)) : 0.95);

    // Ascending reasonability so the most reasonable (solid) renders on top.
    const sorted = [...this.connections].sort((a, b) => a.reasonability - b.reasonability);

    const lineFeatures: GeoJSON.Feature[] = [];
    const stops = new Map<string, { lon: number; lat: number; op: number }>();

    for (const c of sorted) {
      const op = opacityOf(c.reasonability);
      for (const leg of c.legs) {
        lineFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: greatCircle(
              { lat: leg.fromLat, lon: leg.fromLon },
              { lat: leg.toLat, lon: leg.toLon },
            ),
          },
          properties: { opacity: op },
        });
        for (const p of [
          { code: leg.fromIata, lat: leg.fromLat, lon: leg.fromLon },
          { code: leg.toIata, lat: leg.toLat, lon: leg.toLon },
        ]) {
          const ex = stops.get(p.code);
          if (!ex || op > ex.op) stops.set(p.code, { lon: p.lon, lat: p.lat, op });
        }
      }
    }

    (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: lineFeatures,
    });
    (this.map.getSource('route-stops') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: [...stops.entries()].map(([code, v]) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
        properties: { code, opacity: Math.max(v.op, 0.6) },
      })),
    });

    const bounds = new mapboxgl.LngLatBounds();
    for (const f of lineFeatures)
      for (const co of (f.geometry as GeoJSON.LineString).coordinates)
        bounds.extend(co as [number, number]);
    if (!bounds.isEmpty())
      this.map.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: 430, right: 90 },
        duration: 900,
      });
  }

  connPath(c: ApiConnection): string {
    return [c.legs[0]?.fromIata, ...c.legs.map((l) => l.toIata)].join(' → ');
  }

  // ---- Map drawing ------------------------------------------------------
  private drawRoute(plan: RoutePlan): void {
    if (!this.mapReady) return;
    const lineFeatures = plan.legs.map((leg) => ({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: greatCircle(leg.from, leg.to) },
      properties: {},
    }));
    (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: lineFeatures,
    });
    (this.map.getSource('route-stops') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: plan.airports.map((a) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [a.lon, a.lat] },
        properties: { code: a.code },
      })),
    });

    const bounds = new mapboxgl.LngLatBounds();
    for (const f of lineFeatures) for (const c of f.geometry.coordinates) bounds.extend(c as [number, number]);
    this.map.fitBounds(bounds, { padding: { top: 90, bottom: 90, left: 430, right: 90 }, duration: 900 });
  }

  private clearRoute(): void {
    if (!this.mapReady) return;
    (this.map.getSource('route') as mapboxgl.GeoJSONSource)?.setData(emptyFC());
    (this.map.getSource('route-stops') as mapboxgl.GeoJSONSource)?.setData(emptyFC());
  }

  reset(): void {
    this.origin = this.destination = null;
    this.originQuery = this.destQuery = '';
    this.routes = [];
    this.selected = null;
    this.connections = [];
    this.error = '';
    this.searched = false;
    this.suggestions = [];
    this.clearRoute();
    this.map?.flyTo({ center: [10, 30], zoom: 1.6, duration: 900 });
  }

  // ---- Formatting helpers ----------------------------------------------
  fmtDur(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }

  fmtTime(d: Date): string {
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  }

  routePath(plan: RoutePlan): string {
    return plan.airports.map((a) => a.code).join(' → ');
  }

  trackByRoute = (_: number, r: RoutePlan) => r.id;
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}
