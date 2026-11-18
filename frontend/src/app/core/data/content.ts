/**
 * Static editorial content (testimonials, trust pillars, booking steps, FAQ).
 * Kept separate from `site.config.ts` because it is copy, not branding.
 */
import { IconName } from '../../shared/components/icon/icon.component';

export interface Testimonial {
  quote: string;
  author: string;
  detail: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Prvá plavba s deťmi a nemohli sme si to predstaviť lepšie. Kapitán Marko poznal každú zátoku, ' +
      'na Visu nám vybavil kotvenie pred najlepšou konobou a deti už plánujú ďalší rok.',
    author: 'Katarína a Martin H.',
    detail: 'Lagoon 46, Dalmácia · rodinná plavba',
    rating: 5,
  },
  {
    quote:
      'Organizovali sme firemný teambuilding pre 24 ľudí na troch lodiach. Všetko od transferov po ' +
      'regatu a večeru na Hvare klapalo ako hodinky. Profesionalita, akú sme od agentúry čakali.',
    author: 'Tomáš R.',
    detail: 'HR riaditeľ, IT spoločnosť · firemná regata',
    rating: 5,
  },
  {
    quote:
      'Ako bareboat posádka oceňujeme hlavne loď v perfektnom stave a férový check-in. Kaucia sa nám ' +
      'vrátila do dvoch dní a s poistením kaucie sme mali úplný pokoj.',
    author: 'Peter S.',
    detail: 'Oceanis 51.1, Trogir · bez posádky',
    rating: 5,
  },
];

export interface Pillar {
  icon: IconName;
  title: string;
  text: string;
}

export const TRUST_PILLARS: Pillar[] = [
  {
    icon: 'anchor',
    title: 'Overené maríny a lode',
    text: 'Spolupracujeme len s prevádzkovateľmi, ktorých lode sme osobne preverili. Každá jachta prechádza kontrolou pred sezónou.',
  },
  {
    icon: 'shield',
    title: '100 % poistenie kaucie',
    text: 'K prenájmu vám zabezpečíme poistenie vratnej kaucie. Pri škode neplatíte celú kauciu, ale len malú spoluúčasť.',
  },
  {
    icon: 'wheel',
    title: 'Vlastný tím kapitánov',
    text: 'Naši kapitáni hovoria po slovensky, poznajú miestne vetry aj najkrajšie kotviská a postarajú sa o bezpečnosť posádky.',
  },
  {
    icon: 'lifebuoy',
    title: '24/7 podpora na mori',
    text: 'Počas plavby máte k dispozícii nonstop linku. Či ide o poruchu motora, alebo radu, kde prenocovať pri búrke.',
  },
];

export interface Step {
  title: string;
  text: string;
}

export const STEPS_LICENSED: Step[] = [
  {
    title: 'Vyberte si loď a termín',
    text: 'Vo flotile filtrujte podľa destinácie, počtu kajút a rozpočtu. Charterové týždne začínajú v sobotu.',
  },
  {
    title: 'Overíme dostupnosť do 24 hodín',
    text: 'Pošlite nezáväzný dopyt. Broker overí termín priamo u prevádzkovateľa a pošle vám ponuku s presnou cenou.',
  },
  {
    title: 'Rezervácia a crew list',
    text: 'Po podpise zmluvy uhradíte zálohu 50 %. Doplatok splatný 6 týždňov pred plavbou. Doložíte kópiu preukazu a crew list.',
  },
  {
    title: 'Check-in v maríne',
    text: 'V sobotu od 17:00 prevezmete loď, prejdete inventár a zložíte vratnú kauciu kartou. Nedeľa ráno – vyplávate.',
  },
  {
    title: 'Check-out a vrátenie kaucie',
    text: 'V piatok večer sa vrátite do domovskej maríny, v sobotu ráno odovzdáte loď a kaucia sa uvoľní.',
  },
];

export const STEPS_FIRST_TIMERS: Step[] = [
  {
    title: 'Povedzte nám o svojej posádke',
    text: 'Koľko vás je, aký máte rozpočet a čo od dovolenky čakáte. Pokoj v zátokách, gastronómia, alebo plachtenie?',
  },
  {
    title: 'Navrhneme loď s kapitánom',
    text: 'Odporučíme loď aj trasu, ktorá zodpovedá skúsenostiam posádky. Kapitán je skúsený profesionál so slovenčinou.',
  },
  {
    title: 'Postaráme sa o detaily',
    text: 'Transfer z letiska, nákup potravín na palubu (provisioning), hostesku či kuchára – všetko vybavíme za vás.',
  },
  {
    title: 'Vy si len užívate more',
    text: 'Kapitán riadi loď, plánuje trasu podľa počasia a vy sa kúpete, šnorchlujete a objavujete ostrovy.',
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQ: Faq[] = [
  {
    question: 'Čo je vratná kaucia a kedy ju zaplatím?',
    answer:
      'Kaucia (security deposit) slúži na krytie prípadných škôd na lodi. Skladá sa pri check-ine kreditnou kartou ' +
      'a po bezproblémovom odovzdaní lode sa uvoľní, zvyčajne do 3 – 7 dní.',
  },
  {
    question: 'Ako funguje poistenie kaucie?',
    answer:
      'Za poplatok cca 25 – 35 € na osobu a týždeň vám poisťovňa v prípade škody preplatí stratenú kauciu až do jej ' +
      'plnej výšky. Platíte len malú spoluúčasť, zvyčajne 10 % škody.',
  },
  {
    question: 'Čo je transit log a čo obsahuje?',
    answer:
      'Transit log je povinný poplatok prevádzkovateľa lode, ktorý zahŕňa záverečné upratovanie, posteľnú bielizeň, ' +
      'uteráky, plyn a niekde aj vonkajší motor dinghy člna. Platí sa pri check-ine.',
  },
  {
    question: 'Čo nie je v cene prenájmu?',
    answer:
      'Palivo, prístavné a kotviskové poplatky, potraviny a nápoje, turistická taxa a voliteľné služby ako kapitán ' +
      'či hosteska. Pri lodiach s kompletnou posádkou sa tieto náklady hradia z APA zálohy.',
  },
  {
    question: 'Čo znamená APA pri lodiach s posádkou?',
    answer:
      'APA (Advance Provisioning Allowance) je záloha vo výške 25 – 35 % ceny prenájmu, z ktorej kapitán hradí palivo, ' +
      'prístavy, jedlo a nápoje. Na konci plavby dostanete vyúčtovanie a nevyčerpanú sumu vám vrátime.',
  },
  {
    question: 'Môžem zrušiť rezerváciu?',
    answer:
      'Storno podmienky závisia od prevádzkovateľa. Odporúčame cestovné poistenie so stornom. Pri zrušení viac ako ' +
      '60 dní pred plavbou sa zvyčajne vracia časť zálohy.',
  },
];
