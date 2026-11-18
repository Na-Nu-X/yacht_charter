import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { YachtSummary } from '../../../core/models/charter.models';
import { PLURALS } from '../../../core/utils/format';
import { DecimalSkPipe, EurPipe, PluralPipe } from '../../pipes/format.pipes';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-yacht-card',
  imports: [RouterLink, IconComponent, EurPipe, DecimalSkPipe, PluralPipe],
  templateUrl: './yacht-card.component.html',
  styleUrl: './yacht-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YachtCardComponent {
  readonly yacht = input.required<YachtSummary>();
  /** Set on above-the-fold cards to skip lazy loading. */
  readonly priority = input(false);

  protected readonly plurals = PLURALS;
}
