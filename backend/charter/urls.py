from rest_framework.routers import DefaultRouter

from .views import (
    CharterInquiryViewSet,
    ContactMessageViewSet,
    CustomItineraryRequestViewSet,
    DestinationViewSet,
    YachtViewSet,
)

router = DefaultRouter()
router.register("yachts", YachtViewSet, basename="yacht")
router.register("destinations", DestinationViewSet, basename="destination")
router.register("inquiries", CharterInquiryViewSet, basename="inquiry")
router.register("custom-charters", CustomItineraryRequestViewSet, basename="custom-charter")
router.register("contact", ContactMessageViewSet, basename="contact")

urlpatterns = router.urls
