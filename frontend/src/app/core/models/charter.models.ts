export type YachtType = 'plachetnica' | 'katamaran' | 'motorova_jachta' | 'superjachta';
export type CharterType = 'bez_posadky' | 's_kapitanom' | 's_posadkou';
export type YachtBadge = 'dostupna' | 'posledne_terminy' | 'novinka' | 'obsadena';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const YACHT_TYPES: Option<YachtType>[] = [
  { value: 'plachetnica', label: 'Plachetnica' },
  { value: 'katamaran', label: 'Katamarán' },
  { value: 'motorova_jachta', label: 'Motorová jachta' },
  { value: 'superjachta', label: 'Luxusná jachta s posádkou' },
];

export const CHARTER_TYPES: Option<CharterType>[] = [
  { value: 'bez_posadky', label: 'Bez posádky (Bareboat)' },
  { value: 's_kapitanom', label: 'S kapitánom' },
  { value: 's_posadkou', label: 'S kompletnou posádkou' },
];

export const BADGE_LABELS: Record<YachtBadge, string> = {
  dostupna: 'Dostupná',
  posledne_terminy: 'Posledné termíny',
  novinka: 'Novinka vo flotile',
  obsadena: 'Obsadená',
};

export interface DestinationSummary {
  id: number;
  name: string;
  country: string;
  region: string;
  slug: string;
  departureMarina: string;
  bestSeason: string;
}

export interface Destination extends DestinationSummary {
  coverImageUrl: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  isFeatured: boolean;
  displayOrder: number;
  yachtCount: number;
  priceFrom: number | null;
}

export interface YachtSummary {
  id: number;
  name: string;
  modelName: string;
  manufacturer: string;
  slug: string;
  yachtType: YachtType;
  yachtTypeDisplay: string;
  charterType: CharterType;
  charterTypeDisplay: string;
  destination: DestinationSummary;
  homeMarina: string;
  weeklyPriceFrom: number;
  lengthMeters: number;
  buildYear: number;
  cabins: number;
  berths: number;
  badge: YachtBadge;
  badgeDisplay: string;
  coverImageUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface YachtImage {
  id: number;
  imageUrl: string;
  caption: string;
  displayOrder: number;
}

export interface YachtDetail extends Omit<YachtSummary, 'destination'> {
  destination: Destination;
  securityDeposit: number;
  transitLogFee: number;
  beamMeters: number;
  draftMeters: number;
  bathrooms: number;
  enginePower: string;
  equipment: string[];
  description: string;
  images: YachtImage[];
}

export type YachtOrdering = '' | '-created_at' | 'weekly_price_from' | '-weekly_price_from' | '-length_meters';

export const ORDERING_OPTIONS: Option<YachtOrdering>[] = [
  { value: '', label: 'Odporúčané' },
  { value: '-created_at', label: 'Najnovšie vo flotile' },
  { value: 'weekly_price_from', label: 'Cena: od najnižšej' },
  { value: '-weekly_price_from', label: 'Cena: od najvyššej' },
  { value: '-length_meters', label: 'Dĺžka: od najväčšej' },
];

/** Filters understood by `GET /api/yachts/` (all optional). */
export interface YachtFilters {
  destination?: string;
  yachtType?: YachtType[];
  charterType?: CharterType[];
  minPrice?: number;
  maxPrice?: number;
  minCabins?: number;
  minBerths?: number;
  minLength?: number;
  minYear?: number;
  search?: string;
  featured?: boolean;
  ordering?: YachtOrdering;
}

export interface CharterInquiryPayload {
  yacht: string;
  check_in_date: string;
  duration_weeks: number;
  guests_count: number;
  skipper_needed: boolean;
  hostess_needed: boolean;
  client_name: string;
  email: string;
  phone: string;
  message: string;
}

export interface CustomCharterPayload {
  preferred_destination: string;
  preferred_month: string;
  yacht_type: YachtType | '';
  charter_type: CharterType | '';
  guests_count: number;
  estimated_weekly_budget: string;
  special_wishes: string;
  client_name: string;
  phone: string;
  email: string;
}

export interface ContactPayload {
  client_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/** DRF validation error body: field → list of messages. */
export type ApiFieldErrors = Record<string, string[]>;
