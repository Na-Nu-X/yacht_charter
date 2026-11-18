import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { IconComponent } from '../icon/icon.component';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class NavbarComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  protected readonly config = SITE_CONFIG;
  protected readonly links: NavLink[] = [
    { label: 'Flotila jácht', path: '/flotila' },
    { label: 'Destinácie', path: '/destinacie' },
    { label: 'Plavba na mieru', path: '/plavba-na-mieru' },
    { label: 'Ako to funguje', path: '/o-nas-a-kontakt' },
  ];

  protected readonly menuOpen = signal(false);
  private readonly scrolled = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Solid (white) bar once the user scrolls past the dark page header. */
  protected readonly solid = computed(() => this.scrolled() || this.menuOpen());

  constructor() {
    // Close the drawer after every navigation.
    effect(() => {
      this.url();
      this.menuOpen.set(false);
    });

    // Lock page scroll while the mobile drawer is open.
    effect(() => {
      this.document.body.classList.toggle('no-scroll', this.menuOpen());
    });

    this.onScroll();
  }

  protected onScroll(): void {
    this.scrolled.set((this.document.defaultView?.scrollY ?? 0) > 24);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
