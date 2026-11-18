from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify


def unique_slugify(instance: models.Model, value: str, slug_field: str = "slug") -> str:
    """Generate a slug from ``value`` that is unique for the instance's model."""
    base = slugify(value)[:200] or "item"
    slug = base
    model = type(instance)
    index = 2
    while model.objects.filter(**{slug_field: slug}).exclude(pk=instance.pk).exists():
        slug = f"{base}-{index}"
        index += 1
    return slug


class Destination(models.Model):
    name = models.CharField("Krajina a región", max_length=120)
    country = models.CharField("Krajina", max_length=80)
    region = models.CharField("Región", max_length=80)
    slug = models.SlugField("Slug (URL)", max_length=140, unique=True, blank=True)
    departure_marina = models.CharField("Hlavná východisková marína", max_length=160)
    best_season = models.CharField("Najlepšia sezóna", max_length=80, help_text="Napr. Máj – Október")
    cover_image_url = models.URLField("URL titulnej fotografie", max_length=500)
    short_description = models.CharField("Krátky popis", max_length=255, blank=True)
    description = models.TextField("Redakčný popis")
    highlights = models.JSONField(
        "Najkrajšie miesta",
        default=list,
        blank=True,
        help_text='Zoznam zátok, ostrovov a miest, napr. ["Hvar", "Vis", "Kornati"]',
    )
    is_featured = models.BooleanField("Zvýraznená na úvodnej stránke", default=False)
    display_order = models.PositiveIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Destinácia"
        verbose_name_plural = "Destinácie a maríny"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)


class Yacht(models.Model):
    class YachtType(models.TextChoices):
        SAILBOAT = "plachetnica", "Plachetnica"
        CATAMARAN = "katamaran", "Katamarán"
        MOTOR_YACHT = "motorova_jachta", "Motorová jachta"
        SUPERYACHT = "superjachta", "Luxusná jachta s posádkou"

    class CharterType(models.TextChoices):
        BAREBOAT = "bez_posadky", "Bez posádky (Bareboat)"
        SKIPPERED = "s_kapitanom", "S kapitánom"
        CREWED = "s_posadkou", "S kompletnou posádkou"

    class Badge(models.TextChoices):
        AVAILABLE = "dostupna", "Dostupná"
        LAST_DATES = "posledne_terminy", "Posledné termíny"
        NEW = "novinka", "Novinka vo flotile"
        BOOKED = "obsadena", "Obsadená"

    name = models.CharField("Názov a model", max_length=160, help_text='Napr. Lagoon 46 „Aura“')
    model_name = models.CharField("Model", max_length=120, blank=True)
    manufacturer = models.CharField("Výrobca / lodenica", max_length=120)
    yacht_type = models.CharField("Typ lode", max_length=20, choices=YachtType.choices)
    charter_type = models.CharField("Typ prenájmu", max_length=20, choices=CharterType.choices)
    destination = models.ForeignKey(
        Destination,
        verbose_name="Destinácia",
        related_name="yachts",
        on_delete=models.PROTECT,
    )
    home_marina = models.CharField("Domovská marína", max_length=160)
    slug = models.SlugField("Slug (URL)", max_length=180, unique=True, blank=True)

    weekly_price_from = models.DecimalField(
        "Cena od (€ / týždeň)", max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    security_deposit = models.DecimalField(
        "Vratná kaucia (€)", max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    transit_log_fee = models.DecimalField(
        "Transit log (€)", max_digits=8, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    length_meters = models.DecimalField("Dĺžka (m)", max_digits=5, decimal_places=2)
    beam_meters = models.DecimalField("Šírka (m)", max_digits=5, decimal_places=2)
    draft_meters = models.DecimalField("Ponor (m)", max_digits=4, decimal_places=2)
    build_year = models.PositiveIntegerField(
        "Rok výroby", validators=[MinValueValidator(1950), MaxValueValidator(2100)]
    )
    cabins = models.PositiveSmallIntegerField("Kajuty")
    berths = models.PositiveSmallIntegerField("Lôžka (max. kapacita)")
    bathrooms = models.PositiveSmallIntegerField("Kúpeľne")
    engine_power = models.CharField("Motor", max_length=80, help_text="Napr. 2 x 57 HP")
    equipment = models.JSONField(
        "Vybavenie na palube",
        default=list,
        blank=True,
        help_text='Zoznam vybavenia, napr. ["Klimatizácia", "Generátor", "Wi-Fi"]',
    )
    badge = models.CharField(
        "Dostupnosť", max_length=20, choices=Badge.choices, default=Badge.AVAILABLE
    )
    description = models.TextField("Popis")
    cover_image_url = models.URLField("URL titulnej fotografie", max_length=500)
    is_featured = models.BooleanField("Vybraná jachta (úvodná stránka)", default=False)
    created_at = models.DateTimeField("Vytvorené", auto_now_add=True)

    class Meta:
        verbose_name = "Jachta"
        verbose_name_plural = "Flotila jácht"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["yacht_type", "charter_type"]),
            models.Index(fields=["weekly_price_from"]),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)


class YachtImage(models.Model):
    yacht = models.ForeignKey(
        Yacht, verbose_name="Jachta", related_name="images", on_delete=models.CASCADE
    )
    image_url = models.URLField("URL fotografie", max_length=500)
    caption = models.CharField("Popis fotografie", max_length=160, blank=True)
    display_order = models.PositiveIntegerField("Poradie", default=0)

    class Meta:
        verbose_name = "Fotografia jachty"
        verbose_name_plural = "Galéria jachty"
        ordering = ["display_order", "id"]

    def __str__(self) -> str:
        return self.caption or f"Fotografia #{self.pk}"


class CharterInquiry(models.Model):
    yacht = models.ForeignKey(
        Yacht, verbose_name="Jachta", related_name="inquiries", on_delete=models.CASCADE
    )
    check_in_date = models.DateField("Nalodenie (sobota)")
    duration_weeks = models.PositiveSmallIntegerField(
        "Počet týždňov", default=1, validators=[MinValueValidator(1), MaxValueValidator(8)]
    )
    guests_count = models.PositiveSmallIntegerField(
        "Počet hostí", validators=[MinValueValidator(1), MaxValueValidator(40)]
    )
    skipper_needed = models.BooleanField("Požaduje kapitána", default=False)
    hostess_needed = models.BooleanField("Požaduje hostesku", default=False)
    client_name = models.CharField("Meno a priezvisko", max_length=120)
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefón", max_length=40)
    message = models.TextField("Správa", blank=True)
    is_processed = models.BooleanField("Vybavené", default=False)
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Dopyt na rezerváciu lode"
        verbose_name_plural = "Dopyty na rezerváciu lodí"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.client_name} – {self.yacht} ({self.check_in_date:%d.%m.%Y})"


