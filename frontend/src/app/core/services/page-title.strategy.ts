import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE_CONFIG } from '../config/site.config';

/** Appends the agency name to every route title: "Flotila jácht | Navalia Yachting". */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.setTitle(this.buildTitle(snapshot));
  }

  setTitle(pageTitle?: string): void {
    const suffix = SITE_CONFIG.seo.titleSuffix;
    this.title.setTitle(pageTitle ? `${pageTitle} | ${suffix}` : `${suffix} – ${SITE_CONFIG.brand.tagline}`);
  }
}
