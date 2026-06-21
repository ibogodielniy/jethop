import { NetworkEdge } from '../models';

/**
 * Route network layer: possible connections (treated as bidirectional).
 * This changes infrequently and is used purely for pathfinding/discovery.
 */
const PAIRS: [string, string][] = [
  // North America domestic / regional
  ['YYZ', 'JFK'], ['YYZ', 'ORD'], ['YYZ', 'YVR'], ['YYZ', 'YUL'], ['YYZ', 'LAX'], ['YYZ', 'MIA'], ['YYZ', 'BOS'],
  ['YVR', 'SEA'], ['YVR', 'SFO'], ['YVR', 'LAX'], ['YVR', 'NRT'], ['YVR', 'HKG'],
  ['JFK', 'LAX'], ['JFK', 'ORD'], ['JFK', 'MIA'], ['JFK', 'ATL'], ['JFK', 'BOS'], ['JFK', 'SFO'],
  ['LAX', 'SFO'], ['LAX', 'SEA'], ['LAX', 'DFW'], ['LAX', 'ORD'], ['LAX', 'HND'], ['LAX', 'SYD'], ['LAX', 'MEX'], ['LAX', 'NRT'], ['LAX', 'ICN'],
  ['ORD', 'DFW'], ['ORD', 'ATL'], ['ORD', 'SFO'],
  ['ATL', 'MIA'], ['ATL', 'DFW'], ['MIA', 'GRU'], ['MIA', 'MEX'], ['MIA', 'GIG'], ['MIA', 'EZE'],
  ['DFW', 'MEX'], ['SEA', 'ICN'],

  // Transatlantic
  ['YYZ', 'LHR'], ['YYZ', 'CDG'], ['YYZ', 'KEF'], ['YYZ', 'FRA'],
  ['YUL', 'CDG'], ['YUL', 'LHR'],
  ['JFK', 'LHR'], ['JFK', 'CDG'], ['JFK', 'FRA'], ['JFK', 'AMS'], ['JFK', 'MAD'], ['JFK', 'DUB'],
  ['BOS', 'LHR'], ['BOS', 'KEF'], ['BOS', 'DUB'],
  ['KEF', 'LHR'], ['KEF', 'CPH'], ['KEF', 'FRA'], ['KEF', 'AMS'],
  ['ORD', 'LHR'], ['ORD', 'FRA'],

  // Europe internal
  ['LHR', 'CDG'], ['LHR', 'FRA'], ['LHR', 'AMS'], ['LHR', 'DUB'], ['LHR', 'MAD'], ['LHR', 'FCO'], ['LHR', 'LGW'], ['LHR', 'ZRH'], ['LHR', 'IST'],
  ['CDG', 'FRA'], ['CDG', 'MAD'], ['CDG', 'FCO'], ['CDG', 'BCN'], ['CDG', 'AMS'], ['CDG', 'MUC'], ['CDG', 'IST'],
  ['FRA', 'AMS'], ['FRA', 'MUC'], ['FRA', 'ZRH'], ['FRA', 'VIE'], ['FRA', 'FCO'], ['FRA', 'IST'], ['FRA', 'CPH'],
  ['AMS', 'CPH'], ['AMS', 'MAD'], ['AMS', 'BCN'],
  ['MAD', 'BCN'], ['MAD', 'FCO'],
  ['FCO', 'MUC'], ['FCO', 'VIE'], ['FCO', 'IST'],
  ['MUC', 'VIE'], ['MUC', 'ZRH'],

  // Middle East hubs
  ['IST', 'DXB'], ['IST', 'DOH'], ['IST', 'CAI'], ['IST', 'DEL'],
  ['DXB', 'DOH'], ['DXB', 'DEL'], ['DXB', 'BOM'], ['DXB', 'SIN'], ['DXB', 'BKK'], ['DXB', 'HKG'], ['DXB', 'JNB'], ['DXB', 'NBO'], ['DXB', 'SYD'], ['DXB', 'LHR'], ['DXB', 'FRA'], ['DXB', 'CDG'],
  ['DOH', 'DEL'], ['DOH', 'BKK'], ['DOH', 'SIN'], ['DOH', 'CPT'], ['DOH', 'JNB'],

  // South & East Asia
  ['DEL', 'BOM'], ['DEL', 'BKK'], ['DEL', 'SIN'], ['BOM', 'SIN'],
  ['SIN', 'HKG'], ['SIN', 'BKK'], ['SIN', 'SYD'], ['SIN', 'MEL'], ['SIN', 'NRT'], ['SIN', 'ICN'], ['SIN', 'AKL'], ['SIN', 'HND'],
  ['BKK', 'HKG'], ['BKK', 'NRT'], ['BKK', 'ICN'],
  ['HKG', 'PVG'], ['HKG', 'PEK'], ['HKG', 'NRT'], ['HKG', 'ICN'], ['HKG', 'SYD'],
  ['PEK', 'PVG'], ['PEK', 'ICN'], ['PEK', 'NRT'],
  ['PVG', 'NRT'], ['PVG', 'ICN'], ['PVG', 'HND'],
  ['NRT', 'ICN'], ['NRT', 'SFO'], ['NRT', 'SYD'],
  ['HND', 'ICN'],

  // Oceania
  ['SYD', 'MEL'], ['SYD', 'AKL'], ['MEL', 'AKL'], ['AKL', 'LAX'],

  // South America
  ['GRU', 'EZE'], ['GRU', 'GIG'], ['GRU', 'MAD'], ['GRU', 'LHR'], ['GRU', 'JNB'], ['EZE', 'MAD'],
  ['MEX', 'MAD'],

  // Africa
  ['JNB', 'CPT'], ['JNB', 'NBO'], ['JNB', 'LHR'], ['JNB', 'CAI'], ['CPT', 'JNB'],
  ['NBO', 'CAI'], ['NBO', 'LHR'], ['CAI', 'FRA'], ['CAI', 'LHR'],
];

export const NETWORK_EDGES: NetworkEdge[] = PAIRS.map(([from, to]) => ({ from, to }));

/** Adjacency list (bidirectional) used by the route engine. */
export const ADJACENCY: Record<string, string[]> = (() => {
  const adj: Record<string, Set<string>> = {};
  for (const [a, b] of PAIRS) {
    (adj[a] ??= new Set()).add(b);
    (adj[b] ??= new Set()).add(a);
  }
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(adj)) out[k] = [...adj[k]];
  return out;
})();
