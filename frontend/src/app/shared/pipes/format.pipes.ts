import { Pipe, PipeTransform } from '@angular/core';

import { formatDecimal, formatEur, plural } from '../../core/utils/format';

/** 6900 → "6 900 €" */
@Pipe({ name: 'eur' })
export class EurPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatEur(value);
  }
}

/** 14.5 → "14,5" (Slovak decimal comma) */
@Pipe({ name: 'decimal' })
export class DecimalSkPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatDecimal(value);
  }
}

/** {{ 3 | plural: ['kajuta', 'kajuty', 'kajút'] }} → "kajuty" */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(count: number, forms: readonly [string, string, string]): string {
    return plural(count, forms);
  }
}