class CustomItineraryRequest(models.Model):
    preferred_destination = models.CharField("Preferovaná destinácia", max_length=160)
    preferred_month = models.CharField("Preferovaný mesiac", max_length=40)
    yacht_type = models.CharField(
        "Typ lode", max_length=20, choices=Yacht.YachtType.choices, blank=True
    )
    charter_type = models.CharField(
        "Typ prenájmu", max_length=20, choices=Yacht.CharterType.choices, blank=True
    )
    guests_count = models.PositiveSmallIntegerField(
        "Počet hostí", validators=[MinValueValidator(1), MaxValueValidator(40)]
    )
    estimated_weekly_budget = models.CharField("Orientačný týždenný rozpočet", max_length=60)
    special_wishes = models.TextField("Špeciálne želania", blank=True)
    client_name = models.CharField("Meno a priezvisko", max_length=120)
    phone = models.CharField("Telefón", max_length=40)
    email = models.EmailField("E-mail")
    is_reviewed = models.BooleanField("Spracované", default=False)
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Plavba na mieru"
        verbose_name_plural = "Požiadavky na plavbu na mieru"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.client_name} – {self.preferred_destination} ({self.preferred_month})"


class ContactMessage(models.Model):
    """General message from the contact page (not tied to a specific yacht)."""

    client_name = models.CharField("Meno a priezvisko", max_length=120)
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefón", max_length=40, blank=True)
    subject = models.CharField("Predmet", max_length=160, blank=True)
    message = models.TextField("Správa")
    is_resolved = models.BooleanField("Vybavené", default=False)
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Správa z kontaktného formulára"
        verbose_name_plural = "Správy z kontaktného formulára"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.client_name} – {self.subject or 'Bez predmetu'}"
