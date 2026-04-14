export interface ParsedLink {
  id: string;
  raw: string;
  origin: { lat: number; lng: number; name: string } | null;
  destination: { lat: number; lng: number; name: string } | null;
  error?: string;
}

export interface OrderedStop {
  lat: number;
  lng: number;
  name: string;
  linkIdx: number;
  type: 'P' | 'D';
}
