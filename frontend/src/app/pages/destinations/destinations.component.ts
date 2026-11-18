import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { Destination } from '../../core/models/charter.models';
import { CharterApiService } from '../../core/services/charter-api.service';
import { PLURALS } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EurPipe, PluralPipe } from '../../shared/pipes/format.pipes';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTH_STEMS = ['janu', 'febr', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sept', 'okt', 'nov', 'dec'];

/** "Máj – Október" → boolean[12] marking the best sailing months (handles wrap-around, e.g. Dec – Apr). */
export function seasonMonths(season: string): boolean[] {
  const parts = season
    .toLowerCase()
    .split(/[–-]/)
    .map((p) => p.trim());
  const indexOf = (part: string) => MONTH_STEMS.findIndex((stem) => part.startsWith(stem));
  const start = indexOf(parts[0] ?? '');
  const end = indexOf(parts[1] ?? parts[0] ?? '');
  const months = new Array<boolean>(12).fill(false);
  if (start < 0 || end < 0) return months;
  for (let i = start; ; i = (i + 1) % 12) {
    months[i] = true;
    if (i === end) break;
  }
  return months;
}

@Component({
  selector: 'app-destinations',
  imports: [RouterLink, IconComponent, EurPipe, PluralPipe],
  templateUrl: './destinations.component.html',
  styleUrl: './destinations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationsComponent {
  private readonly api = inject(CharterApiService);

  protected readonly config = SITE_CONFIG;
  protected readonly plurals = PLURALS;
  protected readonly months = MONTHS;

  protected readonly resource = rxResource({ stream: () => this.api.getDestinations() });
  protected readonly destinations = computed<(Destination & { season: boolean[] })[]>(() =>
    (this.resource.value() ?? []).map((d) => ({ ...d, season: seasonMonths(d.bestSeason) })),
  );
}
