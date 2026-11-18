import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { TESTIMONIALS, TRUST_PILLARS } from '../../core/data/content';
import { CHARTER_TYPES, YACHT_TYPES } from '../../core/models/charter.models';
import { CharterApiService } from '../../core/services/charter-api.service';
import { PLURALS } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { YachtCardSkeletonComponent } from '../../shared/components/yacht-card-skeleton/yacht-card-skeleton.component';
import { YachtCardComponent } from '../../shared/components/yacht-card/yacht-card.component';
import { EurPipe, PluralPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, YachtCardComponent, YachtCardSkeletonComponent, EurPipe, PluralPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly api = inject(CharterApiService);
  private readonly router = inject(Router);

  protected readonly config = SITE_CONFIG;
  protected readonly yachtTypes = YACHT_TYPES;
  protected readonly charterTypes = CHARTER_TYPES;
  protected readonly pillars = TRUST_PILLARS;
  protected readonly testimonials = TESTIMONIALS;
  protected readonly plurals = PLURALS;
  protected readonly guestOptions = Array.from({ length: 11 }, (_, i) => i + 2);

  protected readonly featured = rxResource({
    stream: () => this.api.getYachts({ featured: true }),
  });
  protected readonly destinations = rxResource({
    stream: () => this.api.getDestinations(),
  });

  protected readonly featuredYachts = computed(() => (this.featured.value() ?? []).slice(0, 6));
  protected readonly featuredDestinations = computed(() =>
    (this.destinations.value() ?? []).filter((d) => d.isFeatured).slice(0, 5),
  );

  // Quick charter search state
  protected readonly searchDestination = signal('');
  protected readonly searchYachtType = signal('');
  protected readonly searchCharterType = signal('');
  protected readonly searchGuests = signal('');

  protected search(event: Event): void {
    event.preventDefault();
    const queryParams: Record<string, string> = {};
    if (this.searchDestination()) queryParams['destination'] = this.searchDestination();
    if (this.searchYachtType()) queryParams['yacht_type'] = this.searchYachtType();
    if (this.searchCharterType()) queryParams['charter_type'] = this.searchCharterType();
    if (this.searchGuests()) queryParams['guests'] = this.searchGuests();
    void this.router.navigate(['/flotila'], { queryParams });
  }

  protected stars(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
