import datetime

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import CharterInquiry, CustomItineraryRequest, Yacht


def next_saturday(weeks_ahead: int = 2) -> datetime.date:
    today = timezone.localdate()
    days = (5 - today.weekday()) % 7 or 7
    return today + datetime.timedelta(days=days + 7 * (weeks_ahead - 1))


class CharterApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_data", stdout=open("/dev/null", "w"))

    def setUp(self):
        self.client = APIClient()

    def test_seed_is_idempotent(self):
        call_command("seed_data", stdout=open("/dev/null", "w"))
        self.assertEqual(Yacht.objects.count(), 13)

    def test_yacht_list_and_filters(self):
        response = self.client.get("/api/yachts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 13)

        response = self.client.get("/api/yachts/", {"yacht_type": "katamaran"})
        self.assertTrue(all(y["yacht_type"] == "katamaran" for y in response.json()))

        response = self.client.get(
            "/api/yachts/", {"destination": "chorvatsko-dalmacia", "max_price": 10000}
        )
        data = response.json()
        self.assertTrue(data)
        self.assertTrue(all(float(y["weekly_price_from"]) <= 10000 for y in data))

        response = self.client.get("/api/yachts/", {"min_cabins": 5, "min_length": 15})
        self.assertTrue(all(y["cabins"] >= 5 for y in response.json()))

        response = self.client.get("/api/yachts/", {"search": "Trogir"})
        self.assertEqual([y["slug"] for y in response.json()], ["beneteau-oceanis-51-1-galeb"])

        response = self.client.get("/api/yachts/", {"ordering": "weekly_price_from"})
        prices = [float(y["weekly_price_from"]) for y in response.json()]
        self.assertEqual(prices, sorted(prices))

    def test_yacht_detail(self):
        response = self.client.get("/api/yachts/lagoon-46-aura/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data["images"]), 3)
        self.assertEqual(data["destination"]["slug"], "chorvatsko-dalmacia")
        self.assertIn("equipment", data)

    def test_destinations_include_counts(self):
        data = self.client.get("/api/destinations/").json()
        self.assertEqual(len(data), 5)
        self.assertTrue(all(d["yacht_count"] > 0 for d in data))

    def test_inquiry_valid(self):
        payload = {
            "yacht": "lagoon-46-aura",
            "check_in_date": next_saturday().isoformat(),
            "duration_weeks": 1,
            "guests_count": 8,
            "skipper_needed": True,
            "hostess_needed": False,
            "client_name": "Ján Novák",
            "email": "jan@example.com",
            "phone": "+421 900 123 456",
            "message": "Máme záujem o júl.",
        }
        response = self.client.post("/api/inquiries/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(CharterInquiry.objects.count(), 1)

    def test_inquiry_validation(self):
        not_saturday = next_saturday() + datetime.timedelta(days=1)
        payload = {
            "yacht": "lagoon-46-aura",
            "check_in_date": not_saturday.isoformat(),
            "guests_count": 30,
            "client_name": "J",
            "email": "nie-je-email",
            "phone": "abc",
        }
        response = self.client.post("/api/inquiries/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        errors = response.json()
        for field in ("check_in_date", "client_name", "email", "phone"):
            self.assertIn(field, errors)

    def test_inquiry_respects_capacity(self):
        payload = {
            "yacht": "fairline-targa-45-gt-mykonos-blue",
            "check_in_date": next_saturday().isoformat(),
            "guests_count": 9,
            "client_name": "Ján Novák",
            "email": "jan@example.com",
            "phone": "+421 900 123 456",
        }
        response = self.client.post("/api/inquiries/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("guests_count", response.json())

    def test_custom_charter(self):
        payload = {
            "preferred_destination": "Grécko – Kyklady",
            "preferred_month": "Júl 2027",
            "yacht_type": "katamaran",
            "charter_type": "s_kapitanom",
            "guests_count": 8,
            "estimated_weekly_budget": "10 000 – 20 000 €",
            "special_wishes": "Rodinná dovolenka",
            "client_name": "Eva Kováčová",
            "phone": "+421 905 111 222",
            "email": "eva@example.com",
        }
        response = self.client.post("/api/custom-charters/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(CustomItineraryRequest.objects.count(), 1)

    def test_submissions_are_write_only(self):
        self.assertEqual(self.client.get("/api/inquiries/").status_code, 405)
        self.assertEqual(self.client.get("/api/custom-charters/").status_code, 405)
