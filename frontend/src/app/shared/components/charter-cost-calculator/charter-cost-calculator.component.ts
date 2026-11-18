import { ChangeDetectionStrategy, Component, computed, effect, input, model } from '@angular/core';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { CharterType } from '../../../core/models/charter.models';
import { PLURALS } from '../../../core/utils/format';
import { EurPipe, PluralPipe } from '../../pipes/format.pipes';
import { IconComponent } from '../icon/icon.component';

interface LineItem {
  label: string;
  note?: string;
  amount: number;
}

/**
 * Interactive weekly charter estimator.
 *
 * `guests`, `skipper` and `hostess` are two-way bindable model signals so the
 * parent page (e.g. the booking form) can stay in sync with the calculator.
 */
@Component({
  selector: 'app-charter-cost-calculator',
  imports: [IconComponent, EurPipe, PluralPipe],
  templateUrl: './charter-cost-calculator.component.html',
  styleUrl: './charter-cost-calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharterCostCalculatorComponent {
  readonly weeklyPrice = input.required<number>();
  readonly transitLog = input(0);
  readonly securityDeposit = input(0);
  readonly charterType = input<CharterType>('bez_posadky');
  /** Yacht capacity (berths); the guest slider never exceeds it. */
  readonly capacity = input<number>(SITE_CONFIG.pricing.maxGuests);

  readonly guests = model(6);
  readonly skipper = model(false);
  readonly hostess = model(false);

  protected readonly pricing = SITE_CONFIG.pricing;
  protected readonly plurals = PLURALS;

  protected readonly minGuests = this.pricing.minGuests;
  protected readonly maxGuests = computed(() =>
    Math.max(this.minGuests, Math.min(this.pricing.maxGuests, this.capacity())),
  );

  protected readonly crewIncluded = computed(() => this.charterType() === 's_posadkou');
  protected readonly skipperRequired = computed(() => this.charterType() === 's_kapitanom');

  protected readonly lineItems = computed<LineItem[]>(() => {
    const items: LineItem[] = [{ label: 'Prenájom lode', note: '1 týždeň, sobota – sobota', amount: this.weeklyPrice() }];

    if (this.crewIncluded()) {
      items.push({ label: 'Posádka', note: 'kapitán, hosteska a námorník v cene', amount: 0 });
      items.push({
        label: 'APA záloha (odhad)',
        note: `${Math.round(this.pricing.crewedApaRate * 100)} % – palivo, prístavy, strava; nevyčerpaná suma sa vracia`,
        amount: Math.round(this.weeklyPrice() * this.pricing.crewedApaRate),
      });
    } else {
      if (this.skipper()) {
        items.push({ label: 'Kapitán', note: 'licencovaný skiper', amount: this.pricing.skipperWeekly });
      }
      if (this.hostess()) {
        items.push({ label: 'Hosteska', note: 'varenie, upratovanie, servis', amount: this.pricing.hostessWeekly });
      }
    }

    if (this.transitLog() > 0) {
      items.push({ label: 'Transit log', note: 'upratovanie, bielizeň, plyn', amount: this.transitLog() });
    }
    return items;
  });

  protected readonly total = computed(() => this.lineItems().reduce((sum, item) => sum + item.amount, 0));
  protected readonly perPerson = computed(() => this.total() / Math.max(1, this.guests()));

  constructor() {
    // Keep state consistent with the yacht's charter mode and capacity.
    effect(() => {
      if (this.skipperRequired() && !this.skipper()) this.skipper.set(true);
      if (this.crewIncluded() && (this.skipper() || this.hostess())) {
        this.skipper.set(false);
        this.hostess.set(false);
      }
    });
    effect(() => {
      const max = this.maxGuests();
      const current = this.guests();
      if (current > max) this.guests.set(max);
      else if (current < this.minGuests) this.guests.set(this.minGuests);
    });
  }

  protected setGuests(value: number | string): void {
    const n = Math.round(Number(value));
    if (Number.isFinite(n)) {
      this.guests.set(Math.min(this.maxGuests(), Math.max(this.minGuests, n)));
    }
  }

  protected toggleSkipper(): void {
    if (!this.skipperRequired() && !this.crewIncluded()) this.skipper.update((v) => !v);
  }

  protected toggleHostess(): void {
    if (!this.crewIncluded()) this.hostess.update((v) => !v);
  }
}
