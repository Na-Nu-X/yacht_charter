from django.db.models import Count, Min
from rest_framework import filters, mixins, viewsets
from rest_framework.throttling import ScopedRateThrottle
from django_filters.rest_framework import DjangoFilterBackend

from .filters import YachtFilter
from .models import CharterInquiry, ContactMessage, CustomItineraryRequest, Destination, Yacht
from .serializers import (
    CharterInquirySerializer,
    ContactMessageSerializer,
    CustomItineraryRequestSerializer,
    DestinationSerializer,
    YachtDetailSerializer,
    YachtListSerializer,
)


class DestinationViewSet(viewsets.ReadOnlyModelViewSet):
    """Sailing regions with the number of yachts based there."""

    serializer_class = DestinationSerializer
    lookup_field = "slug"
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_featured"]

    def get_queryset(self):
        return Destination.objects.annotate(
            yacht_count=Count("yachts", distinct=True),
            price_from=Min("yachts__weekly_price_from"),
        ).order_by("display_order", "name")


class YachtViewSet(viewsets.ReadOnlyModelViewSet):
    """Fleet catalogue with rich filtering, search and ordering."""

    lookup_field = "slug"
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = YachtFilter
    search_fields = [
        "name",
        "model_name",
        "manufacturer",
        "home_marina",
        "destination__name",
    ]
    ordering_fields = ["created_at", "weekly_price_from", "length_meters", "build_year", "cabins"]
    ordering = ["-is_featured", "-created_at"]

    def get_queryset(self):
        queryset = Yacht.objects.select_related("destination")
        if self.action == "retrieve":
            queryset = queryset.prefetch_related("images")
        return queryset

    def get_serializer_class(self):
        return YachtDetailSerializer if self.action == "retrieve" else YachtListSerializer


class SubmissionViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Write-only endpoint base: public may create, never list or read back."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "submissions"


class CharterInquiryViewSet(SubmissionViewSet):
    queryset = CharterInquiry.objects.all()
    serializer_class = CharterInquirySerializer


class CustomItineraryRequestViewSet(SubmissionViewSet):
    queryset = CustomItineraryRequest.objects.all()
    serializer_class = CustomItineraryRequestSerializer


class ContactMessageViewSet(SubmissionViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
