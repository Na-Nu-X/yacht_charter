import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SITE_CONFIG } from './core/config/site.config';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Preskočiť na obsah</a>
    <app-navbar />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
      outline: none;
    }
  `,
})
export class App {
  constructor() {
    // Apply white-label colour/font overrides from site.config.ts.
    const root = inject(DOCUMENT).documentElement;
    for (const [token, value] of Object.entries(SITE_CONFIG.theme)) {
      if (value) root.style.setProperty(`--${token}`, value);
    }
  }
}
