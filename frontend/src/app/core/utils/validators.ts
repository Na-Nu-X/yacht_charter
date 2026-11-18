import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { parseIsoDate } from './format';

const PHONE_PATTERN = /^[+0-9()\-/ ]+$/;

export const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, '').length;
  return PHONE_PATTERN.test(value) && digits >= 9 ? null : { phone: true };
};

/** Charter weeks start on Saturday and must be in the future. */
export const saturdayInFutureValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return null;
  const date = parseIsoDate(value);
  if (!date) return { date: true };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return { past: true };
  if (date.getDay() !== 6) return { notSaturday: true };
  return null;
};

/** Slovak messages for the validators used across the app's forms. */
export function validationMessage(errors: ValidationErrors | null | undefined): string | null {
  if (!errors) return null;
  if (errors['required']) return 'Toto pole je povinné.';
  if (errors['email']) return 'Zadajte platnú e-mailovú adresu.';
  if (errors['phone']) return 'Zadajte platné telefónne číslo (napr. +421 900 123 456).';
  if (errors['minlength']) {
    return `Zadajte aspoň ${errors['minlength'].requiredLength} znaky.`;
  }
  if (errors['maxlength']) {
    return `Maximálne ${errors['maxlength'].requiredLength} znakov.`;
  }
  if (errors['min']) return `Minimálna hodnota je ${errors['min'].min}.`;
  if (errors['max']) return `Maximálna hodnota je ${errors['max'].max}.`;
  if (errors['past']) return 'Termín nalodenia musí byť v budúcnosti.';
  if (errors['notSaturday']) return 'Charterové týždne začínajú v sobotu – vyberte prosím sobotu.';
  if (errors['date']) return 'Zadajte platný dátum.';
  if (errors['consent']) return 'Pre odoslanie je potrebný súhlas so spracovaním údajov.';
  if (errors['server']) return String(errors['server']);
  return 'Skontrolujte zadanú hodnotu.';
}
