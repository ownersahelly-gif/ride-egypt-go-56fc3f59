/**
 * Smart Shuttle Routing Logic for Cairo
 * Groups users by destination, snaps pickups to main road corridors,
 * and generates efficient stop sequences following real driving logic.
 */

// ─── Geo helpers ──────────────────────────────────────────
const toRad = (d: number) => d * Math.PI / 180;

export const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Distance from point P to the line segment AB (in km). Returns the nearest point on segment too. */
function pointToSegment(pLat: number, pLng: number, aLat: number, aLng: number, bLat: number, bLng: number) {
  const dx = bLat - aLat, dy = bLng - aLng;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((pLat - aLat) * dx + (pLng - aLng) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearLat = aLat + t * dx;
  const nearLng = aLng + t * dy;
  return { dist: haversine(pLat, pLng, nearLat, nearLng), lat: nearLat, lng: nearLng, t };
}

// ─── Cairo Major Corridors ───────────────────────────────
// Each corridor is an ordered array of waypoints along a major road.
// The routing engine will pick the best corridor for each destination group.

interface Waypoint { lat: number; lng: number; name: string }
interface Corridor { name: string; waypoints: Waypoint[] }

const CAIRO_CORRIDORS: Corridor[] = [
  {
    name: 'Ring Road East (Madinaty → 6 Oct)',
    waypoints: [
      { lat: 30.1070, lng: 31.6370, name: 'Madinaty Gate' },
      { lat: 30.1240, lng: 31.6100, name: 'El Shorouk' },
      { lat: 30.1380, lng: 31.5500, name: 'Obour City' },
      { lat: 30.1250, lng: 31.4400, name: 'Ring Road / Ismailia' },
      { lat: 30.1100, lng: 31.3400, name: 'Ring Road / Autostrad' },
      { lat: 30.0760, lng: 31.2500, name: 'Ring Road / Warraq' },
      { lat: 30.0600, lng: 31.1900, name: 'Ring Road / Mehwar' },
      { lat: 30.0710, lng: 31.0200, name: '26th July Corridor' },
      { lat: 30.0700, lng: 31.0170, name: 'Smart Village' },
    ],
  },
  {
    name: 'Ring Road South (New Cairo → 6 Oct)',
    waypoints: [
      { lat: 30.0300, lng: 31.4700, name: 'New Cairo / AUC' },
      { lat: 30.0100, lng: 31.4100, name: 'Ring Road / Katameya' },
      { lat: 30.0000, lng: 31.3200, name: 'Ring Road / Maadi' },
      { lat: 29.9800, lng: 31.2500, name: 'Ring Road / Giza' },
      { lat: 30.0100, lng: 31.1800, name: 'Ring Road / Faisal' },
      { lat: 30.0600, lng: 31.1900, name: 'Ring Road / Mehwar' },
      { lat: 30.0710, lng: 31.0200, name: '26th July Corridor' },
      { lat: 30.0700, lng: 31.0170, name: 'Smart Village' },
    ],
  },
  {
    name: 'Nasr City → Downtown → Giza',
    waypoints: [
      { lat: 30.0550, lng: 31.3600, name: 'Nasr City' },
      { lat: 30.0450, lng: 31.3200, name: 'Heliopolis' },
      { lat: 30.0500, lng: 31.2600, name: 'Ramses / Downtown' },
      { lat: 30.0400, lng: 31.2100, name: 'Mohandessin' },
      { lat: 30.0250, lng: 31.2000, name: 'Dokki / Giza' },
      { lat: 30.0130, lng: 31.1600, name: 'Haram' },
    ],
  },
  {
    name: 'New Cairo → Nasr City → Downtown',
    waypoints: [
      { lat: 30.0300, lng: 31.4700, name: 'New Cairo / AUC' },
      { lat: 30.0450, lng: 31.4200, name: 'Ring Road / Suez Rd' },
      { lat: 30.0550, lng: 31.3600, name: 'Nasr City' },
      { lat: 30.0500, lng: 31.3100, name: 'Abbasseya' },
      { lat: 30.0500, lng: 31.2600, name: 'Ramses / Downtown' },
    ],
  },
  {
    name: 'Madinaty → Shorouk → New Cairo',
    waypoints: [
      { lat: 30.1070, lng: 31.6370, name: 'Madinaty Gate' },
      { lat: 30.1240, lng: 31.6100, name: 'El Shorouk' },
      { lat: 30.0900, lng: 31.5400, name: 'Badr City' },
      { lat: 30.0500, lng: 31.5000, name: 'Rehab City' },
      { lat: 30.0300, lng: 31.4700, name: 'New Cairo / AUC' },
    ],
  },
  {
    name: '10th of Ramadan → Obour → Ring Road',
    waypoints: [
      { lat: 30.2900, lng: 31.7800, name: '10th of Ramadan' },
      { lat: 30.2200, lng: 31.7100, name: '10th of Ramadan Gate' },
      { lat: 30.1700, lng: 31.6000, name: 'El Shorouk North' },
      { lat: 30.1380, lng: 31.5500, name: 'Obour City' },
      { lat: 30.1250, lng: 31.4400, name: 'Ring Road / Ismailia' },
    ],
  },
  {
    name: '6th October Internal',
    waypoints: [
      { lat: 30.0710, lng: 31.0200, name: '26th July Corridor' },
      { lat: 30.0200, lng: 30.9800, name: '6th October City' },
      { lat: 29.9900, lng: 30.9500, name: 'Sheikh Zayed' },
      { lat: 29.9700, lng: 30.9200, name: 'Beverly Hills / Zayed' },
    ],
  },
];

// ─── Types ─────────────────────────────────────────────
export interface RouteRequest {
  id: string;
  user_id: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  preferred_time?: string | null;
  preferred_days?: number[] | null;
  status: string;
  created_at: string;
}

export interface SmartGroup {
  requests: RouteRequest[];
  originLabel: string;
  destLabel: string;
  corridor: Corridor | null;
}

export interface GeneratedStop {
  lat: number;
  lng: number;
  name: string;
  userCount: number;
  userIds: string[];
}

export interface GeneratedRoute {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  stops: GeneratedStop[];
  totalDistance: number;
  corridor: Corridor | null;
}

// ─── Grouping: destination-first ──────────────────────
const DEST_THRESHOLD_KM = 8; // group destinations within 8km

export function smartGroupRequests(requests: RouteRequest[]): SmartGroup[] {
  // Dedupe: keep latest request per user
  const latestByUser: Record<string, RouteRequest> = {};
  requests.forEach(rr => {
    if (!latestByUser[rr.user_id] || new Date(rr.created_at) > new Date(latestByUser[rr.user_id].created_at)) {
      latestByUser[rr.user_id] = rr;
    }
  });
  const unique = Object.values(latestByUser);

  // Cluster by destination first
  const assigned = new Set<string>();
  const destGroups: RouteRequest[][] = [];

  unique.forEach(rr => {
    if (assigned.has(rr.user_id)) return;
    const group = [rr];
    assigned.add(rr.user_id);
    unique.forEach(other => {
      if (assigned.has(other.user_id)) return;
      if (haversine(rr.destination_lat, rr.destination_lng, other.destination_lat, other.destination_lng) < DEST_THRESHOLD_KM) {
        group.push(other);
        assigned.add(other.user_id);
      }
    });
    destGroups.push(group);
  });

  // For each destination group, find best corridor and build SmartGroup
  const smartGroups: SmartGroup[] = destGroups.map(group => {
    const corridor = findBestCorridor(group);
    // Origin label = most common origin area
    const originCounts: Record<string, number> = {};
    group.forEach(rr => {
      const zone = getZoneName(rr.origin_lat, rr.origin_lng, rr.origin_name);
      originCounts[zone] = (originCounts[zone] || 0) + 1;
    });
    const originLabel = Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || group[0].origin_name;

    const destCounts: Record<string, number> = {};
    group.forEach(rr => {
      const zone = getZoneName(rr.destination_lat, rr.destination_lng, rr.destination_name);
      destCounts[zone] = (destCounts[zone] || 0) + 1;
    });
    const destLabel = Object.entries(destCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || group[0].destination_name;

    return { requests: group, originLabel, destLabel, corridor };
  });

  smartGroups.sort((a, b) => b.requests.length - a.requests.length);
  return smartGroups;
}

// ─── Corridor matching ────────────────────────────────
const MAX_CORRIDOR_DIST_KM = 5; // user must be within 5km of the corridor path

function findBestCorridor(group: RouteRequest[]): Corridor | null {
  let bestCorridor: Corridor | null = null;
  let bestScore = Infinity;

  for (const corridor of CAIRO_CORRIDORS) {
    const wps = corridor.waypoints;
    // Check if corridor endpoints cover the group's origin/dest zone
    const firstWp = wps[0];
    const lastWp = wps[wps.length - 1];

    let totalDist = 0;
    let usersOnCorridor = 0;

    for (const rr of group) {
      const originDist = minDistToCorridor(rr.origin_lat, rr.origin_lng, wps);
      const destDist = minDistToCorridor(rr.destination_lat, rr.destination_lng, wps);
      if (originDist < MAX_CORRIDOR_DIST_KM && destDist < MAX_CORRIDOR_DIST_KM) {
        usersOnCorridor++;
        totalDist += originDist + destDist;
      }
    }

    if (usersOnCorridor === 0) continue;
    // Score: prefer corridors that serve more users with less deviation
    const score = (group.length - usersOnCorridor) * 100 + totalDist / usersOnCorridor;
    if (score < bestScore) {
      bestScore = score;
      bestCorridor = corridor;
    }
  }

  return bestCorridor;
}

function minDistToCorridor(lat: number, lng: number, waypoints: Waypoint[]): number {
  let minDist = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const { dist } = pointToSegment(lat, lng, waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

function snapToCorridor(lat: number, lng: number, waypoints: Waypoint[]): { lat: number; lng: number; segIndex: number; t: number } {
  let best = { lat, lng, segIndex: 0, t: 0, dist: Infinity };
  for (let i = 0; i < waypoints.length - 1; i++) {
    const result = pointToSegment(lat, lng, waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
    if (result.dist < best.dist) {
      best = { lat: result.lat, lng: result.lng, segIndex: i, t: result.t, dist: result.dist };
    }
  }
  return best;
}

// ─── Zone name simplification ─────────────────────────
// Maps coordinates to area names for display (simplified)
const CAIRO_ZONES: { lat: number; lng: number; name: string; radius: number }[] = [
  { lat: 30.1070, lng: 31.6370, name: 'Madinaty', radius: 3 },
  { lat: 30.1240, lng: 31.6100, name: 'El Shorouk', radius: 4 },
  { lat: 30.1380, lng: 31.5500, name: 'Obour City', radius: 3 },
  { lat: 30.0500, lng: 31.5000, name: 'Rehab City', radius: 3 },
  { lat: 30.0300, lng: 31.4700, name: 'New Cairo', radius: 5 },
  { lat: 30.0550, lng: 31.3600, name: 'Nasr City', radius: 3 },
  { lat: 30.0450, lng: 31.3200, name: 'Heliopolis', radius: 3 },
  { lat: 30.0500, lng: 31.2600, name: 'Downtown Cairo', radius: 3 },
  { lat: 30.0400, lng: 31.2100, name: 'Mohandessin', radius: 2 },
  { lat: 30.0250, lng: 31.2000, name: 'Dokki', radius: 2 },
  { lat: 30.0130, lng: 31.1600, name: 'Haram / Faisal', radius: 3 },
  { lat: 30.0700, lng: 31.0170, name: 'Smart Village', radius: 3 },
  { lat: 30.0200, lng: 30.9800, name: '6th October City', radius: 5 },
  { lat: 29.9900, lng: 30.9500, name: 'Sheikh Zayed', radius: 4 },
  { lat: 29.9900, lng: 31.2800, name: 'Maadi', radius: 3 },
  { lat: 30.2900, lng: 31.7800, name: '10th of Ramadan', radius: 5 },
  { lat: 30.0900, lng: 31.5400, name: 'Badr City', radius: 3 },
  { lat: 30.0060, lng: 31.4350, name: 'Katameya', radius: 3 },
  { lat: 30.0760, lng: 31.2850, name: 'Ain Shams', radius: 2 },
  { lat: 30.0600, lng: 31.3000, name: 'Abbasseya', radius: 2 },
];

function getZoneName(lat: number, lng: number, fallback: string): string {
  for (const zone of CAIRO_ZONES) {
    if (haversine(lat, lng, zone.lat, zone.lng) < zone.radius) return zone.name;
  }
  return fallback;
}

// ─── Stop generation ──────────────────────────────────
const STOP_CLUSTER_KM = 1.5; // combine users within 1.5km into one stop

export function generateSmartRoute(group: SmartGroup): GeneratedRoute {
  const { requests, corridor } = group;

  if (!corridor || corridor.waypoints.length < 2) {
    return generateFallbackRoute(group);
  }

  const wps = corridor.waypoints;

  // Snap each user's origin to the corridor
  interface SnappedUser {
    userId: string;
    origLat: number; origLng: number; origName: string;
    snappedLat: number; snappedLng: number;
    corridorProgress: number; // 0..1 along the corridor
  }

  const totalCorridorLen = corridorLength(wps);
  const snappedUsers: SnappedUser[] = [];

  for (const rr of requests) {
    const snap = snapToCorridor(rr.origin_lat, rr.origin_lng, wps);
    const dist = minDistToCorridor(rr.origin_lat, rr.origin_lng, wps);
    // Skip users too far from corridor (>5km), assign them to nearest stop later
    const progress = segmentProgress(snap.segIndex, snap.t, wps, totalCorridorLen);
    snappedUsers.push({
      userId: rr.user_id,
      origLat: rr.origin_lat, origLng: rr.origin_lng, origName: rr.origin_name,
      snappedLat: snap.lat, snappedLng: snap.lng,
      corridorProgress: progress,
    });
  }

  // Sort by progress along corridor
  snappedUsers.sort((a, b) => a.corridorProgress - b.corridorProgress);

  // Cluster snapped points into stops
  const stops: GeneratedStop[] = [];
  const used = new Set<number>();

  for (let i = 0; i < snappedUsers.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const cluster = [snappedUsers[i]];

    for (let j = i + 1; j < snappedUsers.length; j++) {
      if (used.has(j)) continue;
      if (haversine(snappedUsers[i].snappedLat, snappedUsers[i].snappedLng, snappedUsers[j].snappedLat, snappedUsers[j].snappedLng) < STOP_CLUSTER_KM) {
        cluster.push(snappedUsers[j]);
        used.add(j);
      }
    }

    // Stop location = nearest corridor waypoint to cluster center (use main road names)
    const avgLat = cluster.reduce((s, u) => s + u.snappedLat, 0) / cluster.length;
    const avgLng = cluster.reduce((s, u) => s + u.snappedLng, 0) / cluster.length;
    const nearestWp = findNearestWaypoint(avgLat, avgLng, wps);

    // Use zone name or corridor waypoint name
    const stopName = getZoneName(nearestWp.lat, nearestWp.lng, nearestWp.name);

    stops.push({
      lat: nearestWp.lat,
      lng: nearestWp.lng,
      name: stopName,
      userCount: cluster.length,
      userIds: cluster.map(u => u.userId),
    });
  }

  // Dedupe stops that ended up at the same waypoint
  const dedupedStops: GeneratedStop[] = [];
  stops.forEach(s => {
    const existing = dedupedStops.find(ds => haversine(ds.lat, ds.lng, s.lat, s.lng) < 0.3);
    if (existing) {
      existing.userCount += s.userCount;
      existing.userIds.push(...s.userIds);
    } else {
      dedupedStops.push({ ...s });
    }
  });

  // Sort stops by corridor order
  dedupedStops.sort((a, b) => {
    const pa = snapToCorridor(a.lat, a.lng, wps);
    const pb = snapToCorridor(b.lat, b.lng, wps);
    return segmentProgress(pa.segIndex, pa.t, wps, totalCorridorLen) -
           segmentProgress(pb.segIndex, pb.t, wps, totalCorridorLen);
  });

  // Origin = first corridor waypoint near users, Destination = last
  const origin = { lat: wps[0].lat, lng: wps[0].lng, name: getZoneName(wps[0].lat, wps[0].lng, wps[0].name) };
  const dest = { lat: wps[wps.length - 1].lat, lng: wps[wps.length - 1].lng, name: getZoneName(wps[wps.length - 1].lat, wps[wps.length - 1].lng, wps[wps.length - 1].name) };

  // Remove stops that overlap with origin/destination
  const finalStops = dedupedStops.filter(s =>
    haversine(s.lat, s.lng, origin.lat, origin.lng) > 1 &&
    haversine(s.lat, s.lng, dest.lat, dest.lng) > 1
  );

  return {
    origin, destination: dest,
    stops: finalStops,
    totalDistance: corridorLength(wps),
    corridor,
  };
}

// Fallback for groups with no matching corridor
function generateFallbackRoute(group: SmartGroup): GeneratedRoute {
  const reqs = group.requests;
  const avgOrigLat = reqs.reduce((s, r) => s + r.origin_lat, 0) / reqs.length;
  const avgOrigLng = reqs.reduce((s, r) => s + r.origin_lng, 0) / reqs.length;
  const avgDestLat = reqs.reduce((s, r) => s + r.destination_lat, 0) / reqs.length;
  const avgDestLng = reqs.reduce((s, r) => s + r.destination_lng, 0) / reqs.length;

  const origin = {
    lat: avgOrigLat, lng: avgOrigLng,
    name: getZoneName(avgOrigLat, avgOrigLng, reqs[0].origin_name),
  };
  const dest = {
    lat: avgDestLat, lng: avgDestLng,
    name: getZoneName(avgDestLat, avgDestLng, reqs[0].destination_name),
  };

  // Cluster user origins into stops
  const stops: GeneratedStop[] = [];
  const used = new Set<string>();
  reqs.forEach(rr => {
    if (used.has(rr.user_id)) return;
    used.add(rr.user_id);
    const cluster = [rr];
    reqs.forEach(other => {
      if (used.has(other.user_id)) return;
      if (haversine(rr.origin_lat, rr.origin_lng, other.origin_lat, other.origin_lng) < STOP_CLUSTER_KM) {
        cluster.push(other);
        used.add(other.user_id);
      }
    });
    const lat = cluster.reduce((s, r) => s + r.origin_lat, 0) / cluster.length;
    const lng = cluster.reduce((s, r) => s + r.origin_lng, 0) / cluster.length;
    stops.push({
      lat, lng,
      name: getZoneName(lat, lng, cluster[0].origin_name),
      userCount: cluster.length,
      userIds: cluster.map(r => r.user_id),
    });
  });

  stops.sort((a, b) => haversine(origin.lat, origin.lng, a.lat, a.lng) - haversine(origin.lat, origin.lng, b.lat, b.lng));

  return {
    origin, destination: dest,
    stops: stops.filter(s => haversine(s.lat, s.lng, origin.lat, origin.lng) > 1 && haversine(s.lat, s.lng, dest.lat, dest.lng) > 1),
    totalDistance: haversine(origin.lat, origin.lng, dest.lat, dest.lng),
    corridor: null,
  };
}

// ─── Helpers ──────────────────────────────────────────
function corridorLength(wps: Waypoint[]): number {
  let d = 0;
  for (let i = 0; i < wps.length - 1; i++) d += haversine(wps[i].lat, wps[i].lng, wps[i + 1].lat, wps[i + 1].lng);
  return d;
}

function segmentProgress(segIndex: number, t: number, wps: Waypoint[], totalLen: number): number {
  let d = 0;
  for (let i = 0; i < segIndex; i++) d += haversine(wps[i].lat, wps[i].lng, wps[i + 1].lat, wps[i + 1].lng);
  d += t * haversine(wps[segIndex].lat, wps[segIndex].lng, wps[segIndex + 1].lat, wps[segIndex + 1].lng);
  return totalLen > 0 ? d / totalLen : 0;
}

function findNearestWaypoint(lat: number, lng: number, wps: Waypoint[]): Waypoint {
  let best = wps[0];
  let bestDist = haversine(lat, lng, wps[0].lat, wps[0].lng);
  for (let i = 1; i < wps.length; i++) {
    const d = haversine(lat, lng, wps[i].lat, wps[i].lng);
    if (d < bestDist) { best = wps[i]; bestDist = d; }
  }
  return best;
}
