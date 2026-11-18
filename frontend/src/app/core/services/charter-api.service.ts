import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiFieldErrors,
  CharterInquiryPayload,
  ContactPayload,
  CustomCharterPayload,
  Destination,
  DestinationSummary,
  YachtDetail,
  YachtFilters,
  YachtSummary,
} from '../models/charter.models';

// --- Raw API shapes (snake_case, decimals as strings) -------------------------
interface ApiDestinationSummary {
  id: number;
  name: string;
  country: string;
  region: string;
  slug: string;
  departure_marina: string;
  best_season: string;
}

interface ApiDestination extends ApiDestinationSummary {
  cover_image_url: string;
  short_description: string;
  description: string;
  highlights: string[];
  is_featured: boolean;
  display_order: number;
  yacht_count: number;
  price_from: string | null;
}

interface ApiYachtSummary {
  id: number;
  name: string;
  model_name: string;
  manufacturer: string;
  slug: string;
  yacht_type: YachtSummary['yachtType'];
  yacht_type_display: string;
  charter_type: YachtSummary['charterType'];
  charter_type_display: string;
  destination: ApiDestinationSummary;
  home_marina: string;
  weekly_price_from: string;
  length_meters: string;
  build_year: number;
  cabins: number;
  berths: number;
  badge: YachtSummary['badge'];
  badge_display: string;
  cover_image_url: string;
  is_featured: boolean;
  created_at: string;
}

interface ApiYachtDetail extends Omit<ApiYachtSummary, 'destination'> {
  destination: ApiDestination;
  security_deposit: string;
  transit_log_fee: string;
  beam_meters: string;
  draft_meters: string;
  bathrooms: number;
  engine_power: string;
  equipment: string[];
  description: string;
  images: { id: number; image_url: string; caption: string; display_order: number }[];
}

const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0);

function mapDestinationSummary(d: ApiDestinationSummary): DestinationSummary {
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    region: d.region,
    slug: d.slug,
    departureMarina: d.departure_marina,
    bestSeason: d.best_season,
  };
}

function mapDestination(d: ApiDestination): Destination {
  return {
    ...mapDestinationSummary(d),
    coverImageUrl: d.cover_image_url,
    shortDescription: d.short_description,
    description: d.description,
    highlights: d.highlights ?? [],
    isFeatured: d.is_featured,
    displayOrder: d.display_order,
    yachtCount: d.yacht_count ?? 0,
    priceFrom: d.price_from === null || d.price_from === undefined ? null : toNumber(d.price_from),
  };
}

function mapYachtBase(y: ApiYachtSummary | ApiYachtDetail): Omit<YachtSummary, 'destination'> {
  return {
    id: y.id,
    name: y.name,
    modelName: y.model_name,
    manufacturer: y.manufacturer,
    slug: y.slug,
    yachtType: y.yacht_type,
    yachtTypeDisplay: y.yacht_type_display,
    charterType: y.charter_type,
    charterTypeDisplay: y.charter_type_display,
    homeMarina: y.home_marina,
    weeklyPriceFrom: toNumber(y.weekly_price_from),
    lengthMeters: toNumber(y.length_meters),
    buildYear: y.build_year,
    cabins: y.cabins,
    berths: y.berths,
    badge: y.badge,
    badgeDisplay: y.badge_display,
    coverImageUrl: y.cover_image_url,
    isFeatured: y.is_featured,
    createdAt: y.created_at,
  };
}

function mapYachtSummary(y: ApiYachtSummary): YachtSummary {
  return { ...mapYachtBase(y), destination: mapDestinationSummary(y.destination) };
}

function mapYachtDetail(y: ApiYachtDetail): YachtDetail {
  return {
    ...mapYachtBase(y),
    destination: mapDestination(y.destination),
    securityDeposit: toNumber(y.security_deposit),
    transitLogFee: toNumber(y.transit_log_fee),
    beamMeters: toNumber(y.beam_meters),
    draftMeters: toNumber(y.draft_meters),
    bathrooms: y.bathrooms,
    enginePower: y.engine_power,
    equipment: y.equipment ?? [],
    description: y.description,
    images: (y.images ?? []).map((i) => ({
      id: i.id,
      imageUrl: i.image_url,
      caption: i.caption,
      displayOrder: i.display_order,
    })),
  };
}

function filtersToParams(filters: YachtFilters): HttpParams {
  let params = new HttpParams();
  const set = (key: string, value: string | number | boolean | undefined | null) => {
    if (value !== undefined && value !== null && value !== '' && !Number.isNaN(value)) {
      params = params.set(key, String(value));
    }
  };
  set('destination', filters.destination);
  filters.yachtType?.forEach((t) => (params = params.append('yacht_type', t)));
  filters.charterType?.forEach((t) => (params = params.append('charter_type', t)));
  set('min_price', filters.minPrice);
  set('max_price', filters.maxPrice);
  set('min_cabins', filters.minCabins);
  set('min_berths', filters.minBerths);
  set('min_length', filters.minLength);
  set('min_year', filters.minYear);
  set('search', filters.search?.trim());
  if (filters.featured) set('featured', 'true');
  set('ordering', filters.ordering);
  return params;
}

@Injectable({ providedIn: 'root' })
export class CharterApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  getYachts(filters: YachtFilters = {}): Observable<YachtSummary[]> {
    return this.http
      .get<ApiYachtSummary[]>(`${this.baseUrl}/yachts/`, { params: filtersToParams(filters) })
      .pipe(map((list) => list.map(mapYachtSummary)));
  }

  getYacht(slug: string): Observable<YachtDetail> {
    return this.http
      .get<ApiYachtDetail>(`${this.baseUrl}/yachts/${encodeURIComponent(slug)}/`)
      .pipe(map(mapYachtDetail));
  }

  getDestinations(): Observable<Destination[]> {
    return this.http
      .get<ApiDestination[]>(`${this.baseUrl}/destinations/`)
      .pipe(map((list) => list.map(mapDestination)));
  }

  submitInquiry(payload: CharterInquiryPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/inquiries/`, payload);
  }

  submitCustomCharter(payload: CustomCharterPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/custom-charters/`, payload);
  }

  submitContact(payload: ContactPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/contact/`, payload);
  }
}

/** Normalises an HTTP error into a general message plus per-field messages. */
export function parseApiError(error: unknown): { message: string; fields: ApiFieldErrors } {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        message: 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie a skúste to znova.',
        fields: {},
      };
    }
    if (error.status === 429) {
      return { message: 'Odoslali ste príliš veľa požiadaviek. Skúste to prosím neskôr.', fields: {} };
    }
    if (error.status === 400 && error.error && typeof error.error === 'object') {
      const fields: ApiFieldErrors = {};
      for (const [key, value] of Object.entries(error.error as Record<string, unknown>)) {
        fields[key] = Array.isArray(value) ? value.map(String) : [String(value)];
      }
      const general = fields['non_field_errors']?.join(' ') ?? fields['detail']?.join(' ');
      return { message: general ?? 'Skontrolujte prosím zvýraznené polia formulára.', fields };
    }
  }
  return { message: 'Pri odosielaní nastala neočakávaná chyba. Skúste to prosím znova.', fields: {} };
}
