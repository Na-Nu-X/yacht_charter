import datetime

from django.utils import timezone
from rest_framework import serializers

from .models import (
    CharterInquiry,
    ContactMessage,
    CustomItineraryRequest,
    Destination,
    Yacht,
    YachtImage,
)

PHONE_ALLOWED = set("0123456789+()-/ ")


def validate_phone_number(value: str) -> str:
    value = value.strip()
    digits = sum(ch.isdigit() for ch in value)
    if not value or any(ch not in PHONE_ALLOWED for ch in value) or digits < 9:
        raise serializers.ValidationError(
            "Zadajte platné telefónne číslo (napr. +421 900 123 456)."
        )
    return value


def validate_person_name(value: str) -> str:
    value = value.strip()
    if len(value) < 3:
        raise serializers.ValidationError("Zadajte prosím svoje meno a priezvisko.")
    return value


class DestinationSerializer(serializers.ModelSerializer):
    yacht_count = serializers.IntegerField(read_only=True)
    price_from = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, allow_null=True
    )

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "country",
            "region",
            "slug",
            "departure_marina",
            "best_season",
            "cover_image_url",
            "short_description",
            "description",
            "highlights",
            "is_featured",
            "display_order",
            "yacht_count",
            "price_from",
        ]


class DestinationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ["id", "name", "country", "region", "slug", "departure_marina", "best_season"]


class YachtImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = YachtImage
        fields = ["id", "image_url", "caption", "display_order"]


class YachtListSerializer(serializers.ModelSerializer):
    destination = DestinationSummarySerializer(read_only=True)
    yacht_type_display = serializers.CharField(source="get_yacht_type_display", read_only=True)
    charter_type_display = serializers.CharField(source="get_charter_type_display", read_only=True)
    badge_display = serializers.CharField(source="get_badge_display", read_only=True)

    class Meta:
        model = Yacht
        fields = [
            "id",
            "name",
            "model_name",
            "manufacturer",
            "slug",
            "yacht_type",
            "yacht_type_display",
            "charter_type",
            "charter_type_display",
            "destination",
            "home_marina",
            "weekly_price_from",
            "length_meters",
            "build_year",
            "cabins",
            "berths",
            "badge",
            "badge_display",
            "cover_image_url",
            "is_featured",
            "created_at",
        ]


class YachtDetailSerializer(YachtListSerializer):
    destination = DestinationSerializer(read_only=True)
    images = YachtImageSerializer(many=True, read_only=True)

    class Meta(YachtListSerializer.Meta):
        fields = YachtListSerializer.Meta.fields + [
            "security_deposit",
            "transit_log_fee",
            "beam_meters",
            "draft_meters",
            "bathrooms",
            "engine_power",
            "equipment",
            "description",
            "images",
        ]


class CharterInquirySerializer(serializers.ModelSerializer):
    yacht = serializers.SlugRelatedField(slug_field="slug", queryset=Yacht.objects.all())

    class Meta:
        model = CharterInquiry
        fields = [
            "id",
            "yacht",
            "check_in_date",
            "duration_weeks",
            "guests_count",
            "skipper_needed",
            "hostess_needed",
            "client_name",
            "email",
            "phone",
            "message",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "yacht": {"error_messages": {"does_not_exist": "Vybraná jachta neexistuje."}},
        }

    def validate_check_in_date(self, value: datetime.date) -> datetime.date:
        today = timezone.localdate()
        if value <= today:
            raise serializers.ValidationError("Termín nalodenia musí byť v budúcnosti.")
        if value.weekday() != 5:
            raise serializers.ValidationError(
                "Charterové týždne začínajú v sobotu – vyberte prosím sobotu."
            )
        if value > today + datetime.timedelta(days=730):
            raise serializers.ValidationError("Rezervácie prijímame maximálne 2 roky vopred.")
        return value

    def validate_client_name(self, value: str) -> str:
        return validate_person_name(value)

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value)

    def validate(self, attrs):
        yacht: Yacht = attrs["yacht"]
        if attrs["guests_count"] > yacht.berths:
            raise serializers.ValidationError(
                {
                    "guests_count": (
                        f"Jachta {yacht.name} má kapacitu maximálne {yacht.berths} osôb."
                    )
                }
            )
        if yacht.badge == Yacht.Badge.BOOKED:
            raise serializers.ValidationError(
                {"yacht": "Táto jachta je v aktuálnej sezóne obsadená. Vyberte inú loď."}
            )
        return attrs


class CustomItineraryRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomItineraryRequest
        fields = [
            "id",
            "preferred_destination",
            "preferred_month",
            "yacht_type",
            "charter_type",
            "guests_count",
            "estimated_weekly_budget",
            "special_wishes",
            "client_name",
            "phone",
            "email",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_client_name(self, value: str) -> str:
        return validate_person_name(value)

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value)


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "client_name", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_client_name(self, value: str) -> str:
        return validate_person_name(value)

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value) if value.strip() else ""

    def validate_message(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Správa je príliš krátka (min. 10 znakov).")
        return value
