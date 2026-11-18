/**
 * White-label configuration.
 *
 * Everything that identifies the charter agency — name, wordmark, contact
 * details, company registration, licensing advice, social links, trust
 * metrics, pricing assumptions and optional colour overrides — lives here.
 * Rebranding the site for a new client means editing this one file.
 */

export interface SocialLink {
  label: string;
  url: string;
  icon: 'instagram' | 'facebook' | 'youtube' | 'linkedin';
}

export interface TrustMetric {
  value: string;
  label: string;
}

/**
 * Optional runtime overrides of the CSS custom properties defined in
 * `src/styles/_variables.scss` (key = property name without the leading `--`).
 */
export type ThemeOverrides = Partial<
  Record<
    | 'color-navy-deep'
    | 'color-accent'
    | 'color-accent-hover'
    | 'color-brass'
    | 'color-brass-hover'
    | 'color-brass-light'
    | 'color-bg'
    | 'color-surface-warm'
    | 'font-serif'
    | 'font-sans',
    string
  >
>;

export const SITE_CONFIG = {
  brand: {
    name: 'Navalia Yachting',
    wordmark: { primary: 'NAVALIA', secondary: 'Yacht Charter' },
    tagline: 'Prenájom jácht a námorné plavby',
    claim: 'Stredomorie z paluby vašej vlastnej jachty',
    description:
      'Butiková charterová agentúra so sídlom v Bratislave. Od roku 2009 sprostredkúvame prenájom ' +
      'overených plachetníc, katamaránov a motorových jácht v Stredomorí a Karibiku.',
    foundedYear: 2009,
  },

  contact: {
    phone: '+421 2 3300 4400',
    phoneHref: 'tel:+421233004400',
    hotline: '+421 905 247 247',
    hotlineHref: 'tel:+421905247247',
    hotlineNote: 'Nonstop linka pre klientov na mori',
    email: 'charter@navalia.sk',
    vipEmail: 'vip@navalia.sk',
    address: {
      street: 'Panská 14',
      zip: '811 01',
      city: 'Bratislava',
      country: 'Slovensko',
    },
    openingHours: 'Po – Pi 9:00 – 18:00, So 10:00 – 13:00 (v sezóne)',
    mapUrl: 'https://maps.google.com/?q=Pansk%C3%A1+14,+Bratislava',
  },

  company: {
    legalName: 'Navalia Yachting s.r.o.',
    ico: '53 412 879',
    dic: '2121 345 678',
    icDph: 'SK2121345678',
    registry: 'Zapísaná v Obchodnom registri Mestského súdu Bratislava III, oddiel Sro, vložka č. 154321/B',
  },

  licensing: {
    title: 'Kapitánsky preukaz a licencie',
    summary:
      'Na prenájom lode bez posádky (bareboat) potrebuje aspoň jeden člen posádky platný kapitánsky ' +
      'preukaz zodpovedajúci oblasti plavby a VHF licenciu (SRC). Bez preukazu si jednoducho ' +
      'objednáte loď s naším kapitánom.',
    accepted: [
      'Slovenský preukaz vodcu rekreačného plavidla – kategória C (pobrežné vody)',
      'Medzinárodný certifikát ICC (International Certificate of Competence)',
      'RYA Day Skipper / Coastal Skipper / Yachtmaster',
      'VHF / SRC rádiová licencia (aspoň jeden člen posádky)',
    ],
    note: 'Nemáte preukaz? Kurzy ICC a RYA vieme sprostredkovať v spolupráci s partnerskou jachtárskou školou.',
  },

  social: [
    { label: 'Instagram', url: 'https://instagram.com/', icon: 'instagram' },
    { label: 'Facebook', url: 'https://facebook.com/', icon: 'facebook' },
    { label: 'YouTube', url: 'https://youtube.com/', icon: 'youtube' },
    { label: 'LinkedIn', url: 'https://linkedin.com/', icon: 'linkedin' },
  ] satisfies SocialLink[],

  trustMetrics: [
    { value: '15+', label: 'rokov na mori' },
    { value: '2 400+', label: 'spokojných posádok' },
    { value: '180', label: 'overených lodí' },
    { value: '4,9 / 5', label: 'hodnotenie klientov' },
  ] satisfies TrustMetric[],

  partnerMarinas: [
    'ACI Marina Trogir',
    'Marina Kaštela',
    'Marina Alimos',
    'Marina di Portisco',
    'Club de Mar Palma',
    'Nanny Cay',
  ],

  /** Assumptions used by the charter cost calculator. */
  pricing: {
    currency: 'EUR',
    skipperWeekly: 1400,
    hostessWeekly: 1100,
    /** Advance Provisioning Allowance for fully crewed charters (fraction of base price). */
    crewedApaRate: 0.3,
    minGuests: 2,
    maxGuests: 12,
  },

  imagery: {
    hero: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=2400&q=80',
    fleetHeader: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=2000&q=70',
    destinationsHeader:
      'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?auto=format&fit=crop&w=2000&q=70',
    customCharter: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&w=2000&q=75',
    customBanner: 'https://images.unsplash.com/photo-1621277224630-81d9af65e40c?auto=format&fit=crop&w=2000&q=75',
    about: 'https://images.unsplash.com/photo-1562281302-809108fd533c?auto=format&fit=crop&w=2000&q=70',
  },

  seo: {
    titleSuffix: 'Navalia Yachting',
  },

  /** Leave empty to use the default Riviera Maritime palette. */
  theme: {} satisfies ThemeOverrides as ThemeOverrides,
} as const;

export type SiteConfig = typeof SITE_CONFIG;
