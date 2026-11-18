import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import {
  CHARTER_TYPES,
  CharterType,
  ORDERING_OPTIONS,
  Option,
  YACHT_TYPES,
  YachtFilters,
  YachtOrdering,
  YachtType,
} from '../../core/models/charter.models';
import { CharterApiService } from '../../core/services/charter-api.service';
import { PLURALS, formatEur } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { YachtCardSkeletonComponent } from '../../shared/components/yacht-card-skeleton/yacht-card-skeleton.component';
import { YachtCardComponent } from '../../shared/components/yacht-card/yacht-card.component';
import { PluralPipe } from '../../shared/pipes/format.pipes';

/** Query-parameter keys used in the /flotila URL. */
type FilterKey =
  | 'destination'
  | 'yacht_type'
  | 'charter_type'
  | 'min_price'
  | 'max_price'
  | 'guests'
  | 'min_cabins'
  | 'min_length'
  | 'search'
  | 'ordering';

interface ActiveChip {
  key: FilterKey;
  value?: string;
  label: string;
}

const PRICE_STEPS = [2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000, 100000];
const CABIN_STEPS = [2, 3, 4, 5, 6];
const LENGTH_STEPS = [12, 14, 16, 20, 30, 40];
const GUEST_STEPS = [2, 4, 6, 8, 10, 12];

function toNumberOrUndefined(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function pickAllowed<T extends string>(values: string[], options: Option<T>[]): T[] {
  const allowed = new Set(options.map((o) => o.value));
  return values.filter((v): v is T => allowed.has(v as T));
}

function parseFilters(params: ParamMap): YachtFilters {
  const ordering = params.get('ordering') ?? '';
  return {
    destination: params.get('destination') || undefined,
    yachtType: pickAllowed<YachtType>(params.getAll('yacht_type'), YACHT_TYPES),
    charterType: pickAllowed<CharterType>(params.getAll('charter_type'), CHARTER_TYPES),
    minPrice: toNumberOrUndefined(params.get('min_price')),
    maxPrice: toNumberOrUndefined(params.get('max_price')),
    minBerths: toNumberOrUndefined(params.get('guests')),
    minCabins: toNumberOrUndefined(params.get('min_cabins')),
    minLength: toNumberOrUndefined(params.get('min_length')),
    search: params.get('search') || undefined,
    ordering: ORDERING_OPTIONS.some((o) => o.value === ordering) ? (ordering as YachtOrdering) : '',
  };
}

@Component({
  selector: 'app-fleet',
  imports: [RouterLink, IconComponent, YachtCardComponent, YachtCardSkeletonComponent, PluralPipe],
  templateUrl: './fleet.component.html',
  styleUrl: './fleet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'filtersOpen.set(false)' },
})
export class FleetComponent {
  private readonly api = inject(CharterApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  protected readonly config = SITE_CONFIG;
  protected readonly yachtTypes = YACHT_TYPES;
  protected readonly charterTypes = CHARTER_TYPES;
  protected readonly orderingOptions = ORDERING_OPTIONS;
  protected readonly priceSteps = PRICE_STEPS;
  protected readonly cabinSteps = CABIN_STEPS;
  protected readonly lengthSteps = LENGTH_STEPS;
  protected readonly guestSteps = GUEST_STEPS;
  protected readonly plurals = PLURALS;
  protected readonly formatEur = formatEur;
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Single source of truth: the URL. */
  protected readonly filters = computed(() => parseFilters(this.queryParams()));

  protected readonly yachts = rxResource({
    params: () => this.filters(),
    stream: ({ params }) => this.api.getYachts(params),
  });

  protected readonly destinations = rxResource({ stream: () => this.api.getDestinations() });

  protected readonly results = computed(() => this.yachts.value() ?? []);
  protected readonly filtersOpen = signal(false);
  protected readonly searchTerm = signal(this.route.snapshot.queryParamMap.get('search') ?? '');

  protected readonly activeChips = computed<ActiveChip[]>(() => {
    const f = this.filters();
    const chips: ActiveChip[] = [];
    if (f.destination) {
      const name = this.destinations.value()?.find((d) => d.slug === f.destination)?.name ?? f.destination;
      chips.push({ key: 'destination', label: name });
    }
    f.yachtType?.forEach((t) =>
      chips.push({ key: 'yacht_type', value: t, label: YACHT_TYPES.find((o) => o.value === t)!.label }),
    );
    f.charterType?.forEach((t) =>
      chips.push({ key: 'charter_type', value: t, label: CHARTER_TYPES.find((o) => o.value === t)!.label }),
    );
    if (f.minPrice !== undefined) chips.push({ key: 'min_price', label: `od ${formatEur(f.minPrice)}` });
    if (f.maxPrice !== undefined) chips.push({ key: 'max_price', label: `do ${formatEur(f.maxPrice)}` });
    if (f.minBerths !== undefined) chips.push({ key: 'guests', label: `${f.minBerths}+ hostí` });
    if (f.minCabins !== undefined) chips.push({ key: 'min_cabins', label: `${f.minCabins}+ kajút` });
    if (f.minLength !== undefined) chips.push({ key: 'min_length', label: `od ${f.minLength} m` });
    if (f.search) chips.push({ key: 'search', label: `„${f.search}“` });
    return chips;
  });

  protected readonly activeCount = computed(() => this.activeChips().length);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    // Mirror external URL changes (back button, chip removal) into the search box.
    effect(() => {
      const fromUrl = this.filters().search ?? '';
      if (this.searchDebounce === undefined && fromUrl !== this.searchTerm()) {
        this.searchTerm.set(fromUrl);
      }
    });

    effect(() => this.document.body.classList.toggle('no-scroll', this.filtersOpen()));

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.searchDebounce);
      this.document.body.classList.remove('no-scroll');
    });
  }

  // --- URL updates -----------------------------------------------------------
  private patch(params: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected setParam(key: FilterKey, value: string | number | null | undefined): void {
    this.patch({ [key]: value === '' || value === undefined ? null : value });
  }

  protected toggleMulti(key: 'yacht_type' | 'charter_type', value: string): void {
    const current = this.queryParams().getAll(key);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.patch({ [key]: next.length ? next : null });
  }

  protected isSelected(key: 'yacht_type' | 'charter_type', value: string): boolean {
    return this.queryParams().getAll(key).includes(value);
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchDebounce = undefined;
      this.setParam('search', value.trim() || null);
    }, 350);
  }

  protected removeChip(chip: ActiveChip): void {
    if (chip.value && (chip.key === 'yacht_type' || chip.key === 'charter_type')) {
      this.toggleMulti(chip.key, chip.value);
    } else {
      this.setParam(chip.key, null);
    }
  }

  protected clearAll(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = undefined;
    this.searchTerm.set('');
    const ordering = this.filters().ordering;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: ordering ? { ordering } : {},
      replaceUrl: true,
    });
  }
}
