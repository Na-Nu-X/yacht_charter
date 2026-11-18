import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { FAQ, STEPS_FIRST_TIMERS, STEPS_LICENSED } from '../../core/data/content';
import { CharterApiService, parseApiError } from '../../core/services/charter-api.service';
import { phoneValidator, validationMessage } from '../../core/utils/validators';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Audience = 'licensed' | 'first';
type ContactField = 'client_name' | 'email' | 'phone' | 'subject' | 'message' | 'consent';

@Component({
  selector: 'app-about-contact',
  imports: [RouterLink, ReactiveFormsModule, IconComponent],
  templateUrl: './about-contact.component.html',
  styleUrl: './about-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutContactComponent {
  private readonly api = inject(CharterApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly config = SITE_CONFIG;
  protected readonly faq = FAQ;

  protected readonly audience = signal<Audience>('licensed');
  protected readonly steps = computed(() => (this.audience() === 'licensed' ? STEPS_LICENSED : STEPS_FIRST_TIMERS));

  protected readonly subjects = [
    'Všeobecná otázka',
    'Prenájom konkrétnej lode',
    'Firemná akcia / regata',
    'Kapitánsky kurz',
    'Spolupráca s agentúrou',
  ];

  protected readonly form = this.fb.nonNullable.group({
    client_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [phoneValidator]],
    subject: [this.subjects[0]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
    consent: [false, Validators.requiredTrue],
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected fieldError(name: ContactField): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || this.submitAttempted())) return null;
    if (name === 'consent') return validationMessage({ consent: true });
    return validationMessage(control.errors);
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitAttempted.set(true);
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .submitContact({
        client_name: v.client_name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        subject: v.subject,
        message: v.message.trim(),
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
            control?.setErrors({ server: messages.join(' ') });
            control?.markAsTouched();
          }
          this.serverError.set(parsed.message);
          this.submitting.set(false);
        },
      });
  }

  protected reset(): void {
    this.form.reset();
    this.submitAttempted.set(false);
    this.submitted.set(false);
  }
}
