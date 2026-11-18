"""
Idempotent demo data for the yacht charter catalogue.

Usage:
    python manage.py seed_data            # create or update destinations & yachts
    python manage.py seed_data --flush    # also delete yachts/destinations not in the seed

Running the command repeatedly never creates duplicates: records are matched by
slug and updated in place, and each yacht's gallery is rebuilt from the seed.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from charter.models import Destination, Yacht, YachtImage


def img(photo_id: str, width: int = 1600) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=80"


# --- Shared gallery imagery -------------------------------------------------
SALON = [
    img("1600210492486-724fe5c67fb0"),
    img("1567767292278-a4f21aa2d36e"),
    img("1600607687939-ce8a6c25118c"),
]
CABIN = [
    img("1559599238-308793637427"),
    img("1590490360182-c33d57733427"),
    img("1618773928121-c32242e63f39"),
    img("1631049307264-da0ec9d70304"),
    img("1582719478250-c89cae4dc85b"),
]
BATHROOM = [img("1584622650111-993a426fbf0a"), img("1552321554-5fefe8c9ef14")]
DECK = [
    img("1586611292717-f828b167408c"),
    img("1584132967334-10e028bd69f7"),
    img("1602002418082-a4443e081dd1"),
]
SEA = [
    img("1505118380757-91f5f5632de0"),
    img("1513553404607-988bf2703777"),
    img("1507090960745-b32f65d3113a"),
]
TENDER = img("1593351415075-3bac9f45c877")
SUNSET_SAIL = img("1534447677768-be436bb09401")


DESTINATIONS = [
    {
        "slug": "chorvatsko-dalmacia",
        "name": "Chorvátsko – Dalmácia",
        "country": "Chorvátsko",
        "region": "Dalmácia",
        "departure_marina": "Marina Kaštela, Split",
        "best_season": "Máj – Október",
        "cover_image_url": img("1555990793-da11153b2473", 2000),
        "short_description": "Tisícka ostrovov, kamenné prístavy a najkratšia cesta zo Slovenska k moru.",
        "description": (
            "Dalmácia je pre slovenských jachtárov srdcovou destináciou – len pár hodín autom "
            "a ocitnete sa medzi viac ako tisíckou ostrovov, ostrovčekov a útesov. Krátke "
            "vzdialenosti medzi prístavmi, spoľahlivý maestral v popoludňajších hodinách a "
            "hustá sieť marín robia z Chorvátska ideálne miesto pre prvú plavbu aj pre skúsených "
            "skiperov. Ráno zakotvíte v tichej zátoke na Šolte, obed si dáte v konobe na Visu "
            "a večer pristanete pod hradbami Hvaru."
        ),
        "highlights": ["Hvar a Pakleni otoci", "Vis a Modrá jaskyňa", "Národný park Kornati", "Korčula", "Dubrovník"],
        "is_featured": True,
        "display_order": 1,
    },
    {
        "slug": "grecko-kyklady",
        "name": "Grécko – Kyklady",
        "country": "Grécko",
        "region": "Kyklady",
        "departure_marina": "Marina Alimos, Atény",
        "best_season": "Jún – September",
        "cover_image_url": img("1563789031959-4c02bcb41319", 2000),
        "short_description": "Biele dedinky, modré kupoly a vietor meltemi pre skúsených jachtárov.",
        "description": (
            "Kyklady sú ikonou Egejského mora – bielené domčeky na útesoch, veterné mlyny a "
            "tyrkysové zátoky, do ktorých sa dá doplávať len loďou. Letný vietor meltemi prináša "
            "skvelé podmienky na plachtenie, no vyžaduje skúsenosti, preto na Kykladách "
            "odporúčame plavbu s kapitánom. Odmenou sú nezabudnuteľné západy slnka na Santorini, "
            "nočný život Mykonosu a pokojné ostrovy ako Koufonisia či Milos."
        ),
        "highlights": ["Santorini", "Milos a Kleftiko", "Mykonos", "Paros a Antiparos", "Koufonisia"],
        "is_featured": True,
        "display_order": 2,
    },
    {
        "slug": "taliansko-amalfi-sardinia",
        "name": "Taliansko – Amalfi & Sardínia",
        "country": "Taliansko",
        "region": "Amalfi & Sardínia",
        "departure_marina": "Marina di Portisco, Sardínia",
        "best_season": "Máj – Október",
        "cover_image_url": img("1516483638261-f4dbaf036963", 2000),
        "short_description": "Dolce vita na palube – Costa Smeralda, Capri a pobrežie Amalfi.",
        "description": (
            "Talianske pobrežie spája svetovú gastronómiu, glamour a dych berúcu prírodu. Na "
            "severe Sardínie čaká súostrovie La Maddalena s vodou farby karibskej lagúny a "
            "luxusné prístavy Costa Smeralda. Na juhu pevniny sa zase plavíte popod farebné "
            "mestečká Positano a Amalfi s výletom na Capri. Ideálna destinácia pre motorové "
            "jachty a plavby s kompletnou posádkou."
        ),
        "highlights": ["Súostrovie La Maddalena", "Porto Cervo", "Capri", "Positano", "Bonifácka úžina"],
        "is_featured": True,
        "display_order": 3,
    },
    {
        "slug": "spanielsko-baleary",
        "name": "Španielsko – Baleáry",
        "country": "Španielsko",
        "region": "Baleárske ostrovy",
        "departure_marina": "Club de Mar, Palma de Mallorca",
        "best_season": "Apríl – Október",
        "cover_image_url": img("1512753360435-329c4535a9a7", 2000),
        "short_description": "Skryté calas Mallorky, tyrkysová Formentera a západy slnka na Ibize.",
        "description": (
            "Baleárske ostrovy ponúkajú to najlepšie zo Stredomoria na malom priestore. Z Palmy "
            "sa za pár hodín dostanete do skrytých zátok – calas – s krištáľovo čistou vodou, "
            "na Ibize zažijete legendárne západy slnka a Formentera vás prekvapí plážami ako z "
            "Karibiku. Dlhá sezóna od apríla do októbra a stabilné počasie z nich robia "
            "obľúbenú voľbu pre rodiny aj firemné plavby."
        ),
        "highlights": ["Cala Mondragó", "Formentera – Ses Illetes", "Ibiza", "Cabrera", "Menorca"],
        "is_featured": True,
        "display_order": 4,
    },
    {
        "slug": "karibik-bvi",
        "name": "Karibik – BVI",
        "country": "Britské Panenské ostrovy",
        "region": "Karibik",
        "departure_marina": "Nanny Cay Marina, Tortola",
        "best_season": "December – Apríl",
        "cover_image_url": img("1437719417032-8595fd9e9dc6", 2000),
        "short_description": "Zimná plavba pod palmami – pasáty, korálové útesy a bóje v každej zátoke.",
        "description": (
            "Britské Panenské ostrovy sú jachtárskym rajom na zimné mesiace. Ostrovy sú "
            "na dohľad jeden od druhého, stále pasáty fúkajú spoľahlivo a v zátokách nájdete "
            "pripravené bóje. Šnorchlovanie pri The Baths na Virgin Gorda, rumový punč v "
            "Soggy Dollar Bar na Jost Van Dyke a nočné kotvenie pod hviezdami – to je "
            "Karibik, ako ho poznajú jachtári."
        ),
        "highlights": ["The Baths, Virgin Gorda", "Jost Van Dyke", "Anegada", "Norman Island", "Cooper Island"],
        "is_featured": True,
        "display_order": 5,
    },
]


def gallery(cover: str, *extra: tuple[str, str]) -> list[tuple[str, str]]:
    return [(cover, "Exteriér na kotve"), *extra]


YACHTS = [
    {
        "slug": "lagoon-46-aura",
        "name": "Lagoon 46 „Aura“",
        "model_name": "Lagoon 46",
        "manufacturer": "Lagoon (CNB)",
        "yacht_type": Yacht.YachtType.CATAMARAN,
        "charter_type": Yacht.CharterType.SKIPPERED,
        "destination": "chorvatsko-dalmacia",
        "home_marina": "Marina Kaštela, Split",
        "weekly_price_from": "6900",
        "security_deposit": "3500",
        "transit_log_fee": "320",
        "length_meters": "13.96",
        "beam_meters": "7.96",
        "draft_meters": "1.35",
        "build_year": 2024,
        "cabins": 4,
        "berths": 10,
        "bathrooms": 4,
        "engine_power": "2 x 57 HP",
        "equipment": ["Klimatizácia", "Generátor", "Odsoľovač vody", "Dinghy čln s motorom", "Wi-Fi", "Paddleboard", "Solárne panely", "Elektrické WC"],
        "badge": Yacht.Badge.NEW,
        "is_featured": True,
        "cover_image_url": img("1504681869696-d977211a5f4c"),
        "description": (
            "Lagoon 46 „Aura“ je najnovší prírastok našej dalmatínskej flotily – katamarán, "
            "ktorý spája stabilitu dvoch trupov s veľkorysým priestorom moderného bytu. Prestavaný "
            "flybridge s ležadlami a druhým kormidlom ponúka panoramatický výhľad na ostrovy, "
            "kokpit s veľkým jedálenským stolom pohodlne usadí desať hostí. Štyri dvojlôžkové "
            "kajuty s vlastnou kúpeľňou zaručia súkromie aj pre dve rodiny. Loď sa prenajíma s "
            "certifikovaným kapitánom, ktorý pozná každú zátoku od Šolty po Lastovo."
        ),
        "images": gallery(
            img("1504681869696-d977211a5f4c"),
            (DECK[0], "Flybridge s ležadlami"),
            (SALON[0], "Priestranný salón"),
            (CABIN[0], "Majiteľská kajuta"),
            (BATHROOM[0], "Kúpeľňa so sprchou"),
        ),
    },
    {
        "slug": "beneteau-oceanis-51-1-galeb",
        "name": "Beneteau Oceanis 51.1 „Galeb“",
        "model_name": "Oceanis 51.1",
        "manufacturer": "Beneteau",
        "yacht_type": Yacht.YachtType.SAILBOAT,
        "charter_type": Yacht.CharterType.BAREBOAT,
        "destination": "chorvatsko-dalmacia",
        "home_marina": "ACI Marina Trogir",
        "weekly_price_from": "3900",
        "security_deposit": "3000",
        "transit_log_fee": "260",
        "length_meters": "15.94",
        "beam_meters": "4.80",
        "draft_meters": "2.25",
        "build_year": 2022,
        "cabins": 5,
        "berths": 12,
        "bathrooms": 3,
        "engine_power": "1 x 80 HP",
        "equipment": ["Bow thruster", "Dinghy čln s motorom", "Teaková paluba", "Autopilot", "Chartplotter v kokpite", "Bimini a sprayhood", "Lazy bag", "Wi-Fi"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": True,
        "cover_image_url": img("1540946485063-a40da27545f8"),
        "description": (
            "Oceanis 51.1 „Galeb“ je rýchla a bezpečná plachetnica pre partie priateľov, ktoré "
            "chcú naozaj plachtiť. Dve kormidlá, ovládanie lán z kokpitu a bow thruster uľahčia "
            "manévrovanie aj v preplnených marínach. Päť kajút pre 12 osôb, teaková paluba a "
            "sklopná kúpacia plošina robia z Galeba obľúbenú voľbu pre bareboat charter – "
            "stačí platný kapitánsky preukaz a VHF licencia."
        ),
        "images": gallery(
            img("1540946485063-a40da27545f8"),
            (SUNSET_SAIL, "Plavba pri západe slnka"),
            (SALON[1], "Salón s navigačným stolom"),
            (CABIN[1], "Predná kajuta"),
            (SEA[0], "Kotvenie v zátoke"),
        ),
    },
    {
        "slug": "gulet-dalmatinka",
        "name": "Gulet „Dalmatinka“",
        "model_name": "Tradičný gulet 32 m",
        "manufacturer": "Lodenica Brodosplit (refit 2023)",
        "yacht_type": Yacht.YachtType.SUPERYACHT,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "chorvatsko-dalmacia",
        "home_marina": "Gradska luka, Split",
        "weekly_price_from": "14500",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "32.00",
        "beam_meters": "7.40",
        "draft_meters": "3.10",
        "build_year": 2008,
        "cabins": 6,
        "berths": 12,
        "bathrooms": 6,
        "engine_power": "1 x 640 HP",
        "equipment": ["Klimatizácia", "Generátor", "Odsoľovač vody", "Dinghy čln s motorom", "Wi-Fi", "Paddleboard", "Šnorchlovacia výbava", "Kajaky", "Kuchár na palube"],
        "badge": Yacht.Badge.LAST_DATES,
        "is_featured": False,
        "cover_image_url": img("1563296291-14f26f10c20f"),
        "description": (
            "Klasický drevený gulet s plachtami na dvoch sťažňoch, ktorý prešiel v roku 2023 "
            "kompletným refitom. Šesť klimatizovaných kajút s vlastnou kúpeľňou, obrovská "
            "zadná paluba s lounge zónou a štvorčlenná posádka vrátane kuchára, ktorý pripravuje "
            "dalmatínske špeciality z čerstvých rýb. Ideálne na rodinné oslavy, výročia "
            "a firemné plavby, pri ktorých sa o nič nemusíte starať."
        ),
        "images": gallery(
            img("1563296291-14f26f10c20f"),
            (DECK[1], "Zadná paluba s lounge zónou"),
            (CABIN[2], "Dvojlôžková kajuta"),
            (SALON[2], "Interiérový salón"),
            (SEA[1], "Kúpanie z paluby"),
        ),
    },
    {
        "slug": "fountaine-pajot-elba-45-thalassa",
        "name": "Fountaine Pajot Elba 45 „Thalassa“",
        "model_name": "Elba 45",
        "manufacturer": "Fountaine Pajot",
        "yacht_type": Yacht.YachtType.CATAMARAN,
        "charter_type": Yacht.CharterType.SKIPPERED,
        "destination": "grecko-kyklady",
        "home_marina": "Marina Alimos, Atény",
        "weekly_price_from": "5900",
        "security_deposit": "3000",
        "transit_log_fee": "290",
        "length_meters": "13.45",
        "beam_meters": "7.32",
        "draft_meters": "1.30",
        "build_year": 2023,
        "cabins": 4,
        "berths": 10,
        "bathrooms": 4,
        "engine_power": "2 x 45 HP",
        "equipment": ["Klimatizácia", "Generátor", "Odsoľovač vody", "Dinghy čln s motorom", "Wi-Fi", "Solárne panely", "Flybridge s bimini"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": True,
        "cover_image_url": img("1534008897995-27a23e859048"),
        "description": (
            "Elba 45 „Thalassa“ bola navrhnutá pre teplé moria – svetlý salón prepojený s "
            "kokpitom, priestranná predná paluba na opaľovanie a flybridge s výhľadom do všetkých "
            "strán. Na Kykladách, kde vie meltemi poriadne zafúkať, oceníte jej stabilitu a "
            "skúseného gréckeho kapitána, ktorý vás zavezie do zátok na Milose a Antiparose, "
            "kam sa iné lode nedostanú."
        ),
        "images": gallery(
            img("1534008897995-27a23e859048"),
            (DECK[2], "Výhľad zo salóna"),
            (CABIN[3], "Hosťovská kajuta"),
            (BATHROOM[1], "Kúpeľňa"),
            (SEA[2], "Egejské more"),
        ),
    },
    {
        "slug": "jeanneau-sun-odyssey-490-meltemi",
        "name": "Jeanneau Sun Odyssey 490 „Meltemi“",
        "model_name": "Sun Odyssey 490",
        "manufacturer": "Jeanneau",
        "yacht_type": Yacht.YachtType.SAILBOAT,
        "charter_type": Yacht.CharterType.BAREBOAT,
        "destination": "grecko-kyklady",
        "home_marina": "Marina Lavrio",
        "weekly_price_from": "3600",
        "security_deposit": "2500",
        "transit_log_fee": "240",
        "length_meters": "14.99",
        "beam_meters": "4.49",
        "draft_meters": "2.20",
        "build_year": 2021,
        "cabins": 4,
        "berths": 10,
        "bathrooms": 2,
        "engine_power": "1 x 57 HP",
        "equipment": ["Bow thruster", "Autopilot", "Teaková paluba", "Dinghy čln s motorom", "Chartplotter v kokpite", "Bimini a sprayhood"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": False,
        "cover_image_url": SUNSET_SAIL,
        "description": (
            "Sun Odyssey 490 je dielom dizajnéra Philippa Briand a patrí k najobľúbenejším "
            "charterovým plachetniciam vôbec. Unikátne šikmé bočné paluby uľahčujú pohyb po lodi, "
            "kokpit je široký a chránený. „Meltemi“ je pripravená pre skúsených skiperov, ktorí "
            "si chcú užiť silný egejský vietor a ostrovy južných Kyklád."
        ),
        "images": gallery(
            SUNSET_SAIL,
            (SALON[0], "Salón"),
            (CABIN[4], "Zadná kajuta"),
            (SEA[0], "Pohľad z paluby"),
        ),
    },
    {
        "slug": "fairline-targa-45-gt-mykonos-blue",
        "name": "Fairline Targa 45 GT „Mykonos Blue“",
        "model_name": "Targa 45 GT",
        "manufacturer": "Fairline Yachts",
        "yacht_type": Yacht.YachtType.MOTOR_YACHT,
        "charter_type": Yacht.CharterType.SKIPPERED,
        "destination": "grecko-kyklady",
        "home_marina": "Mykonos New Port",
        "weekly_price_from": "11800",
        "security_deposit": "8000",
        "transit_log_fee": "350",
        "length_meters": "14.20",
        "beam_meters": "4.12",
        "draft_meters": "1.10",
        "build_year": 2023,
        "cabins": 2,
        "berths": 4,
        "bathrooms": 2,
        "engine_power": "2 x 435 HP Volvo IPS",
        "equipment": ["Klimatizácia", "Generátor", "Hydraulická plošina", "Bose audio systém", "Wi-Fi", "Paddleboard", "Šnorchlovacia výbava"],
        "badge": Yacht.Badge.NEW,
        "is_featured": False,
        "cover_image_url": img("1520255870062-bd79d3865de7"),
        "description": (
            "Športová motorová jachta pre páry a malé skupiny, ktoré chcú za týždeň vidieť čo "
            "najviac ostrovov. Cestovná rýchlosť 30 uzlov, otváracia strecha nad kokpitom a "
            "dve elegantné kajuty. Z Mykonosu ste na Delose za dvadsať minút a na Paros za hodinu."
        ),
        "images": gallery(
            img("1520255870062-bd79d3865de7"),
            (TENDER, "Plavba rýchlosťou 30 uzlov"),
            (CABIN[1], "Majiteľská kajuta"),
            (SALON[2], "Salón"),
        ),
    },
    {
        "slug": "sunseeker-predator-65-azzurra",
        "name": "Sunseeker Predator 65 „Azzurra“",
        "model_name": "Predator 65",
        "manufacturer": "Sunseeker International",
        "yacht_type": Yacht.YachtType.MOTOR_YACHT,
        "charter_type": Yacht.CharterType.SKIPPERED,
        "destination": "taliansko-amalfi-sardinia",
        "home_marina": "Marina di Stabia, Neapolský záliv",
        "weekly_price_from": "24000",
        "security_deposit": "15000",
        "transit_log_fee": "450",
        "length_meters": "20.40",
        "beam_meters": "5.10",
        "draft_meters": "1.55",
        "build_year": 2022,
        "cabins": 3,
        "berths": 6,
        "bathrooms": 3,
        "engine_power": "2 x 1 200 HP MAN",
        "equipment": ["Klimatizácia", "Generátor", "Stabilizátory Seakeeper", "Hydraulická plošina", "Jet ski", "Wi-Fi", "Teaková paluba", "Podvodné osvetlenie"],
        "badge": Yacht.Badge.LAST_DATES,
        "is_featured": True,
        "cover_image_url": img("1605281317010-fe5ffe798166"),
        "description": (
            "Britská elegancia a talianske pobrežie – Predator 65 „Azzurra“ je stvorená na "
            "plavby Amalfi, Capri a Ischia. Športové línie, panoramatický posuvný strop a "
            "stabilizátory Seakeeper, vďaka ktorým je kotvenie príjemné aj pri vlnách. Na palube "
            "čaká jet ski pre výlety k jaskyniam Capri."
        ),
        "images": gallery(
            img("1605281317010-fe5ffe798166"),
            (DECK[0], "Slnečná paluba"),
            (SALON[1], "Salón s panoramatickými oknami"),
            (CABIN[2], "VIP kajuta"),
            (BATHROOM[0], "Kúpeľňa majiteľskej kajuty"),
        ),
    },
    {
        "slug": "azimut-68-costa-smeralda",
        "name": "Azimut 68 „Costa Smeralda“",
        "model_name": "Azimut 68 Fly",
        "manufacturer": "Azimut Yachts",
        "yacht_type": Yacht.YachtType.MOTOR_YACHT,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "taliansko-amalfi-sardinia",
        "home_marina": "Marina di Portisco, Sardínia",
        "weekly_price_from": "32000",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "21.20",
        "beam_meters": "5.28",
        "draft_meters": "1.70",
        "build_year": 2021,
        "cabins": 4,
        "berths": 8,
        "bathrooms": 4,
        "engine_power": "2 x 1 150 HP MAN",
        "equipment": ["Klimatizácia", "Generátor", "Flybridge s barom", "Stabilizátory Seakeeper", "Dinghy čln s motorom", "Seabob", "Wi-Fi", "Paddleboard"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": True,
        "cover_image_url": img("1528154291023-a6525fabe5b4"),
        "description": (
            "Azimut 68 Fly kotví v srdci Costa Smeraldy a je pripravená na týždeň medzi "
            "ostrovmi La Maddalena a Korzikou. Trojčlenná posádka – kapitán, stevardka a "
            "námorník – sa postará o všetko od aperitivo na flybridge po večeru v Porto Cervo. "
            "Štyri kajuty vrátane majiteľskej kajuty na celú šírku lode."
        ),
        "images": gallery(
            img("1528154291023-a6525fabe5b4"),
            (DECK[1], "Flybridge s barom"),
            (SALON[0], "Hlavný salón"),
            (CABIN[3], "Majiteľská kajuta na celú šírku"),
            (SEA[1], "Kotvisko La Maddalena"),
        ),
    },
    {
        "slug": "benetti-oasis-40m-serenissima",
        "name": "Benetti Oasis 40M „Serenissima“",
        "model_name": "Oasis 40M",
        "manufacturer": "Benetti",
        "yacht_type": Yacht.YachtType.SUPERYACHT,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "taliansko-amalfi-sardinia",
        "home_marina": "Porto Cervo Marina",
        "weekly_price_from": "165000",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "40.80",
        "beam_meters": "8.50",
        "draft_meters": "2.15",
        "build_year": 2023,
        "cabins": 5,
        "berths": 10,
        "bathrooms": 6,
        "engine_power": "2 x 1 920 HP MTU",
        "equipment": ["Klimatizácia", "Generátor", "Stabilizátory pri nulovej rýchlosti", "Beach club s terasou", "Jacuzzi", "Jet ski", "Seabob", "Kino na palube", "Wi-Fi Starlink"],
        "badge": Yacht.Badge.NEW,
        "is_featured": True,
        "cover_image_url": img("1621277224630-81d9af65e40c"),
        "description": (
            "Serenissima je superjachta novej generácie s ikonickou „Oasis“ terasou – "
            "sklopnými bokmi na korme sa paluba otvára priamo k moru a mení sa na súkromný "
            "beach club s bazénom. Deväťčlenná posádka vrátane šéfkuchára a hostesiek, päť "
            "kajút pre desať hostí a vodné hračky pre celú rodinu. Charter na mieru v "
            "Sardínii, na Korzike a pozdĺž Azúrového pobrežia."
        ),
        "images": gallery(
            img("1621277224630-81d9af65e40c"),
            (DECK[0], "Beach club s bazénom"),
            (SALON[2], "Hlavný salón"),
            (CABIN[4], "Majiteľský apartmán"),
            (BATHROOM[1], "Mramorová kúpeľňa"),
            (TENDER, "Tender a vodné hračky"),
        ),
    },
    {
        "slug": "princess-y72-bella-mallorca",
        "name": "Princess Y72 „Bella Mallorca“",
        "model_name": "Princess Y72",
        "manufacturer": "Princess Yachts",
        "yacht_type": Yacht.YachtType.MOTOR_YACHT,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "spanielsko-baleary",
        "home_marina": "Club de Mar, Palma de Mallorca",
        "weekly_price_from": "38000",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "22.43",
        "beam_meters": "5.60",
        "draft_meters": "1.70",
        "build_year": 2022,
        "cabins": 4,
        "berths": 9,
        "bathrooms": 4,
        "engine_power": "2 x 1 800 HP MAN",
        "equipment": ["Klimatizácia", "Generátor", "Stabilizátory Seakeeper", "Hydraulická plošina", "Jet ski", "Paddleboard", "Wi-Fi", "Teaková paluba"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": False,
        "cover_image_url": img("1562281302-809108fd533c"),
        "description": (
            "Princess Y72 je britská klasika s plným výtlakom – tichá, stabilná a "
            "elegantná. Z Palmy sa vydáte na južné calas Mallorky, na Cabreru a cez kanál na "
            "Ibizu a Formenteru. Kapitán a stevardka pripravia raňajky na flybridge aj večeru "
            "pri západe slnka na kotve."
        ),
        "images": gallery(
            img("1562281302-809108fd533c"),
            (DECK[2], "Výhľad zo salóna"),
            (SALON[1], "Salón"),
            (CABIN[0], "Majiteľská kajuta"),
            (SEA[2], "Kotvenie pri Formentere"),
        ),
    },
    {
        "slug": "lagoon-55-es-trenc",
        "name": "Lagoon 55 „Es Trenc“",
        "model_name": "Lagoon 55",
        "manufacturer": "Lagoon (CNB)",
        "yacht_type": Yacht.YachtType.CATAMARAN,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "spanielsko-baleary",
        "home_marina": "Port Adriano, Mallorca",
        "weekly_price_from": "18500",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "16.56",
        "beam_meters": "8.70",
        "draft_meters": "1.55",
        "build_year": 2023,
        "cabins": 5,
        "berths": 10,
        "bathrooms": 5,
        "engine_power": "2 x 110 HP",
        "equipment": ["Klimatizácia", "Generátor", "Odsoľovač vody", "Dinghy čln s motorom", "Wi-Fi", "Paddleboard", "Kajaky", "Šnorchlovacia výbava", "Kuchár na palube"],
        "badge": Yacht.Badge.LAST_DATES,
        "is_featured": True,
        "cover_image_url": img("1506929562872-bb421503ef21"),
        "description": (
            "Veľkorysý katamarán s kapitánom a kuchárkou pre rodiny a skupiny, ktoré chcú "
            "luxus bez kompromisov. Flybridge s ležadlami, piatimi kajutami a vlastnými "
            "kúpeľňami. Pokojné kotvenie v tyrkysových calas Mallorky a Formentery – "
            "stabilita katamaránu ocenia aj tí, ktorí sa na mori zvyčajne necítia najlepšie."
        ),
        "images": gallery(
            img("1506929562872-bb421503ef21"),
            (DECK[1], "Kokpit s jedálenským stolom"),
            (SALON[0], "Salón"),
            (CABIN[1], "Hosťovská kajuta"),
            (BATHROOM[0], "Kúpeľňa"),
        ),
    },
    {
        "slug": "leopard-50-island-spirit",
        "name": "Leopard 50 „Island Spirit“",
        "model_name": "Leopard 50",
        "manufacturer": "Robertson & Caine",
        "yacht_type": Yacht.YachtType.CATAMARAN,
        "charter_type": Yacht.CharterType.BAREBOAT,
        "destination": "karibik-bvi",
        "home_marina": "Nanny Cay Marina, Tortola",
        "weekly_price_from": "9800",
        "security_deposit": "4500",
        "transit_log_fee": "390",
        "length_meters": "14.80",
        "beam_meters": "7.98",
        "draft_meters": "1.55",
        "build_year": 2022,
        "cabins": 5,
        "berths": 12,
        "bathrooms": 5,
        "engine_power": "2 x 57 HP",
        "equipment": ["Klimatizácia", "Generátor", "Odsoľovač vody", "Dinghy čln s motorom", "Wi-Fi", "Šnorchlovacia výbava", "Chladnička na flybridge"],
        "badge": Yacht.Badge.AVAILABLE,
        "is_featured": True,
        "cover_image_url": img("1500514966906-fe245eea9344"),
        "description": (
            "Leopard 50 je katamarán stvorený pre Karibik – predný kokpit, flybridge a "
            "štedré zásoby vody aj chladenia. Ideálny pre bareboat posádky s platným "
            "medzinárodným preukazom (ICC alebo RYA Day Skipper), ktoré chcú v zime plávať "
            "od jednej bóje k druhej medzi Tortolou, Virgin Gorda a Jost Van Dyke."
        ),
        "images": gallery(
            img("1500514966906-fe245eea9344"),
            (img("1515238152791-8216bfdf89a7"), "Pláž na Jost Van Dyke"),
            (SALON[2], "Salón"),
            (CABIN[2], "Kajuta"),
        ),
    },
    {
        "slug": "heesen-50m-ocean-pearl",
        "name": "Heesen 50M „Ocean Pearl“",
        "model_name": "Heesen 50M Steel",
        "manufacturer": "Heesen Yachts",
        "yacht_type": Yacht.YachtType.SUPERYACHT,
        "charter_type": Yacht.CharterType.CREWED,
        "destination": "karibik-bvi",
        "home_marina": "Yacht Club Costa Smeralda, Virgin Gorda",
        "weekly_price_from": "240000",
        "security_deposit": "0",
        "transit_log_fee": "0",
        "length_meters": "49.80",
        "beam_meters": "9.30",
        "draft_meters": "2.80",
        "build_year": 2020,
        "cabins": 6,
        "berths": 12,
        "bathrooms": 8,
        "engine_power": "2 x 2 600 HP MTU",
        "equipment": ["Klimatizácia", "Stabilizátory pri nulovej rýchlosti", "Jacuzzi na slnečnej palube", "Fitness", "Jet ski", "Seabob", "Potápačská výbava", "Wi-Fi Starlink", "Kino na palube"],
        "badge": Yacht.Badge.BOOKED,
        "is_featured": False,
        "cover_image_url": img("1567899378494-47b22a2ae96a"),
        "description": (
            "Ocean Pearl je oceánska superjachta s dvanásťčlennou posádkou, ktorá v zime "
            "operuje na Britských Panenských ostrovoch a v lete v západnom Stredomorí. "
            "Šesť apartmánových kajút, jacuzzi na slnečnej palube, fitness a kompletná "
            "potápačská základňa. Termíny pre aktuálnu sezónu sú vypredané – radi vám "
            "pripravíme ponuku na budúci rok alebo podobnú alternatívu."
        ),
        "images": gallery(
            img("1567899378494-47b22a2ae96a"),
            (img("1569263979104-865ab7cd8d13"), "Na otvorenom mori"),
            (DECK[0], "Slnečná paluba s jacuzzi"),
            (SALON[1], "Hlavný salón"),
            (CABIN[3], "Majiteľský apartmán"),
        ),
    },
]


class Command(BaseCommand):
    help = "Naplní databázu ukážkovými destináciami a jachtami (idempotentne)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete yachts and destinations that are not part of the seed data.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        destinations: dict[str, Destination] = {}
        for data in DESTINATIONS:
            data = dict(data)
            slug = data.pop("slug")
            obj, created = Destination.objects.update_or_create(slug=slug, defaults=data)
            destinations[slug] = obj
            self.stdout.write(f"  {'+' if created else '~'} destinácia: {obj.name}")

        for data in YACHTS:
            data = dict(data)
            slug = data.pop("slug")
            images = data.pop("images")
            data["destination"] = destinations[data["destination"]]
            for field in (
                "weekly_price_from",
                "security_deposit",
                "transit_log_fee",
                "length_meters",
                "beam_meters",
                "draft_meters",
            ):
                data[field] = Decimal(data[field])
            yacht, created = Yacht.objects.update_or_create(slug=slug, defaults=data)
            yacht.images.all().delete()
            YachtImage.objects.bulk_create(
                YachtImage(yacht=yacht, image_url=url, caption=caption, display_order=index)
                for index, (url, caption) in enumerate(images)
            )
            self.stdout.write(f"  {'+' if created else '~'} jachta: {yacht.name}")

        if options["flush"]:
            seeded_yachts = [y["slug"] for y in YACHTS]
            removed, _ = Yacht.objects.exclude(slug__in=seeded_yachts).delete()
            Destination.objects.exclude(slug__in=list(destinations)).filter(yachts__isnull=True).delete()
            self.stdout.write(f"  Odstránené nadbytočné záznamy: {removed}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Hotovo: {Destination.objects.count()} destinácií, {Yacht.objects.count()} jácht, "
                f"{YachtImage.objects.count()} fotografií."
            )
        )
