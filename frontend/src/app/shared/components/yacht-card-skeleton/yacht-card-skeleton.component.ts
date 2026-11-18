import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Placeholder with the same footprint as YachtCardComponent while data loads. */
@Component({
  selector: 'app-yacht-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="sk">
      <div class="skeleton sk__media"></div>
      <div class="sk__body">
        <div class="skeleton sk__line" style="width: 45%"></div>
        <div class="skeleton sk__title"></div>
        <div class="sk__specs">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton sk__line"></div>
          }
        </div>
        <div class="skeleton sk__line" style="width: 55%; height: 22px"></div>
      </div>
    </div>
  `,
  styles: `
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;
    :host { display: block; }
    .sk { @include card; overflow: hidden; height: 100%; }
    .sk__media { aspect-ratio: 10 / 7; border-radius: 0; }
    .sk__body { display: grid; gap: $space-4; padding: $space-5; }
    .sk__line { height: 12px; }
    .sk__title { height: 28px; width: 80%; }
    .sk__specs { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
  `,
})
export class YachtCardSkeletonComponent {}
