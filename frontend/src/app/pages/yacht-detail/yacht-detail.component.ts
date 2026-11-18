import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { YachtImage } from '../../core/models/charter.models';
import { CharterApiService, parseApiError } from '../../core/services/charter-api.service';
import { PageTitleStrategy } from '../../core/services/page-title.strategy';
import { PLURALS, nextSaturday, toIsoDate } from '../../core/utils/format';
import { phoneValidator, saturdayInFutureValidator, validationMessage } from '../../core/utils/validators';
import { CharterCostCalculatorComponent } from '../../shared/components/charter-cost-calculator/charter-cost-calculator.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { YachtCardComponent } from '../../shared/components/yacht-card/yacht-card.component';
import { DecimalSkPipe, EurPipe, PluralPipe } from '../../shared/pipes/format.pipes';

interface SpecItem {
  icon: IconName;
  label: string;
  value: string;
}

type InquiryField =
  | 'check_in_date'
  | 'duration_weeks'
  | 'guests_count'
  | 'client_name'
  | 'email'
  | 'phone'
  | 'message'
  | 'consent';

@Component({
  selector: 'app-yacht-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IconComponent,
    CharterCostCalculatorComponent,
    YachtCardComponent,
    EurPipe,
    DecimalSkPipe,
    PluralPipe,
  ],
  templateUrl: './yacht-detail.component.html',
  styleUrl: './yacht-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class YachtDetailComponent {
  private readonly api = inject(CharterApiService);
  private readonly titleStrategy = inject(PageTitleStrategy);
  private readonly document = inject(DOCUMENT);
  private readonly fb = inject(FormBuilder);

  /** Bound from the `:slug` route parameter (withComponentInputBinding). */
  readonly slug = input.required<string>();

  protected readonly config = SITE_CONFIG;
  protected readonly plurals = PLURALS;
  protected readonly weekOptions = [1, 2, 3, 4];

  protected readonly yachtResource = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.api.getYacht(params),
  });
  protected readonly yacht = computed(() => (this.yachtResource.hasValue() ? this.yachtResource.value() : null));
  protected readonly notFound = computed(() => {
    const error = this.yachtResource.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly similarResource = rxResource({
    params: () => this.yacht()?.destination.slug,
    stream: ({ params }) => this.api.getYachts({ destination: params }),
  });
  protected readonly similar = computed(() =>
    (this.similarResource.value() ?? []).filter((y) => y.slug !== this.slug()).slice(0, 3),
  );

  protected readonly gallery = computed<YachtImage[]>(() => {
    const y = this.yacht();
    if (!y) return [];
    return y.images.length
      ? y.images
      : [{ id: 0, imageUrl: y.coverImageUrl, caption: y.name, displayOrder: 0 }];
  });

  protected readonly specs = computed<SpecItem[]>(() => {
    const y = this.yacht();
    if (!y) return [];
    const dec = (n: number) => n.toLocaleString('sk-SK', { maximumFractionDigits: 2 });
    return [
      { icon: 'ruler', label: 'Dĺžka', value: `${dec(y.lengthMeters)} m` },
      { icon: 'ruler', label: 'Šírka', value: `${dec(y.beamMeters)} m` },
      { icon: 'waves', label: 'Ponor', value: `${dec(y.draftMeters)} m` },
      { icon: 'calendar', label: 'Rok výroby', value: String(y.buildYear) },
      { icon: 'door', label: 'Kajuty', value: String(y.cabins) },
      { icon: 'bed', label: 'Lôžka', value: String(y.berths) },
      { icon: 'bath', label: 'Kúpeľne', value: String(y.bathrooms) },
      { icon: 'engine', label: 'Motor', value: y.enginePower },
      { icon: 'anchor', label: 'Domovská marína', value: y.homeMarina },
    ];
  });

  // --- Gallery & lightbox ------------------------------------------------------
  protected readonly activeImage = signal(0);
  protected readonly lightboxOpen = signal(false);
  private readonly lightboxClose = viewChild<ElementRef<HTMLButtonElement>>('lightboxClose');
  private lastFocused: HTMLElement | null = null;

  // --- Calculator ↔ form shared state ----------------------------------------
  protected readonly guests = signal(6);
  protected readonly skipper = signal(false);
  protected readonly hostess = signal(false);

  // --- Inquiry form ------------------------------------------------------------
  protected readonly minDate = toIsoDate(nextSaturday(3));
  protected readonly form = this.fb.nonNullable.group({
    check_in_date: [toIsoDate(nextSaturday(14)), [Validators.required, saturdayInFutureValidator]],
    duration_weeks: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
    guests_count: [6, [Validators.required, Validators.min(1)]],
    skipper_needed: [false],
    hostess_needed: [false],
    client_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator]],
    message: ['', [Validators.maxLength(2000)]],
    consent: [false, [Validators.requiredTrue]],
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Page title, gallery reset and sensible defaults whenever a yacht loads.
    effect(() => {
      const y = this.yacht();
      if (!y) return;
      untracked(() => {
        this.titleStrategy.setTitle(y.name);
        this.activeImage.set(0);
        this.submitted.set(false);
        this.serverError.set(null);
        const defaultGuests = Math.min(y.berths, Math.max(2, Math.min(6, y.berths)));
        this.guests.set(defaultGuests);
        this.skipper.set(y.charterType === 's_kapitanom');
        this.hostess.set(false);
        this.form.controls.guests_count.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(y.berths),
        ]);
        this.form.controls.guests_count.updateValueAndValidity({ emitEvent: false });
      });
    });

    // Calculator → form
    effect(() => {
      this.form.patchValue(
        { guests_count: this.guests(), skipper_needed: this.skipper(), hostess_needed: this.hostess() },
        { emitEvent: false },
      );
    });

    // Form → calculator
    this.form.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
      if (value.guests_count !== undefined && value.guests_count !== this.guests()) {
        this.guests.set(Number(value.guests_count));
      }
      if (value.skipper_needed !== undefined) this.skipper.set(value.skipper_needed);
      if (value.hostess_needed !== undefined) this.hostess.set(value.hostess_needed);
    });

    // Lightbox: lock scroll while open and move focus into the dialog once rendered.
    effect(() => this.document.body.classList.toggle('no-scroll', this.lightboxOpen()));
    effect(() => this.lightboxClose()?.nativeElement.focus());
    destroyRef.onDestroy(() => this.document.body.classList.remove('no-scroll'));
  }

  // --- Gallery API --------------------------------------------------------------
  protected selectImage(index: number): void {
    const count = this.gallery().length;
    if (!count) return;
    this.activeImage.set((index + count) % count);
  }

  protected openLightbox(index = this.activeImage()): void {
    this.lastFocused = this.document.activeElement as HTMLElement | null;
    this.selectImage(index);
    this.lightboxOpen.set(true);
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lastFocused?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (event.key === 'Escape') this.closeLightbox();
    else if (event.key === 'ArrowRight') this.selectImage(this.activeImage() + 1);
    else if (event.key === 'ArrowLeft') this.selectImage(this.activeImage() - 1);
  }

  // --- Form helpers ---------------------------------------------------------------
  protected guestOptions(berths: number): number[] {
    return Array.from({ length: berths }, (_, i) => i + 1);
  }

  protected fieldError(name: InquiryField): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitAttempted())) return null;
    if (name === 'consent' && control.errors?.['required']) return validationMessage({ consent: true });
    return validationMessage(control.errors);
  }

  protected submit(): void {
    const y = this.yacht();
    if (!y || this.submitting()) return;
    this.submitAttempted.set(true);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { consent: _consent, ...value } = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .submitInquiry({
        ...value,
        yacht: y.slug,
        duration_weeks: Number(value.duration_weeks),
        guests_count: Number(value.guests_count),
        client_name: value.client_name.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        message: value.message.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (error: unknown) => {
          const parsed = parseApiError(error);
          for (const [field, messages] of Object.entries(parsed.fields)) {
            const control = this.form.get(field);
            if (control) {
              control.setErrors({ server: messages.join(' ') });
              control.markAsTouched();
            }
          }
          this.serverError.set(parsed.message);
          this.submitting.set(false);
        },
      });
  }

  protected resetInquiry(): void {
    this.submitted.set(false);
    this.submitAttempted.set(false);
    this.form.patchValue({ message: '', consent: false });
    this.form.markAsUntouched();
  }
}
