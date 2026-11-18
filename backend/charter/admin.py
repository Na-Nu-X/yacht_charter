from django.contrib import admin, messages
from django.utils.html import format_html

from .models import (
    CharterInquiry,
    ContactMessage,
    CustomItineraryRequest,
    Destination,
    Yacht,
    YachtImage,
)


def thumbnail(url: str, height: int = 48):
    if not url:
        return "—"
    return format_html(
        '<img src="{}" alt="" style="height:{}px;width:auto;border-radius:4px;object-fit:cover" />',
        url,
        height,
    )


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ["preview", "name", "departure_marina", "best_season", "yacht_total", "is_featured", "display_order"]
    list_display_links = ["preview", "name"]
    list_editable = ["is_featured", "display_order"]
    list_filter = ["is_featured", "country"]
    search_fields = ["name", "country", "region", "departure_marina"]
    prepopulated_fields = {"slug": ("name",)}
    fieldsets = [
        (None, {"fields": ["name", "country", "region", "slug"]}),
        ("Plavebné informácie", {"fields": ["departure_marina", "best_season", "highlights"]}),
        ("Prezentácia", {"fields": ["cover_image_url", "short_description", "description", "is_featured", "display_order"]}),
    ]

    @admin.display(description="Foto")
    def preview(self, obj):
        return thumbnail(obj.cover_image_url)

    @admin.display(description="Počet jácht")
    def yacht_total(self, obj):
        return obj.yachts.count()


class YachtImageInline(admin.TabularInline):
    model = YachtImage
    extra = 1
    fields = ["preview", "image_url", "caption", "display_order"]
    readonly_fields = ["preview"]

    @admin.display(description="Náhľad")
    def preview(self, obj):
        return thumbnail(obj.image_url, 40)


@admin.action(description="Označiť ako „Dostupná“")
def mark_available(modeladmin, request, queryset):
    updated = queryset.update(badge=Yacht.Badge.AVAILABLE)
    modeladmin.message_user(request, f"Aktualizované jachty: {updated}.", messages.SUCCESS)


@admin.action(description="Označiť ako „Posledné termíny“")
def mark_last_dates(modeladmin, request, queryset):
    updated = queryset.update(badge=Yacht.Badge.LAST_DATES)
    modeladmin.message_user(request, f"Aktualizované jachty: {updated}.", messages.SUCCESS)


@admin.action(description="Označiť ako „Obsadená“")
def mark_booked(modeladmin, request, queryset):
    updated = queryset.update(badge=Yacht.Badge.BOOKED)
    modeladmin.message_user(request, f"Aktualizované jachty: {updated}.", messages.SUCCESS)


@admin.register(Yacht)
class YachtAdmin(admin.ModelAdmin):
    list_display = [
        "preview",
        "name",
        "yacht_type",
        "charter_type",
        "destination",
        "length_meters",
        "cabins",
        "weekly_price_from",
        "badge",
        "is_featured",
    ]
    list_display_links = ["preview", "name"]
    list_editable = ["weekly_price_from", "badge", "is_featured"]
    list_filter = ["yacht_type", "charter_type", "badge", "destination", "is_featured"]
    search_fields = ["name", "model_name", "manufacturer", "home_marina"]
    prepopulated_fields = {"slug": ("name",)}
    list_select_related = ["destination"]
    actions = [mark_available, mark_last_dates, mark_booked]
    inlines = [YachtImageInline]
    save_on_top = True
    fieldsets = [
        ("Základné údaje", {"fields": ["name", "model_name", "manufacturer", "slug", "yacht_type", "charter_type"]}),
        ("Lokalita", {"fields": ["destination", "home_marina"]}),
        ("Sezónne ceny a poplatky", {"fields": ["weekly_price_from", "security_deposit", "transit_log_fee"]}),
        (
            "Technické parametre",
            {
                "fields": [
                    ("length_meters", "beam_meters", "draft_meters"),
                    ("build_year", "engine_power"),
                    ("cabins", "berths", "bathrooms"),
                    "equipment",
                ]
            },
        ),
        ("Prezentácia a dostupnosť", {"fields": ["badge", "is_featured", "cover_image_url", "description"]}),
    ]

    @admin.display(description="Foto")
    def preview(self, obj):
        return thumbnail(obj.cover_image_url)


class ProcessedFilterMixin:
    date_hierarchy = "created_at"
    readonly_fields = ["created_at"]


@admin.action(description="Označiť ako vybavené")
def mark_processed(modeladmin, request, queryset):
    queryset.update(is_processed=True)


@admin.register(CharterInquiry)
class CharterInquiryAdmin(ProcessedFilterMixin, admin.ModelAdmin):
    list_display = [
        "client_name",
        "yacht",
        "check_in_date",
        "duration_weeks",
        "guests_count",
        "skipper_needed",
        "hostess_needed",
        "phone",
        "email",
        "is_processed",
        "created_at",
    ]
    list_editable = ["is_processed"]
    list_filter = ["is_processed", "skipper_needed", "hostess_needed", "yacht__destination"]
    search_fields = ["client_name", "email", "phone", "yacht__name"]
    autocomplete_fields = ["yacht"]
    actions = [mark_processed]


@admin.action(description="Označiť ako spracované")
def mark_reviewed(modeladmin, request, queryset):
    queryset.update(is_reviewed=True)


@admin.register(CustomItineraryRequest)
class CustomItineraryRequestAdmin(ProcessedFilterMixin, admin.ModelAdmin):
    list_display = [
        "client_name",
        "preferred_destination",
        "preferred_month",
        "yacht_type",
        "charter_type",
        "guests_count",
        "estimated_weekly_budget",
        "phone",
        "is_reviewed",
        "created_at",
    ]
    list_editable = ["is_reviewed"]
    list_filter = ["is_reviewed", "yacht_type", "charter_type"]
    search_fields = ["client_name", "email", "phone", "preferred_destination"]
    actions = [mark_reviewed]


@admin.action(description="Označiť ako vybavené")
def mark_resolved(modeladmin, request, queryset):
    queryset.update(is_resolved=True)


@admin.register(ContactMessage)
class ContactMessageAdmin(ProcessedFilterMixin, admin.ModelAdmin):
    list_display = ["client_name", "subject", "email", "phone", "is_resolved", "created_at"]
    list_editable = ["is_resolved"]
    list_filter = ["is_resolved"]
    search_fields = ["client_name", "email", "subject", "message"]
    actions = [mark_resolved]
