# Yacht Charter Platform – *Prenájom jácht a námorné plavby*

A white-label, full-stack web application for a luxury yacht charter agency.
Django REST backend with a Slovak-localized admin, and an Angular 22 frontend
with a "Riviera Maritime" SCSS design system. The UI and seeded content are in Slovak.

```
.
├── backend/    Django 6 + Django REST Framework API and admin
└── frontend/   Angular 22 (standalone components, signals, zoneless, strict TS)
```

---

## Requirements

- Python 3.12+
- Node.js 22+ and npm 10+
- Angular CLI (optional, `npx ng` works too)

## 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # optional, defaults work for local dev
python manage.py migrate
python manage.py seed_data         # 5 destinations, 13 yachts, 63 photos (safe to re-run)
python manage.py createsuperuser   # account for the admin
python manage.py runserver         # serves on port 8000
```

- **Admin:** http://localhost:8000/admin/ (log in with the superuser you created)
- **API root:** http://localhost:8000/api/
- **Tests:** `python manage.py test charter`

`seed_data` is idempotent. It matches records by slug and rebuilds each yacht's gallery.
Pass `--flush` to also delete yachts and destinations that are not in the seed.

### Admin (Django `/admin`)

Brokers manage, in Slovak:

| Section | What it covers |
| --- | --- |
| **Flotila jácht** | Yachts, specs, weekly price, deposit, transit log, inline photo gallery, availability badge (bulk actions: *Dostupná / Posledné termíny / Obsadená*) |
| **Destinácie a maríny** | Regions, departure marinas, sailing season, featured flag and ordering |
| **Dopyty na rezerváciu lodí** | Booking inquiries from yacht detail pages, with an *is processed* flag |
| **Požiadavky na plavbu na mieru** | Custom itinerary wizard submissions |
| **Správy z kontaktného formulára** | Contact form messages |

### API

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/yachts/` | Filters: `destination` (slug), `yacht_type`, `charter_type` (both repeatable), `min_price`, `max_price`, `min_cabins`, `min_berths`, `min_length`, `min_year`, `featured`, `badge`, `search`, `ordering` (`weekly_price_from`, `-weekly_price_from`, `-created_at`, `-length_meters`, …) |
| GET | `/api/yachts/<slug>/` | Full dossier with gallery and destination |
| GET | `/api/destinations/` | Includes `yacht_count` and `price_from` |
| POST | `/api/inquiries/` | Booking inquiry. Validates a future Saturday start and guests ≤ berths, and rejects booked yachts |
| POST | `/api/custom-charters/` | Tailor-made itinerary request |
| POST | `/api/contact/` | Contact form |

POST endpoints are write-only (no public listing) and rate-limited to 20 requests per hour per IP.

### Production database

Set `DATABASE_URL` in `backend/.env`, for example
`postgres://user:password@host:5432/yacht_charter`, and install a driver (`pip install "psycopg[binary]"`).
Also set `DJANGO_DEBUG=False`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
`CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.

## 2. Frontend (http://localhost:4200)

```bash
cd frontend
npm install          # .npmrc enables legacy-peer-deps (works around an npm 10 resolver bug)
npm start            # = ng serve, http://localhost:4200
```

- Dev API URL: `src/environments/environment.ts` → `http://localhost:8000/api`
- Production build: `npm run build` (uses `environment.prod.ts`, where the API is `/api` on the same origin)

### Routes

| Route | Page |
| --- | --- |
| `/` | Home: hero with quick charter search, featured fleet, destinations, trust pillars, custom charter banner, testimonials |
| `/flotila` | Fleet catalogue: filter sidebar synced with URL query params, sorting, skeletons, empty and error states |
| `/flotila/:slug` | Yacht dossier: gallery and lightbox, specs, equipment, cost calculator, sticky inquiry form |
| `/destinacie` | Destination guide with sailing-season calendar and links to filtered fleet |
| `/plavba-na-mieru` | Custom charter landing page with a 3-step wizard |
| `/o-nas-a-kontakt` | How booking works, licences, deposit and insurance, FAQ, contact form |

## Rebranding for a new client (white-label)

1. **Brand & business details:** edit `frontend/src/app/core/config/site.config.ts`.
   It holds the agency name, wordmark, tagline, phones, VIP email, address, IČO/DIČ/IČ DPH,
   licensing advice, social links, trust metrics, partner marinas, calculator pricing
   (skipper and hostess weekly rates, APA %) and hero imagery.
2. **Colours & fonts:** either
   - set runtime overrides in `SITE_CONFIG.theme`, e.g. `{ 'color-brass': '#C9A227' }`, or
   - change the tokens in `frontend/src/styles/_variables.scss`. Every token is exposed as a CSS custom property on `:root`.
3. **Fonts:** swap the Google Fonts link in `frontend/src/index.html`.
4. **Copy:** testimonials, trust pillars, booking steps and FAQ live in `frontend/src/app/core/data/content.ts`.
5. **Fleet & destinations:** manage them in the Django admin, or adapt `seed_data.py`.

## Project structure (frontend)

```
src/
├── styles/                 _variables · _mixins · _typography · _base · _layout · _components
├── environments/
└── app/
    ├── core/
    │   ├── config/site.config.ts    white-label configuration
    │   ├── data/content.ts          editorial copy
    │   ├── models/                  typed domain models & option lists
    │   ├── services/                API client (snake_case → camelCase), title strategy
    │   └── utils/                   EUR / Slovak plural formatting, validators
    ├── shared/
    │   ├── components/              navbar, footer, yacht-card, skeleton, cost calculator, icon
    │   └── pipes/                   eur, decimal, plural
    └── pages/                       home, fleet, yacht-detail, destinations, custom-charter, about-contact, not-found
```

## Notes

- Photography is loaded from Unsplash as illustrative placeholders. Gallery interiors are
  generic luxury interiors, not the specific vessels. Replace them with the operator's own photos in the admin.
- The agency name *Navalia Yachting*, contact details and company IDs are fictitious placeholders.
