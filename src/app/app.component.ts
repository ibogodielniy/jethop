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

  constructor(private engine: RouteEngineService) {}

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
      this.map.setFog({});
      this.addAirportLayers();
      this.addRouteLayers();
      this.mapReady = true;
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
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
        'circle-color': '#5fb0ff',
        'circle-opacity': 0.7,
        'circle-stroke-color': '#0a1626',
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
        'text-color': '#cfe3ff',
        'text-halo-color': '#08111f',
        'text-halo-width': 1.2,
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
        'line-color': '#ffb454',
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.8, 6, 3.5],
        'line-opacity': 0.95,
      },
    });
    this.map.addLayer({
      id: 'route-stop-dots',
      type: 'circle',
      source: 'route-stops',
      paint: {
        'circle-radius': 6,
        'circle-color': '#fff',
        'circle-stroke-color': '#ffb454',
        'circle-stroke-width': 3,
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
        'text-color': '#ffffff',
        'text-halo-color': '#1a1206',
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

  search(): void {
    if (!this.origin || !this.destination) return;
    this.routes = this.engine.findRoutes(this.origin.code, this.destination.code, this.maxLayovers);
    this.searched = true;
    this.selected = this.routes[0] ?? null;
    if (this.selected) this.drawRoute(this.selected);
    else this.clearRoute();
  }

  selectRoute(plan: RoutePlan): void {
    this.selected = plan;
    this.drawRoute(plan);
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
