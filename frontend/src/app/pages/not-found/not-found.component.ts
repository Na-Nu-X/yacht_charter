import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-header">
      <div class="container page-header__inner">
        <span class="eyebrow eyebrow--light">Chyba 404</span>
        <h1>Tento kurz nikam nevedie</h1>
        <p class="lead">Stránku, ktorú hľadáte, sme nenašli. Možno bola presunutá, alebo jachta už nie je v ponuke.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="empty-state">
          <span class="empty-state__icon"><app-icon name="compass" [size]="30" /></span>
          <h2 class="h3">Nastavte nový kurz</h2>
          <p>Pozrite si celú flotilu alebo sa vráťte na úvodnú stránku.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center">
            <a class="btn btn--brass" routerLink="/flotila">Flotila jácht</a>
            <a class="btn btn--outline" routerLink="/">Úvodná stránka</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
