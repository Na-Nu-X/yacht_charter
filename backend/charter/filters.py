import django_filters

from .models import Yacht


class YachtFilter(django_filters.FilterSet):
    destination = django_filters.CharFilter(field_name="destination__slug")
    yacht_type = django_filters.MultipleChoiceFilter(choices=Yacht.YachtType.choices)
    charter_type = django_filters.MultipleChoiceFilter(choices=Yacht.CharterType.choices)
    min_price = django_filters.NumberFilter(field_name="weekly_price_from", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="weekly_price_from", lookup_expr="lte")
    min_cabins = django_filters.NumberFilter(field_name="cabins", lookup_expr="gte")
    min_berths = django_filters.NumberFilter(field_name="berths", lookup_expr="gte")
    min_length = django_filters.NumberFilter(field_name="length_meters", lookup_expr="gte")
    min_year = django_filters.NumberFilter(field_name="build_year", lookup_expr="gte")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    badge = django_filters.MultipleChoiceFilter(choices=Yacht.Badge.choices)

    class Meta:
        model = Yacht
        fields = [
            "destination",
            "yacht_type",
            "charter_type",
            "min_price",
            "max_price",
            "min_cabins",
            "min_berths",
            "min_length",
            "min_year",
            "featured",
            "badge",
        ]
