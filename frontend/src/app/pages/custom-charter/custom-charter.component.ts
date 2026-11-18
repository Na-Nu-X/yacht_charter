import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { CHARTER_TYPES, CharterType, YACHT_TYPES, YachtType } from '../../core/models/charter.models';
import { CharterApiService, parseApiError } from '../../core/services/charter-api.service';
import { PLURALS } from '../../core/utils/format';
import { phoneValidator, validationMessage } from '../../core/utils/validators';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { PluralPipe } from '../../shared/pipes/format.pipes';

interface Choice<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  icon?: IconName;
}

const MONTH_NAMES = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
];

function upcomingMonths(count = 15): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  });
}

const STEP_FIELDS = [
  ['preferred_destination', 'preferred_month'],
  ['yacht_type', 'charter_type', 'guests_count', 'estimated_weekly_budget'],
  ['client_name', 'phone', 'email', 'consent'],
] as const;

type WizardField = (typeof STEP_FIELDS)[number][number];

@Component({
  selector: 'app-custom-charter',
  imports: [RouterLink, ReactiveFormsModule, IconComponent, PluralPipe],
  templateUrl: './custom-charter.component.html',
  styleUrl: './custom-charter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCharterComponent {
  private readonly api = inject(CharterApiService);
  private readonly fb = inject(FormBuilder);
  private readonly wizardTop = viewChild<ElementRef<HTMLElement>>('wizardTop');

  protected readonly config = SITE_CONFIG;
  protected readonly plurals = PLURALS;
  protected readonly months = ['Flexibilný termín', ...upcomingMonths()];
  protected readonly steps = ['Kam a kedy', 'Loď a posádka', 'Kontakt'];

  protected readonly destinationsResource = rxResource({ stream: () => this.api.getDestinations() });
  protected readonly destinationChoices = computed<Choice[]>(() => [
    ...(this.destinationsResource.value() ?? []).map((d) => ({ value: d.name, label: d.name, hint: d.bestSeason })),
    { value: 'Neviem, poraďte mi', label: 'Neviem, poraďte mi', hint: 'Navrhneme podľa termínu' },
  ]);

  protected readonly yachtTypeChoices: Choice<YachtType | ''>[] = [
    { value: 'plachetnica', label: 'Plachetnica', hint: 'Skutočné plachtenie', icon: 'sailboat' },
    { value: 'katamaran', label: 'Katamarán', hint: 'Stabilita a priestor', icon: 'waves' },
    { value: 'motorova_jachta', label: 'Motorová jachta', hint: 'Rýchlosť a komfort', icon: 'compass' },
    { value: 'superjachta', label: 'Luxusná jachta', hint: 'S posádkou a šéfkuchárom', icon: 'sparkle' },
    { value: '', label: 'Nechám na vás', hint: 'Odporučte mi', icon: 'heart' },
  ];

  protected readonly charterTypeChoices: Choice<CharterType | ''>[] = [
    ...CHARTER_TYPES.map((c) => ({ value: c.value, label: c.label })),
    { value: '', label: 'Ešte neviem' },
  ];

  protected readonly budgetChoices = [
    'do 5 000 €',
    '5 000 – 10 000 €',
    '10 000 – 20 000 €',
    '20 000 – 50 000 €',
    'nad 50 000 €',
  ];

  protected readonly occasions: Choice[] = [
    { value: 'Rodinná dovolenka', label: 'Rodinná dovolenka', icon: 'family' },
    { value: 'Partia priateľov', label: 'Partia priateľov', icon: 'users' },
    { value: 'Firemný teambuilding', label: 'Firemný teambuilding', icon: 'briefcase' },
    { value: 'Oslava na mori', label: 'Oslava na mori', icon: 'glass' },
    { value: 'Svadobná cesta', label: 'Svadobná cesta', icon: 'heart' },
    { value: 'Regata', label: 'Regata', icon: 'wind' },
  ];

  protected readonly segments: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'family',
      title: 'Rodiny s deťmi',
      text: 'Stabilné katamarány, krátke presuny, plytké zátoky na kúpanie a kapitán, ktorý myslí na bezpečnosť najmenších.',
    },
    {
      icon: 'users',
      title: 'Partia priateľov',
      text: 'Plachetnica pre 8 – 12 osôb, trasa s nočným životom aj tichými kotviskami a cena, ktorá sa pekne rozdelí.',
    },
    {
      icon: 'briefcase',
      title: 'Firmy a regaty',
      text: 'Flotila lodí s kapitánmi, regata s rozhodcom, catering a fakturácia. Teambuilding, na ktorý sa nezabúda.',
    },
  ];

  protected readonly form = this.fb.nonNullable.group({
    preferred_destination: ['', Validators.required],
    preferred_month: ['', Validators.required],
    yacht_type: ['' as YachtType | ''],
    charter_type: ['' as CharterType | ''],
    guests_count: [6, [Validators.required, Validators.min(1), Validators.max(40)]],
    estimated_weekly_budget: ['', Validators.required],
    occasions: [[] as string[]],
    notes: ['', Validators.maxLength(2000)],
    client_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    phone: ['', [Validators.required, phoneValidator]],
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue],
  });

  protected readonly step = signal(0);
  protected readonly stepAttempted = signal<boolean[]>([false, false, false]);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Bumped on every value change so computed() summaries re-evaluate (forms aren't signals). */
  private readonly formVersion = signal(0);

  protected readonly summary = computed(() => {
    this.formVersion();
    const v = this.form.getRawValue();
    return {
      destination: v.preferred_destination,
      month: v.preferred_month,
      yacht: this.yachtTypeChoices.find((c) => c.value === v.yacht_type)?.label ?? '—',
      charter: this.charterTypeChoices.find((c) => c.value === v.charter_type)?.label ?? '—',
      guests: v.guests_count,
      budget: v.estimated_weekly_budget,
      email: v.email,
    };
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formVersion.update((n) => n + 1));
  }

  // --- Helpers ----------------------------------------------------------------
  protected setValue(field: 'preferred_destination' | 'preferred_month' | 'yacht_type' | 'charter_type' | 'estimated_weekly_budget', value: string): void {
    const control = this.form.controls[field];
    control.setValue(value as never);
    control.markAsTouched();
  }

  protected isChosen(field: 'preferred_destination' | 'yacht_type' | 'charter_type' | 'estimated_weekly_budget', value: string): boolean {
    this.formVersion();
    return this.form.controls[field].value === value;
  }

  protected changeGuests(delta: number): void {
    const control = this.form.controls.guests_count;
    control.setValue(Math.min(40, Math.max(1, Number(control.value) + delta)));
  }

  protected toggleOccasion(value: string): void {
    const control = this.form.controls.occasions;
    const current = control.value;
    control.setValue(current.includes(value) ? current.filter((o) => o !== value) : [...current, value]);
  }

  protected hasOccasion(value: string): boolean {
    this.formVersion();
    return this.form.controls.occasions.value.includes(value);
  }

  protected fieldError(name: WizardField): string | null {
    this.formVersion();
    const control = this.form.controls[name];
    const stepIndex = STEP_FIELDS.findIndex((fields) => (fields as readonly string[]).includes(name));
    if (!control.invalid || !(control.touched || this.stepAttempted()[stepIndex])) return null;
    if (name === 'consent') return validationMessage({ consent: true });
    if (control.errors?.['required'] && name === 'preferred_destination') return 'Vyberte destináciu.';
    if (control.errors?.['required'] && name === 'preferred_month') return 'Vyberte preferovaný termín.';
    if (control.errors?.['required'] && name === 'estimated_weekly_budget') return 'Vyberte orientačný rozpočet.';
    return validationMessage(control.errors);
  }

  private stepValid(index: number): boolean {
    return STEP_FIELDS[index].every((field) => this.form.controls[field].valid);
  }

  private scrollToWizard(): void {
    this.wizardTop()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected next(): void {
    const current = this.step();
    this.stepAttempted.update((a) => a.map((v, i) => (i === current ? true : v)));
    if (!this.stepValid(current)) {
      STEP_FIELDS[current].forEach((f) => this.form.controls[f].markAsTouched());
      this.formVersion.update((n) => n + 1);
      return;
    }
    this.step.set(current + 1);
    this.scrollToWizard();
  }

  protected back(): void {
    this.step.update((s) => Math.max(0, s - 1));
    this.scrollToWizard();
  }

  protected goTo(index: number): void {
    // Allow jumping back, or forward only through already-valid steps.
    if (index < this.step() || Array.from({ length: index }, (_, i) => this.stepValid(i)).every(Boolean)) {
      this.step.set(index);
    }
  }

  protected submit(): void {
    if (this.step() < 2) {
      this.next();
      return;
    }
    if (this.submitting()) return;
    this.stepAttempted.set([true, true, true]);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formVersion.update((n) => n + 1);
      const firstInvalid = STEP_FIELDS.findIndex((_, i) => !this.stepValid(i));
      if (firstInvalid >= 0 && firstInvalid < 2) this.step.set(firstInvalid);
      return;
    }

    const v = this.form.getRawValue();
    const wishes = [
      v.occasions.length ? `Príležitosť: ${v.occasions.join(', ')}.` : '',
      v.notes.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    this.submitting.set(true);
    this.api
      .submitCustomCharter({
        preferred_destination: v.preferred_destination,
        preferred_month: v.preferred_month,
        yacht_type: v.yacht_type,
        charter_type: v.charter_type,
        guests_count: Number(v.guests_count),
        estimated_weekly_budget: v.estimated_weekly_budget,
        special_wishes: wishes,
        client_name: v.client_name.trim(),
        phone: v.phone.trim(),
        email: v.email.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.scrollToWizard();
        },
        error: (error: unknown) => {
          const parsed = parseApiError(error);
          for (const [field, messages] of Object.entries(parsed.fields)) {
            const control = this.form.get(field === 'special_wishes' ? 'notes' : field);
            control?.setErrors({ server: messages.join(' ') });
            control?.markAsTouched();
          }
          this.serverError.set(parsed.message);
          this.submitting.set(false);
          this.formVersion.update((n) => n + 1);
        },
      });
  }

  protected restart(): void {
    this.form.reset();
    this.step.set(0);
    this.stepAttempted.set([false, false, false]);
    this.submitted.set(false);
    this.serverError.set(null);
  }
}
