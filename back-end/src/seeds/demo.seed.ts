import config from '../config';
import { BookingModel } from '../models/booking/booking.model';
import { ClaimRatingModel } from '../models/booking/claim-rating.model';
import { ReviewModel } from '../models/booking/review.model';
import { OperatorModel } from '../models/operator/operator.model';
import { ClaimModel } from '../models/plan/claim.model';
import { DepartureModel } from '../models/plan/departure.model';
import { PlanDayModel } from '../models/plan/plan-day.model';
import { PlanModel } from '../models/plan/plan.model';
import { SavedPlanModel } from '../models/plan/saved-plan.model';
import { UserModel } from '../models/user/user.model';
import {
  BOOKING_STATUS,
  PAY_METHOD,
  ROOM
} from '../types/booking/booking.type';
import {
  AREA,
  CLAIM_AREA,
  CLAIM_KIND,
  DIFFICULTY,
  PLAN_STATUS
} from '../types/plan/plan.type';
import { ROLES } from '../types/user/role.type';

/**
 * Demo marketplace for the thesis: 5 agencies, 11 plans, 32 travellers, past trips with reviews (so
 * Expectation Scores are real aggregates) and next season's bookings. Every demo login uses
 * SEED_DEMO_PASSWORD. Runs only when SEED_DEMO is on and the Operators table is empty.
 */

// deterministic randomness so every fresh database gets the same scores and charts
let seed = 20261023;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pickOne = <T>(items: readonly T[]) =>
  items[Math.floor(rand() * items.length)];
const D = (date: string) => new Date(`${date}T00:00:00Z`);
const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);

const C = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
const img = {
  dunes1: `${C}/0/04/Khongoryn_Els_04.jpg/1280px-Khongoryn_Els_04.jpg`,
  dunes2: `${C}/f/fb/Khongoryn_Els_05.jpg/1280px-Khongoryn_Els_05.jpg`,
  dunes3: `${C}/e/e0/Khongoryn_Els_10.jpg/1280px-Khongoryn_Els_10.jpg`,
  dunes4: `${C}/1/1c/Khongoryn_Els_12.jpg/1280px-Khongoryn_Els_12.jpg`,
  dunes5: `${C}/2/24/Khongoryn_Els_14.jpg/1280px-Khongoryn_Els_14.jpg`,
  camel1: `${C}/3/3f/Camels_at_Khongoryn_Els_01.jpg/1280px-Camels_at_Khongoryn_Els_01.jpg`,
  camel2: `${C}/6/67/Camels_in_Gobi_Desert_01.jpg/1280px-Camels_in_Gobi_Desert_01.jpg`,
  camel3: `${C}/2/21/Camel_in_Gobi_Desert_01.jpg/1280px-Camel_in_Gobi_Desert_01.jpg`,
  yolyn1: `${C}/f/f1/Yolyn_Am_02.jpg/1280px-Yolyn_Am_02.jpg`,
  yolyn2: `${C}/9/9a/Yolyn_Am_05.jpg/1280px-Yolyn_Am_05.jpg`,
  yolyn3: `${C}/1/1e/Yolyn_Am_07.jpg/1280px-Yolyn_Am_07.jpg`,
  bayan1: `${C}/b/b3/Bayanzag_07.jpg/1280px-Bayanzag_07.jpg`,
  bayan2: `${C}/e/e3/Bayanzag_08.jpg/1280px-Bayanzag_08.jpg`,
  bayan3: `${C}/8/8b/Bayanzag_09.jpg/1280px-Bayanzag_09.jpg`,
  bayan4: `${C}/4/40/Bayanzag_10.jpg/1280px-Bayanzag_10.jpg`,
  ger1: `${C}/3/31/Ger_Camp_-_Dornogovi_Province_-_Mongolia_%286246451699%29.jpg/1280px-Ger_Camp_-_Dornogovi_Province_-_Mongolia_%286246451699%29.jpg`,
  ger2: `${C}/0/0d/Ger_Camp_-_Dornogovi_Province_-_Mongolia_%286246456067%29.jpg/1280px-Ger_Camp_-_Dornogovi_Province_-_Mongolia_%286246456067%29.jpg`,
  uaz: `${C}/5/5f/Dornogovi_Province_-_Mongolia_%286247031778%29.jpg/1280px-Dornogovi_Province_-_Mongolia_%286247031778%29.jpg`,
  lake1: `${C}/d/de/Lake_Kh%C3%B6vsg%C3%B6l_01.jpg/1280px-Lake_Kh%C3%B6vsg%C3%B6l_01.jpg`,
  lake2: `${C}/1/18/Lake_Kh%C3%B6vsg%C3%B6l_02.jpg/1280px-Lake_Kh%C3%B6vsg%C3%B6l_02.jpg`,
  lake3: `${C}/5/55/Lake_Kh%C3%B6vsg%C3%B6l%2C_Mongolia.jpg/1280px-Lake_Kh%C3%B6vsg%C3%B6l%2C_Mongolia.jpg`,
  tsaatan: `${C}/f/fb/Tsaatan_tent.jpg/1280px-Tsaatan_tent.jpg`,
  alagtsar: `${C}/2/28/Alag_Tsar_Tourist_Camp_01.jpg/1280px-Alag_Tsar_Tourist_Camp_01.jpg`,
  erdene1: `${C}/d/d7/Erdene_Zuu_Monastery_06.jpg/1280px-Erdene_Zuu_Monastery_06.jpg`,
  erdene2: `${C}/c/c6/Erdene_Zuu_Monastery_07.jpg/1280px-Erdene_Zuu_Monastery_07.jpg`,
  erdene3: `${C}/c/c0/Erdene_Zuu_Monastery_08.jpg/1280px-Erdene_Zuu_Monastery_08.jpg`,
  erdene4: `${C}/3/32/Erdene_Zuu_Monastery_09.jpg/1280px-Erdene_Zuu_Monastery_09.jpg`,
  orkhon1: `${C}/3/38/Ulaan_Tsutgalan_Waterfall.jpg/1280px-Ulaan_Tsutgalan_Waterfall.jpg`,
  orkhon2: `${C}/6/6a/Hotel_Camp_Orkhon_Waterfall_01.jpg/1280px-Hotel_Camp_Orkhon_Waterfall_01.jpg`,
  orkhon3: `${C}/9/9e/Hotel_Camp_Orkhon_Waterfall_02.jpg/1280px-Hotel_Camp_Orkhon_Waterfall_02.jpg`,
  orkhon4: `${C}/c/c6/Hotel_Camp_Orkhon_Waterfall_03.jpg/1280px-Hotel_Camp_Orkhon_Waterfall_03.jpg`,
  turtle1: `${C}/3/33/Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810421333%29.jpg/1280px-Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810421333%29.jpg`,
  turtle2: `${C}/7/79/Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810422113%29.jpg/1280px-Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810422113%29.jpg`,
  turtle3: `${C}/4/48/Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810921862%29.jpg/1280px-Turtle_Rock%2C_Terelj_National_Park%2C_Mongolia_%2848810921862%29.jpg`,
  gandan1: `${C}/3/3b/Gandantegchinlen_Monastery_02.jpg/1280px-Gandantegchinlen_Monastery_02.jpg`,
  gandan2: `${C}/2/2d/Gandantegchinlen_Monastery_07.jpg/1280px-Gandantegchinlen_Monastery_07.jpg`,
  gandan3: `${C}/b/bb/Gandantegchinlen_Monastery_12.jpg/1280px-Gandantegchinlen_Monastery_12.jpg`
};

type Day = [
  place: string,
  title: string,
  description: string,
  driveHours: number | null,
  sleeping: string,
  meals: string,
  hotShower: boolean,
  signal: boolean,
  flushToilet: boolean
];
/** The last number is how often travellers find the promise held, 0–1. */
type ClaimSeed = [
  kind: keyof typeof CLAIM_KIND,
  area: keyof typeof CLAIM_AREA,
  text: string,
  detail: string,
  quality: number
];
type PlanSeed = {
  slug: string;
  op: keyof typeof OPERATORS;
  titleEn: string;
  titleMn: string;
  region: string;
  area: keyof typeof AREA;
  season: string;
  minGroup: number;
  maxGroup: number;
  difficulty: keyof typeof DIFFICULTY;
  vehicle: string;
  sleeping: string;
  lodging: string[];
  summary: string;
  summaryMn: string;
  price: number;
  groupPrice?: [number, number];
  single?: number;
  included: string[];
  excluded: string[];
  photos: string[];
  km?: number;
  unpaved?: number;
  status?: PLAN_STATUS;
  views: number;
  days: Day[];
  claims: ClaimSeed[];
  past: string[];
  future: string[];
  seats: number;
  reviewTexts: string[];
};

const T = true;
const F = false;

const OPERATORS = {
  nomadica: {
    name: 'Nomadica Travel',
    licenceNo: 'MN-TO-0412',
    foundedYear: 2014,
    isVerified: true,
    replyHours: 2.1,
    color: '#004068',
    about:
      "Eleven drivers, six guides, all from the provinces we drive through. We keep groups under eight because a UAZ seats eight and we will not put you in a minivan on gravel. We write our cons list ourselves — if a camp's shower is cold in June, we say so.",
    languages: ['English', 'Mongolian', 'Russian', 'German (1 guide)'],
    fleet:
      '6 × UAZ 452, 2 × Land Cruiser 105, own kitchen trailer for camping routes.',
    coverUrl: img.ger1
  },
  steppe: {
    name: 'Steppe & Sky Tours',
    licenceNo: 'MN-TO-0877',
    foundedYear: 2019,
    isVerified: true,
    replyHours: 1.8,
    color: '#24481f',
    about:
      'Budget group departures every week of the season. Big vans, small prices, honest about both.',
    languages: ['English', 'Mongolian', 'Korean'],
    fleet: '4 × Hyundai Starex, 2 × Delica 4×4.',
    coverUrl: img.yolyn3
  },
  khangai: {
    name: 'Khangai Expeditions',
    licenceNo: 'MN-TO-0219',
    foundedYear: 2011,
    isVerified: true,
    replyHours: 5.4,
    color: '#595d62',
    about:
      "Private 4×4 expeditions for photographers and people who don't mind dust. Founded by a former National Geographic fixer.",
    languages: ['English', 'Mongolian', 'German'],
    fleet: '5 × Land Cruiser 105, camping kit for 20.',
    coverUrl: img.bayan4
  },
  bluepearl: {
    name: 'Blue Pearl Mongolia',
    licenceNo: 'MN-TO-1033',
    foundedYear: 2020,
    isVerified: true,
    replyHours: 11,
    color: '#1c3818',
    about: 'City stopovers and short cultural tours from Ulaanbaatar.',
    languages: ['English', 'Mongolian', 'Chinese'],
    fleet: '3 × minivans.',
    coverUrl: img.gandan1
  },
  altai: {
    name: 'Altai Nomads LLC',
    licenceNo: 'MN-TO-1290',
    foundedYear: 2025,
    isVerified: false,
    replyHours: 4,
    color: '#00304e',
    city: 'Ölgii',
    about: 'Treks in the far west, run by a family from Tsengel sum.',
    languages: ['Kazakh', 'Mongolian', 'English'],
    fleet: '2 × UAZ 452.',
    coverUrl: ''
  }
};

/** Agency staff sign in by phone or email. */
const OPERATOR_USERS: [name: string, email: string, phone: string, op: keyof typeof OPERATORS][] = [
  ['Bat-Erdene Tseveen', 'bat@nomadica.mn', '99112233', 'nomadica'],
  ['Saraa Gantulga', 'saraa@steppesky.mn', '99223344', 'steppe'],
  ['Ganzorig Munkh', 'ganzo@khangai.mn', '99334455', 'khangai'],
  ['Oyunaa Byamba', 'oyunaa@bluepearl.mn', '99445566', 'bluepearl'],
  ['Serikbol Kh.', 'serik@altainomads.mn', '99556677', 'altai']
];

const TRAVELLERS: [name: string, email: string, country: string][] = [
  ['Elena Kowalski', 'elena@itours.mn', 'Poland'],
  ['Marta Kowalczyk', 'marta.k@example.com', 'Poland'],
  ['Ochirbat Dorj', 'ochirbat@example.mn', 'Mongolia'],
  ['Тэмүүлэн Бат', 'temuulen@example.mn', 'Mongolia'],
  ['Marc Dupont', 'marc.dupont@example.fr', 'France'],
  ['Sarah Chen', 'sarah.chen@example.sg', 'Singapore'],
  ['Нарантуяа Дорж', 'narantuya@example.mn', 'Mongolia'],
  ['Jonas Weber', 'jonas.weber@example.de', 'Germany'],
  ['Emma Johansson', 'emma.j@example.se', 'Sweden'],
  ["Liam O'Brien", 'liam.ob@example.ie', 'Ireland'],
  ['Yuki Tanaka', 'yuki.t@example.jp', 'Japan'],
  ['Min-jun Park', 'minjun@example.kr', 'South Korea'],
  ['Sofia Rossi', 'sofia.rossi@example.it', 'Italy'],
  ['Noah Williams', 'noah.w@example.com', 'USA'],
  ['Chloe Martin', 'chloe.m@example.fr', 'France'],
  ['Lukas Novak', 'lukas.n@example.cz', 'Czechia'],
  ['Ana García', 'ana.garcia@example.es', 'Spain'],
  ['Oliver Smith', 'oliver.s@example.co.uk', 'UK'],
  ['Mia Becker', 'mia.b@example.de', 'Germany'],
  ['Ethan Brown', 'ethan.b@example.au', 'Australia'],
  ['Анужин Ганбат', 'anujin@example.mn', 'Mongolia'],
  ['Билгүүн Отгон', 'bilguun@example.mn', 'Mongolia'],
  ['Hannah Fischer', 'hannah.f@example.at', 'Austria'],
  ['Lucas Silva', 'lucas.s@example.br', 'Brazil'],
  ['Isabella Moore', 'isabella.m@example.ca', 'Canada'],
  ['Daniel Kim', 'daniel.k@example.us', 'USA'],
  ['Zara Ahmed', 'zara.a@example.co.uk', 'UK'],
  ['Pieter de Vries', 'pieter@example.nl', 'Netherlands'],
  ['Elif Yılmaz', 'elif.y@example.tr', 'Turkey'],
  ['Mateo López', 'mateo.l@example.mx', 'Mexico'],
  ['Grace Lee', 'grace.l@example.nz', 'New Zealand'],
  ['Arjun Mehta', 'arjun.m@example.in', 'India']
];

const PLANS: PlanSeed[] = [
  {
    slug: 'gobi-8-days-flaming-cliffs-khongor-dunes',
    op: 'nomadica',
    titleEn: '8 days in the Gobi: Flaming Cliffs & Khongor dunes',
    titleMn: 'Говь 8 хоног: Баянзаг ба Хонгорын элс',
    region: 'Ömnögovi',
    area: 'GOBI',
    season: 'May – September',
    minGroup: 4,
    maxGroup: 8,
    difficulty: 'EASY_MODERATE',
    vehicle: 'Russian UAZ 452 (4×4)',
    sleeping: 'Ger camps + 1 herder ger',
    lodging: ['Tourist ger camp', 'Herder family ger', 'Hotel in town'],
    summary:
      'The classic southern loop with one deliberate change: two nights at Khongor Els instead of one, so you climb the dunes at sunrise as well as sunset. You pay for that in driving — two long transfer days on gravel. Written and guided by Bat-Erdene, who grew up in Bulgan sum.',
    summaryMn:
      'Говийн сонгодог аялал, гэхдээ нэг онцлогтой: Хонгорын элсэнд нэг биш хоёр шөнө хоноод, нар жаргах ба мандахыг хоёуланг нь элсэн дээрээс үзнэ. Үүний төлөө хоёр урт, шороон замтай өдөр бий. Булган сумын уугуул Бат-Эрдэнэ хөтөлнө.',
    price: 1180,
    groupPrice: [1040, 6],
    single: 180,
    km: 1640,
    unpaved: 62,
    views: 4120,
    included: [
      'UAZ 4×4, fuel and driver for 8 days',
      'English-speaking guide, 7 nights lodging',
      'All meals from day 2, drinking water',
      'Park fees, camel ride, airport transfers'
    ],
    excluded: [
      'International flights and visa',
      'Travel insurance (required, we can quote)',
      'Alcohol, souvenirs, guide gratuity',
      'Single supplement, $180'
    ],
    photos: [img.dunes1, img.ger1, img.bayan1, img.camel1, img.yolyn1, img.dunes3, img.uaz],
    days: [
      ['Ulaanbaatar', 'Arrive Ulaanbaatar, briefing, Gandan monastery', 'Airport pickup, hotel check-in, 18:00 briefing where the guide walks through every day, the toilets and the drives. Dinner at a Mongolian kitchen near Sükhbaatar square.', 0, 'Hotel, twin share', 'Dinner', T, T, T],
      ['Baga Gazriin Chuluu', 'South to Baga Gazriin Chuluu granite range', 'A long first transfer — 4 h, half of it on gravel. Short hike to the ruined hermitage in the afternoon, then the first ger camp night.', 4, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Yolyn Am', 'Tsagaan Suvarga cliffs, on to Yolyn Am', 'The first hard drive day: 6 h, mostly unpaved, with a long lunch stop at the white cliffs of Tsagaan Suvarga.', 6, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Yolyn Am', 'The Yolyn Am ice gorge on foot', 'A 3 km walk into the gorge, where ice lingers into July. Afternoon free at camp; the shower here can run cold.', 1, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Khongor Els', 'Khongor Els — the singing dunes, camel ride at sunset', 'The hard drive day: 6–7 h. Arrive mid-afternoon, ride Bactrian camels along the Khongoryn Gol, then climb the ridge for sunset. You sleep here twice, so the sunrise climb is optional and unhurried.', 6.5, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Khongor Els', 'Sunrise on the dunes, a night with a herder family', 'Optional 45-minute climb at dawn. After lunch we move 20 minutes to a camel-herding family and sleep in their guest ger.', 0.5, 'Herder family ger', 'B · L · D', F, F, F],
      ['Bayanzag', 'Bayanzag — the Flaming Cliffs', 'Where the first dinosaur eggs were found in 1923. Walk the rim at golden hour.', 4, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Ulaanbaatar', 'Back to Ulaanbaatar', 'The long road home, 7 h with a stop in Mandalgovi. Drop-off at your hotel around 18:00.', 7, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Two nights at the dunes', 'Sunrise and sunset climbs', 0.97],
      ['PRO', 'GUIDE', 'Guide speaks fluent English', 'Bat-Erdene or Oyuka, both licensed', 0.94],
      ['PRO', 'LODGING', 'Hot shower 6 of 7 nights', 'Every ger camp has hot water', 0.66],
      ['PRO', 'COMFORT', 'Meals cooked fresh, vegetarian on request', 'Own cook from day 2', 0.92],
      ['CON', 'COMFORT', 'Two 6–7 h driving days', 'Days 3 and 5, unpaved. Not for bad backs', 0.99],
      ['CON', 'COMFORT', 'No wifi or signal, days 3–6', 'Satellite phone carried for emergencies', 0.96],
      ['CON', 'LODGING', 'Long-drop toilet at the herder ger', 'One night, day 6', 0.97],
      ['CON', 'ITINERARY', 'Dune climb is genuinely steep', '45 min in soft sand; 1 in 5 skip it', 0.95]
    ],
    past: ['2025-06-15', '2025-07-13', '2025-08-10', '2026-06-14', '2026-07-12', '2026-08-09', '2026-09-06'],
    future: ['2027-05-31', '2027-06-14', '2027-07-12', '2027-07-26', '2027-08-09', '2027-08-23', '2027-09-06'],
    seats: 8,
    reviewTexts: [
      'The cons list was accurate, which is why I trusted the rest. Day 5 really is seven hours. The second dune night was the best decision of the trip.',
      'Everything as written except the shower at Yolyn Am camp was cold. Guide handled it well and warned the next group.',
      'Photos matched, driver spoke English, ger camp was as described.',
      'Bat-Erdene knows every family on the route. The herder night was the highlight for our kids.',
      "Long drives, exactly as they warned us. Bring a neck pillow and you'll be fine.",
      'Хоол маш амттай, хөтөч нь маш хариуцлагатай байлаа. Хонгорын элсэнд хоёр хоносон нь үнэхээр зөв шийдвэр.',
      'Yolyn Am camp had no hot water two evenings in a row. Otherwise a flawless trip.',
      'Honest operator. They told us about the long-drop before we paid and it was no big deal.'
    ]
  },
  {
    slug: 'khovsgol-lake-reindeer-herders-6-days',
    op: 'nomadica',
    titleEn: 'Khövsgöl lake & the reindeer herders, 6 days',
    titleMn: 'Хөвсгөл нуур ба цаатнууд, 6 хоног',
    region: 'Khövsgöl',
    area: 'NORTH',
    season: 'June – September',
    minGroup: 2,
    maxGroup: 8,
    difficulty: 'MODERATE',
    vehicle: 'Domestic flight + UAZ 452',
    sleeping: 'Lakeside ger camp + Tsaatan tent',
    lodging: ['Tourist ger camp', 'Tent'],
    summary:
      'Fly to Mörön to skip two days of driving, then three nights on the western shore and two nights with a Tsaatan reindeer-herding family in the taiga. The ride up to the herders is 4 h on horseback and it is not optional.',
    summaryMn:
      'Мөрөн хүртэл нисч, хоёр өдрийн замыг хэмнэнэ. Нуурын баруун эрэгт гурван шөнө, тайгад цаатан айлд хоёр шөнө хононо. Цаатнууд руу морьтой 4 цаг явна — үүнийг алгасах боломжгүй.',
    price: 980,
    single: 140,
    km: 520,
    unpaved: 70,
    views: 2860,
    included: ['Return flight UB–Mörön', 'Guide, horses and horse handler', 'All meals and lodging', 'Gift for the herder family'],
    excluded: ['International flights', 'Travel insurance', 'Sleeping bag rental ($15)'],
    photos: [img.lake1, img.tsaatan, img.lake2, img.alagtsar, img.lake3],
    days: [
      ['Ulaanbaatar', 'Morning flight to Mörön, drive to Khatgal', '1 h flight, then 2 h to the lake. Afternoon kayak if the wind allows.', 2, 'Lakeside ger camp', 'L · D', T, T, T],
      ['Khövsgöl', 'Western shore by UAZ', 'Slow day along the shore, picnic lunch, swim if you dare (12 °C).', 3, 'Lakeside ger camp', 'B · L · D', T, F, T],
      ['Tsaatan camp', 'Ride up to the reindeer herders', '4 h on horseback through the taiga. Saddle sore guaranteed.', 1, 'Tsaatan tent (ortz)', 'B · L · D', F, F, F],
      ['Tsaatan camp', 'A day with the herders', 'Milk reindeer, learn to carve antler, sleep in the ortz.', 0, 'Tsaatan tent (ortz)', 'B · L · D', F, F, F],
      ['Khövsgöl', 'Back down to the lake', 'Ride down, hot shower at last, farewell dinner.', 1, 'Lakeside ger camp', 'B · L · D', T, T, T],
      ['Ulaanbaatar', 'Fly back to Ulaanbaatar', 'Afternoon flight, hotel drop-off.', 2, '—', 'B', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Two nights with a Tsaatan family', 'Not a show camp — a working family', 0.95],
      ['PRO', 'COMFORT', 'Flights save two driving days', 'Mörön flight included', 0.98],
      ['PRO', 'GUIDE', 'Guide speaks English and Tuvan', 'Translates with the herders', 0.9],
      ['CON', 'COMFORT', 'Horse riding 4 h on day 3', 'No alternative transport into the taiga', 0.97],
      ['CON', 'LODGING', 'No shower or toilet at the herder camp', 'Two nights, days 3–4', 0.96],
      ['CON', 'COMFORT', 'Cold nights even in July', 'Down to 2 °C in the taiga', 0.88]
    ],
    past: ['2025-07-06', '2025-08-03', '2026-07-05', '2026-08-02'],
    future: ['2027-06-20', '2027-07-04', '2027-08-01', '2027-08-29'],
    seats: 8,
    reviewTexts: [
      'The reindeer family was the most genuine experience we had in Mongolia. The ride up is hard, as promised.',
      'Freezing at night in the ortz, bring a proper sleeping bag. Everything else exactly as described.',
      'The guide translated everything with the herders — that made the trip.',
      'Цаатан айлын амьдралыг ойроос харсан нь гайхалтай. Морин аялал хүнд байсан ч бичсэнтэй яг адил.'
    ]
  },
  {
    slug: 'naadam-in-kharkhorin-4-days',
    op: 'nomadica',
    titleEn: 'Naadam in Kharkhorin, 4 days',
    titleMn: 'Хархорин дахь наадам, 4 хоног',
    region: 'Övörkhangai',
    area: 'CENTRAL',
    season: 'July (Naadam)',
    minGroup: 2,
    maxGroup: 12,
    difficulty: 'EASY',
    vehicle: 'Minivan',
    sleeping: 'Ger camp',
    lodging: ['Tourist ger camp'],
    summary:
      'Skip the crowded stadium in Ulaanbaatar and see a provincial Naadam in the old capital: wrestling, archery and the horse race from the finish line. Erdene Zuu monastery on day 3.',
    summaryMn:
      'Улаанбаатарын хөл хөдөлгөөнтэй цэнгэлдэхийн оронд эртний нийслэлд орон нутгийн наадам үзнэ: бөх, сур харваа, морь уралдааныг барианаас нь. 3 дахь өдөр Эрдэнэ Зуу хийд.',
    price: 560,
    km: 760,
    unpaved: 10,
    views: 1940,
    included: ['Minivan and driver', 'Guide', 'Ger camp, all meals', 'Naadam seats'],
    excluded: ['Flights', 'Insurance', 'Drinks'],
    photos: [img.erdene1, img.erdene2, img.erdene3, img.orkhon2],
    days: [
      ['Ulaanbaatar', 'Drive to Kharkhorin', 'Paved road the whole way, 6 h with a stop at the Khögnö Khan dunes.', 6, 'Tourist ger camp', 'L · D', T, T, T],
      ['Kharkhorin', 'Naadam opening, wrestling and archery', 'Front seats at the local stadium; your guide explains the rules.', 0, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Kharkhorin', 'Horse race finish and Erdene Zuu', 'Morning at the race finish line, afternoon at the monastery.', 0.5, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Ulaanbaatar', 'Back to Ulaanbaatar', '6 h on paved road.', 6, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Front seats for wrestling and archery', 'Reserved with the sum governor', 0.86],
      ['PRO', 'ITINERARY', 'Horse race seen from the finish line', '', 0.84],
      ['PRO', 'LODGING', 'Paved road all the way', '', 0.97],
      ['CON', 'COMFORT', 'Groups up to 12 in one van', '', 0.95],
      ['CON', 'ITINERARY', 'Naadam dates are set by the province', 'Can shift by a day', 0.9],
      ['CON', 'COMFORT', 'Two 6 h driving days', '', 0.97]
    ],
    past: ['2025-07-10', '2026-07-10'],
    future: ['2027-07-10'],
    seats: 12,
    reviewTexts: [
      'The local Naadam felt real, not staged. The horse race finish was chaotic and amazing.',
      'Seats were not as close as promised for archery, but the wrestling was great.',
      'Good value, long van days as described.'
    ]
  },
  {
    slug: 'terelj-weekend-from-ulaanbaatar',
    op: 'nomadica',
    titleEn: 'Terelj weekend from Ulaanbaatar',
    titleMn: 'Тэрэлжийн амралтын өдрүүд',
    region: 'Töv',
    area: 'CENTRAL',
    season: 'May – October',
    minGroup: 2,
    maxGroup: 8,
    difficulty: 'EASY',
    vehicle: 'Land Cruiser',
    sleeping: 'Ger camp',
    lodging: ['Tourist ger camp'],
    summary:
      'The easiest way out of the city: 90 minutes to Gorkhi-Terelj, Turtle Rock, a short horse ride and a night in a ger with a real stove. Back by Sunday lunch.',
    summaryMn:
      'Хотоос гарах хамгийн хялбар арга: 90 минутын дараа Горхи-Тэрэлж, Мэлхий хад, богино морин аялал, жинхэнэ зуухтай гэрт нэг хоног. Ням гарагийн үдээс өмнө буцаж ирнэ.',
    price: 210,
    km: 160,
    unpaved: 20,
    views: 1410,
    included: ['Transport', 'Guide', 'Ger camp, 3 meals', '1 h horse ride'],
    excluded: ['Insurance', 'Drinks'],
    photos: [img.turtle1, img.turtle2, img.gandan1, img.turtle3],
    days: [
      ['Terelj', 'Turtle Rock, Aryabal temple, horse ride', 'Leave UB at 09:00, walk up to Aryabal, ride for an hour along the Tuul river.', 1.5, 'Tourist ger camp', 'L · D', T, T, T],
      ['Ulaanbaatar', 'Slow morning, back to the city', 'Breakfast by the river, back in UB by 13:00.', 1.5, '—', 'B', F, T, T]
    ],
    claims: [
      ['PRO', 'COMFORT', 'Only 90 minutes from the city', '', 0.98],
      ['PRO', 'LODGING', 'Ger with a wood stove and real beds', '', 0.97],
      ['PRO', 'GUIDE', 'Horses suited to first-timers', '', 0.95],
      ['CON', 'ITINERARY', 'Busy with day-trippers on Saturdays', '', 0.96],
      ['CON', 'LODGING', 'Shared shower block', '', 0.98],
      ['CON', 'COMFORT', 'Short — one night only', '', 0.99]
    ],
    past: ['2026-05-16', '2026-06-06', '2026-06-27', '2026-07-18', '2026-08-08', '2026-08-29', '2026-09-19'],
    future: ['2027-05-15', '2027-06-05', '2027-06-26', '2027-07-17', '2027-08-07'],
    seats: 8,
    reviewTexts: [
      'Perfect first taste of Mongolia. Exactly as advertised.',
      'Crowded at Turtle Rock as they said, but the camp was quiet.',
      'Хүүхдүүдтэйгээ явахад их тохиромжтой. Гэр нь дулаахан.'
    ]
  },
  {
    slug: 'gobi-in-6-ice-gorge-dunes-dinosaur-beds',
    op: 'steppe',
    titleEn: 'Gobi in 6: ice gorge, dunes, dinosaur beds',
    titleMn: 'Говь 6 хоногт: Ёлын ам, элс, үлэг гүрвэлийн олдвор',
    region: 'Ömnögovi',
    area: 'GOBI',
    season: 'May – September',
    minGroup: 4,
    maxGroup: 12,
    difficulty: 'EASY',
    vehicle: 'Minivan',
    sleeping: 'Ger camps',
    lodging: ['Tourist ger camp'],
    summary:
      'The cheapest honest way to see all three headline sights of the south in under a week. You share a minivan with up to eleven others and get one night at the dunes.',
    summaryMn:
      'Өмнөговийн гурван гол үзмэрийг долоо хоногт багтаан үзэх хамгийн хямд, шударга сонголт. 12 хүртэлх хүнтэй нэг микроавтобусаар явж, элсэнд нэг хоно.',
    price: 690,
    km: 1500,
    unpaved: 55,
    views: 3310,
    included: ['Minivan, fuel, driver', 'Guide', 'Ger camps, all meals', 'Park fees'],
    excluded: ['Flights', 'Insurance', 'Camel ride ($20)'],
    photos: [img.yolyn2, img.dunes2, img.bayan2, img.camel3, img.ger2],
    days: [
      ['Ulaanbaatar', 'Drive south to Dalanzadgad', 'Long but mostly paved, 9 h.', 9, 'Tourist ger camp', 'L · D', T, T, T],
      ['Yolyn Am', 'Yolyn Am ice gorge', 'Walk the gorge, afternoon at the natural history museum.', 1, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Khongor Els', 'To the singing dunes', '5 h on gravel, sunset climb.', 5, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Bayanzag', 'Flaming Cliffs', 'Golden-hour walk along the cliffs.', 4.5, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Baga Gazriin Chuluu', 'Granite range on the way north', 'Short hike and the last camp night.', 5, 'Tourist ger camp', 'B · L · D', F, T, T],
      ['Ulaanbaatar', 'Back to Ulaanbaatar', '4 h, arrive mid-afternoon.', 4, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'COMFORT', 'Best price for the big three', '', 0.97],
      ['PRO', 'ITINERARY', 'Departs every Monday', '', 0.95],
      ['PRO', 'LODGING', 'Hot shower 4 of 5 nights', '', 0.86],
      ['CON', 'COMFORT', '12 people in one van', 'Tight on long days', 0.93],
      ['CON', 'ITINERARY', 'One night at the dunes only', '', 0.97],
      ['CON', 'COMFORT', '9 h drive on day 1', '', 0.96]
    ],
    past: ['2025-06-02', '2025-07-07', '2025-08-04', '2026-06-01', '2026-07-06', '2026-08-03'],
    future: ['2027-06-07', '2027-07-05', '2027-08-02'],
    seats: 12,
    reviewTexts: [
      'Cramped van but great value. They were upfront about it.',
      'One night at the dunes is not enough — but they told us, so fair.',
      'Good guide, decent food, a long first day.'
    ]
  },
  {
    slug: 'gobi-photographers-route-9-days',
    op: 'khangai',
    titleEn: "Gobi photographers' route, 9 days by 4×4",
    titleMn: 'Гэрэл зурагчдын Говийн маршрут, 9 хоног',
    region: 'Ömnögovi',
    area: 'GOBI',
    season: 'May – October',
    minGroup: 2,
    maxGroup: 4,
    difficulty: 'MODERATE',
    vehicle: 'Land Cruiser 105',
    sleeping: 'Camping + herder gers',
    lodging: ['Tent', 'Herder family ger'],
    summary:
      'A private 4×4 route timed to the light, not to the camps: we pitch tents where the golden hour is best and spend two nights with a herder family. No hotel nights and no hot showers after Ulaanbaatar.',
    summaryMn:
      'Гэрлийн цагт тааруулсан хувийн маршрут: алтан цаг хамгийн сайхан газарт майхан барина, малчин айлд хоёр хононо. Улаанбаатараас хойш зочид буудал, халуун шүршүүр байхгүй.',
    price: 2340,
    km: 1900,
    unpaved: 80,
    views: 980,
    included: ['Private Land Cruiser, driver, cook', 'Photographer-guide', 'Tents, mats, all meals', 'Park fees'],
    excluded: ['Flights', 'Insurance', 'Camera gear'],
    photos: [img.dunes4, img.bayan3, img.camel2, img.dunes5, img.bayan4],
    days: [
      ['Ulaanbaatar', 'Out of the city, first camp at Baga Gazriin Chuluu', 'Sunset over the granite.', 5, 'Tent', 'L · D', F, T, F],
      ['Tsagaan Suvarga', 'White cliffs', 'Long drive, camp on the cliff edge.', 7, 'Tent', 'B · L · D', F, F, F],
      ['Yolyn Am', 'Ice gorge at dawn', 'Morning shoot, afternoon rest.', 2, 'Tent', 'B · L · D', F, F, F],
      ['Khongor Els', 'Dunes, first night', 'Drive to the far end of the dunes.', 8, 'Tent', 'B · L · D', F, F, F],
      ['Khongor Els', 'Dunes, second night', 'Sunrise and sunset, camels.', 0, 'Herder family ger', 'B · L · D', F, F, F],
      ['Khongor Els', 'With the herder family', 'Herding at dawn.', 0, 'Herder family ger', 'B · L · D', F, F, F],
      ['Bayanzag', 'Flaming Cliffs', 'Golden hour at the cliffs.', 5, 'Tent', 'B · L · D', F, T, F],
      ['Ongi', 'Ongi monastery ruins', 'Night sky shoot.', 5, 'Tent', 'B · L · D', F, F, F],
      ['Ulaanbaatar', 'Back to Ulaanbaatar', 'Long last day.', 8, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Camps timed to golden hour', '', 0.98],
      ['PRO', 'ITINERARY', 'Two nights with a herder family', '', 0.97],
      ['PRO', 'GUIDE', 'Guide is a working photographer', '', 0.96],
      ['CON', 'LODGING', 'No hot shower, long-drop toilets', 'All 8 nights', 0.98],
      ['CON', 'COMFORT', '8 h drives on days 4 and 9', '', 0.95],
      ['CON', 'COMFORT', 'Camping in wind and dust', '', 0.94]
    ],
    past: ['2025-09-01', '2026-05-20', '2026-09-10'],
    future: ['2027-05-20', '2027-09-10'],
    seats: 4,
    reviewTexts: [
      'The best light of my life. Brutal, dusty, perfect — exactly as described.',
      'No showers for 8 days. They warned us three times, and it was worth it.'
    ]
  },
  {
    slug: 'central-khangai-hot-springs-7-days',
    op: 'khangai',
    titleEn: 'Central Khangai: Orkhon waterfall & Tsenkher hot springs, 7 days',
    titleMn: 'Төв Хангай: Орхоны хүрхрээ ба Цэнхэрийн рашаан, 7 хоног',
    region: 'Arkhangai',
    area: 'CENTRAL',
    season: 'June – September',
    minGroup: 2,
    maxGroup: 6,
    difficulty: 'EASY_MODERATE',
    vehicle: 'Land Cruiser 105',
    sleeping: 'Ger camps',
    lodging: ['Tourist ger camp'],
    summary:
      'Green Mongolia: the Orkhon valley, the Ulaan Tsutgalan waterfall, two nights soaking at Tsenkher hot springs and Erdene Zuu on the way back. Easy walking, comfortable camps.',
    summaryMn:
      'Ногоон Монгол: Орхоны хөндий, Улаан цутгалан хүрхрээ, Цэнхэрийн рашаанд хоёр шөнө, буцахдаа Эрдэнэ Зуу. Хөнгөн алхалт, тав тухтай кемпүүд.',
    price: 1150,
    km: 1200,
    unpaved: 45,
    views: 1270,
    included: ['Land Cruiser and driver', 'Guide', 'Ger camps, all meals', 'Hot spring entry'],
    excluded: ['Flights', 'Insurance', 'Massage at the springs'],
    photos: [img.orkhon1, img.erdene4, img.orkhon3, img.orkhon4],
    days: [
      ['Ulaanbaatar', 'To Khögnö Khan', 'Paved, 4 h, sand dunes in the steppe.', 4, 'Tourist ger camp', 'L · D', T, T, T],
      ['Orkhon valley', 'Into the Orkhon valley', 'Gravel for the last 3 h.', 6, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Orkhon valley', 'Ulaan Tsutgalan waterfall', 'Walk to the falls and the gorge.', 1, 'Tourist ger camp', 'B · L · D', T, F, T],
      ['Tsenkher', 'To Tsenkher hot springs', 'Over the pass to Arkhangai.', 5, 'Hot spring ger camp', 'B · L · D', T, T, T],
      ['Tsenkher', 'Rest day at the springs', 'Soak, walk, sleep.', 0, 'Hot spring ger camp', 'B · L · D', T, T, T],
      ['Kharkhorin', 'Erdene Zuu monastery', 'The oldest surviving monastery in Mongolia.', 3, 'Tourist ger camp', 'B · L · D', T, T, T],
      ['Ulaanbaatar', 'Back to Ulaanbaatar', '6 h paved.', 6, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'LODGING', 'Two nights at the hot springs', '', 0.97],
      ['PRO', 'COMFORT', 'Hot shower every night', '', 0.95],
      ['PRO', 'GUIDE', 'Guide speaks English and German', '', 0.93],
      ['CON', 'COMFORT', '6 h gravel drive on day 2', '', 0.96],
      ['CON', 'ITINERARY', 'Waterfall can be low in dry years', '', 0.92],
      ['CON', 'COMFORT', 'Mosquitoes in the valley in July', '', 0.97]
    ],
    past: ['2025-07-20', '2026-06-21', '2026-08-16'],
    future: ['2027-06-20', '2027-07-18', '2027-08-15'],
    seats: 6,
    reviewTexts: [
      'Gentle, green and well organised. The springs were heavenly.',
      'Waterfall was a trickle in August — they did warn us.'
    ]
  },
  {
    slug: 'ulaanbaatar-and-terelj-3-days',
    op: 'bluepearl',
    titleEn: 'Ulaanbaatar & Terelj in 3 days',
    titleMn: 'Улаанбаатар ба Тэрэлж, 3 хоног',
    region: 'Töv',
    area: 'CENTRAL',
    season: 'All year',
    minGroup: 1,
    maxGroup: 10,
    difficulty: 'EASY',
    vehicle: 'Minivan',
    sleeping: 'Hotel + private ger',
    lodging: ['Hotel in town', 'Tourist ger camp'],
    summary:
      'A short stopover: city museums and Gandan monastery, then a night in a private ger in Terelj with a cultural show.',
    summaryMn:
      'Богино аялал: хотын музей, Гандан хийд, дараа нь Тэрэлжид хувийн гэрт хоноод соёлын тоглолт үзнэ.',
    price: 390,
    km: 180,
    unpaved: 10,
    views: 2210,
    included: ['Hotel 1 night', 'Private ger 1 night', 'Guide and transport', 'Cultural show'],
    excluded: ['Flights', 'Insurance', 'Lunches'],
    photos: [img.gandan2, img.gandan3, img.turtle3],
    days: [
      ['Ulaanbaatar', 'City day: Gandan, National Museum, Zaisan', 'Walking and short drives.', 1, 'Hotel in town', 'D', T, T, T],
      ['Terelj', 'To Terelj, private ger, cultural show', 'Afternoon show with throat singing.', 1.5, 'Private ger', 'B · D', T, T, T],
      ['Ulaanbaatar', 'Back to the city', 'Morning drive back.', 1.5, '—', 'B', F, T, T]
    ],
    claims: [
      ['PRO', 'LODGING', 'Private ger — not shared', '', 0.35],
      ['PRO', 'ITINERARY', 'Live throat-singing show', '', 0.5],
      ['PRO', 'GUIDE', 'Guide meets you at the hotel', '', 0.75],
      ['CON', 'ITINERARY', 'Short time in nature', '', 0.9],
      ['CON', 'COMFORT', 'City traffic can add an hour', '', 0.85],
      ['CON', 'LODGING', 'Hotel is 3-star', '', 0.9]
    ],
    past: ['2026-06-10', '2026-07-15', '2026-08-12'],
    future: ['2027-06-09', '2027-07-14'],
    seats: 10,
    reviewTexts: [
      "Our 'private' ger was shared with two other travellers. Disappointing.",
      'The show was recorded music, not live. City day was good though.',
      'Fine for a stopover, nothing special.'
    ]
  },
  // — submitted plans waiting in the admin review queue —
  {
    slug: 'altai-tavan-bogd-trek-12-days',
    op: 'altai',
    status: PLAN_STATUS.PENDING,
    titleEn: 'Altai Tavan Bogd trek, 12 days',
    titleMn: '',
    region: 'Bayan-Ölgii',
    area: 'WEST',
    season: 'July – August',
    minGroup: 2,
    maxGroup: 8,
    difficulty: 'HARD',
    vehicle: 'Domestic flight + UAZ',
    sleeping: 'Tents',
    lodging: ['Tent'],
    summary:
      'Fly to Ölgii, drive to the Tavan Bogd base camp and trek to the Potanin glacier.',
    summaryMn: '',
    price: 1890,
    views: 0,
    included: ['Flights UB–Ölgii', 'Guide', 'Tents'],
    excluded: ['Insurance'],
    photos: [],
    days: [
      ['Ölgii', 'Fly to Ölgii', 'Morning flight.', 0, 'Hotel in town', 'D', T, T, T],
      ['Tsengel', 'Drive to Tsengel', '', 6, 'Tent', 'B · L · D', F, F, F],
      ['Tavan Bogd base camp', 'To base camp', '', 4, 'Tent', 'B · L · D', F, F, F],
      ['Potanin glacier', 'Glacier hike', '', null, 'Tent', 'B · L · D', F, F, F],
      ['Potanin glacier', 'Malchin peak', '', null, 'Tent', 'B · L · D', F, F, F],
      ['Tavan Bogd base camp', 'Rest day', '', null, 'Tent', 'B · L · D', F, F, F],
      ['Khoton lake', 'To the lakes', '', null, 'Tent', 'B · L · D', F, F, F]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Guaranteed glacier walk', '', 0],
      ['PRO', 'GUIDE', 'Kazakh eagle-hunter visit', '', 0]
    ],
    past: [],
    future: ['2027-07-15'],
    seats: 8,
    reviewTexts: []
  },
  {
    slug: 'orkhon-valley-horse-trek-5-days',
    op: 'steppe',
    status: PLAN_STATUS.PENDING,
    titleEn: 'Orkhon valley horse trek, 5 days',
    titleMn: 'Орхоны хөндийгөөр морин аялал, 5 хоног',
    region: 'Övörkhangai',
    area: 'CENTRAL',
    season: 'June – September',
    minGroup: 2,
    maxGroup: 6,
    difficulty: 'MODERATE',
    vehicle: 'Horses + support UAZ',
    sleeping: 'Tents + herder ger',
    lodging: ['Tent', 'Herder family ger'],
    summary:
      'Four days in the saddle along the Orkhon river, with a support vehicle carrying the camp.',
    summaryMn:
      'Орхон голын дагуу морьтой дөрвөн өдөр, ачааг дагалдах машин зөөнө.',
    price: 640,
    km: 120,
    unpaved: 100,
    views: 0,
    included: ['Horses and wrangler', 'Support vehicle', 'Tents, all meals'],
    excluded: ['Insurance', 'Riding helmet'],
    photos: [img.orkhon2, img.orkhon3, img.orkhon4],
    days: [
      ['Kharkhorin', 'Meet the horses', '', 1, 'Herder family ger', 'L · D', F, T, F],
      ['Orkhon valley', 'Ride day 1', '', 0, 'Tent', 'B · L · D', F, F, F],
      ['Orkhon valley', 'Ride day 2', '', 0, 'Tent', 'B · L · D', F, F, F],
      ['Ulaan Tsutgalan', 'Ride to the waterfall', '', 0, 'Tent', 'B · L · D', F, F, F],
      ['Kharkhorin', 'Back to Kharkhorin', '', 2, '—', 'B · L', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Four full days riding', '', 0],
      ['PRO', 'GUIDE', 'Wrangler for every 3 riders', '', 0],
      ['PRO', 'COMFORT', 'Support car carries the bags', '', 0],
      ['CON', 'COMFORT', '5–6 h in the saddle daily', '', 0],
      ['CON', 'LODGING', 'No showers for 4 nights', '', 0],
      ['CON', 'COMFORT', 'Mongolian horses are small and spirited', '', 0]
    ],
    past: [],
    future: ['2027-06-15', '2027-07-20'],
    seats: 6,
    reviewTexts: []
  },
  {
    slug: 'eagle-hunters-of-bayan-olgii-7-days',
    op: 'bluepearl',
    status: PLAN_STATUS.PENDING,
    titleEn: 'Eagle hunters of Bayan-Ölgii, 7 days',
    titleMn: 'Баян-Өлгийн бүргэдчид, 7 хоног',
    region: 'Bayan-Ölgii',
    area: 'WEST',
    season: 'September – October',
    minGroup: 2,
    maxGroup: 8,
    difficulty: 'MODERATE',
    vehicle: 'Domestic flight + UAZ',
    sleeping: 'Kazakh family homes',
    lodging: ['Herder family ger', 'Hotel in town'],
    summary:
      'Stay with a Kazakh eagle-hunting family and see the Golden Eagle Festival in early October.',
    summaryMn:
      'Казах бүргэдчин айлд хоноод, 10-р сарын эхээр Алтан бүргэдийн наадмыг үзнэ.',
    price: 1450,
    km: 400,
    unpaved: 75,
    views: 0,
    included: ['Flights UB–Ölgii', 'Guide', 'Homestays, all meals', 'Festival tickets'],
    excluded: ['Insurance'],
    photos: [img.uaz],
    days: [
      ['Ölgii', 'Fly to Ölgii', '', 0, 'Hotel in town', 'D', T, T, T],
      ['Sagsai', "To the eagle hunter's home", '', 2, 'Kazakh family home', 'B · L · D', F, F, F],
      ['Sagsai', 'Hunting with eagles', '', 1, 'Kazakh family home', 'B · L · D', F, F, F],
      ['Ölgii', 'Golden Eagle Festival day 1', '', 2, 'Hotel in town', 'B · L · D', T, T, T],
      ['Ölgii', 'Golden Eagle Festival day 2', '', 0, 'Hotel in town', 'B · L · D', T, T, T],
      ['Tolbo lake', 'Tolbo lake', '', 2, 'Tent', 'B · L · D', F, F, F],
      ['Ulaanbaatar', 'Fly back', '', 1, '—', 'B', F, T, T]
    ],
    claims: [
      ['PRO', 'ITINERARY', 'Two nights with an eagle hunter', '', 0],
      ['PRO', 'ITINERARY', 'Festival tickets included', '', 0],
      ['PRO', 'GUIDE', 'Kazakh-speaking guide', '', 0],
      ['CON', 'COMFORT', 'Cold: −5 °C at night in October', '', 0],
      ['CON', 'LODGING', 'Outdoor toilets at the homestay', '', 0],
      ['CON', 'ITINERARY', 'Flights to Ölgii are often delayed', '', 0]
    ],
    past: [],
    future: ['2027-09-29'],
    seats: 8,
    reviewTexts: []
  }
];

export const seedDemo = async () => {
  if (!config.SEED_DEMO || (await OperatorModel.count())) return;
  const password = config.SEED_DEMO_PASSWORD;

  const ops = {} as Record<keyof typeof OPERATORS, string>;
  for (const [key, operator] of Object.entries(OPERATORS)) {
    const row = await OperatorModel.create({
      slug: key,
      ...operator,
      createdAt: D(`${operator.foundedYear}-03-01`)
    });
    ops[key as keyof typeof OPERATORS] = row.id;
  }

  await UserModel.create({
    name: 'itours Ops',
    email: 'admin@itours.mn',
    password,
    role: ROLES.MANAGER
  });
  for (const [name, email, phone, op] of OPERATOR_USERS) {
    await UserModel.create({
      name,
      email,
      phone,
      password,
      role: ROLES.OPERATOR,
      operatorId: ops[op]
    });
  }
  const travellers: UserModel[] = [];
  for (const [name, email, country] of TRAVELLERS) {
    travellers.push(
      await UserModel.create({ name, email, country, password, role: ROLES.USER })
    );
  }
  const [elena, ...others] = travellers;

  let codeN = 0x7a0000;
  const nextCode = () =>
    `ITR-${(codeN += 0x1a3f).toString(16).toUpperCase().slice(-6)}`;

  const planIds: Record<string, string> = {};
  for (const p of PLANS) {
    const plan = await PlanModel.create({
      slug: p.slug,
      operatorId: ops[p.op],
      titleEn: p.titleEn,
      titleMn: p.titleMn,
      region: p.region,
      area: p.area,
      season: p.season,
      days: p.days.length,
      minGroup: p.minGroup,
      maxGroup: p.maxGroup,
      difficulty: p.difficulty,
      vehicle: p.vehicle,
      sleeping: p.sleeping,
      lodging: p.lodging,
      summary: p.summary,
      summaryMn: p.summaryMn,
      priceUsd: p.price,
      groupPriceUsd: p.groupPrice?.[0] ?? null,
      groupPriceFrom: p.groupPrice?.[1] ?? null,
      singleSupplement: p.single ?? null,
      included: p.included,
      excluded: p.excluded,
      photos: p.photos,
      totalKm: p.km ?? null,
      unpavedPct: p.unpaved ?? null,
      status: p.status ?? PLAN_STATUS.PUBLISHED,
      views: p.views,
      submittedAt:
        p.status === PLAN_STATUS.PENDING ? daysAgo(pickOne([0.1, 1, 2])) : null
    });
    planIds[p.slug] = plan.id;
    await PlanDayModel.bulkCreate(
      p.days.map(
        ([place, title, description, driveHours, sleeping, meals, hotShower, signal, flushToilet], i) => ({
          planId: plan.id,
          dayNo: i + 1,
          place,
          title,
          description,
          driveHours,
          sleeping,
          meals,
          hotShower,
          signal,
          flushToilet
        })
      )
    );
    const claims = await ClaimModel.bulkCreate(
      p.claims.map(([kind, area, text, detail], sort) => ({
        planId: plan.id,
        kind,
        area,
        text,
        detail,
        sort
      }))
    );

    // past departures: completed trips, and most travellers leave a review
    for (const start of p.past) {
      const departure = await DepartureModel.create({
        planId: plan.id,
        startDate: start,
        seats: p.seats
      });
      let seatsLeft = p.seats;
      const groups = Math.max(2, Math.floor(p.seats / 2.5));
      for (let g = 0; g < groups && seatsLeft > 0; g++) {
        const pax = Math.min(seatsLeft, 1 + Math.floor(rand() * 3));
        seatsLeft -= pax;
        const user = pickOne(others);
        const cancelled = rand() < (p.op === 'bluepearl' ? 0.25 : 0.04);
        const booking = await BookingModel.create({
          code: nextCode(),
          userId: user.id,
          planId: plan.id,
          departureId: departure.id,
          pax,
          room: ROOM.TWIN,
          totalUsd: p.price * pax,
          method: pickOne([PAY_METHOD.CARD, PAY_METHOD.CARD, PAY_METHOD.QPAY, PAY_METHOD.BANK]),
          status: cancelled ? BOOKING_STATUS.CANCELLED : BOOKING_STATUS.CONFIRMED,
          cancelledBy: cancelled
            ? p.op === 'bluepearl'
              ? ROLES.OPERATOR
              : pickOne([ROLES.USER, ROLES.OPERATOR])
            : null,
          guide: 'Bat-Erdene T.',
          acceptedTradeoffs: true,
          createdAt: new Date(D(start).getTime() - (20 + rand() * 120) * 86400000)
        });
        if (cancelled || rand() < 0.15) continue;
        // each promise holds with its seeded probability; "partly" when it nearly held
        const ratings = claims.map((claim, i) => {
          const quality = p.claims[i][4];
          const r = rand();
          return {
            claimId: claim.id,
            score: r < quality ? 2 : r < quality + (1 - quality) / 2 ? 1 : 0
          };
        });
        const misses = ratings.filter((rating) => rating.score < 2).length;
        const review = await ReviewModel.create({
          bookingId: booking.id,
          userId: user.id,
          planId: plan.id,
          stars: Math.max(2, 5 - misses - (rand() < 0.2 ? 1 : 0)),
          text: pickOne(p.reviewTexts),
          createdAt: new Date(D(start).getTime() + (p.days.length + 2 + rand() * 10) * 86400000)
        });
        await ClaimRatingModel.bulkCreate(
          ratings.map((rating) => ({ ...rating, reviewId: review.id }))
        );
      }
    }

    // next season: departures on sale, bookings made over the last 12 weeks
    for (const start of p.future) {
      const departure = await DepartureModel.create({
        planId: plan.id,
        startDate: start,
        seats: p.seats
      });
      if (p.status === PLAN_STATUS.PENDING) continue;
      let seatsLeft = p.seats;
      const target = p.seats * (0.25 + rand() * 0.65);
      while (seatsLeft > 0 && p.seats - seatsLeft < target) {
        const pax = Math.min(seatsLeft, 1 + Math.floor(rand() * 3));
        seatsLeft -= pax;
        const r = rand();
        const status =
          r < 0.72
            ? BOOKING_STATUS.CONFIRMED
            : r < 0.86
              ? BOOKING_STATUS.PAID
              : r < 0.92
                ? BOOKING_STATUS.PENDING_PAYMENT
                : BOOKING_STATUS.CANCELLED;
        const confirmed = status === BOOKING_STATUS.CONFIRMED;
        await BookingModel.create({
          code: nextCode(),
          userId: pickOne(others).id,
          planId: plan.id,
          departureId: departure.id,
          pax,
          room: ROOM.TWIN,
          totalUsd: p.price * pax,
          method:
            status === BOOKING_STATUS.PENDING_PAYMENT
              ? PAY_METHOD.BANK
              : pickOne([PAY_METHOD.CARD, PAY_METHOD.QPAY]),
          status,
          cancelledBy: status === BOOKING_STATUS.CANCELLED ? ROLES.USER : null,
          acceptedTradeoffs: true,
          guide: confirmed ? pickOne(['Bat-Erdene T.', 'Oyuka D.', 'Tuguldur B.']) : '',
          driver: confirmed ? pickOne(['Ganbold S. · UAZ #3', 'Erdene P. · UAZ #1']) : '',
          notes:
            rand() < 0.3
              ? pickOne([
                  'One vegetarian.',
                  'Arriving the night before on MIAT OM 502.',
                  'Nut allergy.',
                  'Celebrating an anniversary!'
                ])
              : '',
          createdAt: daysAgo(rand() * 84)
        });
      }
    }
  }

  // the wireframe's story: Elena books the Gobi plan for 12 Jul 2027 and is the newest order in the inbox
  const gobiId = planIds[PLANS[0].slug];
  const jul12 = await DepartureModel.findOne({
    where: { planId: gobiId, startDate: '2027-07-12' },
    rejectOnEmpty: true
  });
  const taken = await BookingModel.sum('pax', {
    where: { departureId: jul12.id, status: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PAID, BOOKING_STATUS.PENDING_PAYMENT] }
  });
  if (taken > 4) await BookingModel.destroy({ where: { departureId: jul12.id } });
  await BookingModel.create({
    code: 'ITR-7F2K41',
    userId: elena.id,
    planId: gobiId,
    departureId: jul12.id,
    pax: 2,
    room: ROOM.TWIN,
    totalUsd: 2360,
    method: PAY_METHOD.CARD,
    status: BOOKING_STATUS.PAID,
    acceptedTradeoffs: true,
    createdAt: new Date(NOW.getTime() - 4 * 60000),
    notes:
      'One vegetarian. Both 1.80 m+ — asked about legroom in the UAZ. Arriving 11 Jul on MIAT OM 502, staying Hotel Nine.'
  });
  await SavedPlanModel.bulkCreate(
    [PLANS[0], PLANS[4], PLANS[5]].map((p) => ({
      userId: elena.id,
      planId: planIds[p.slug]
    }))
  );
  // a finished trip Elena hasn't rated yet, to demo the review form
  const tereljId = planIds[PLANS[3].slug];
  const sep19 = await DepartureModel.findOne({
    where: { planId: tereljId, startDate: '2026-09-19' },
    rejectOnEmpty: true
  });
  await BookingModel.create({
    code: 'ITR-6Y1A07',
    userId: elena.id,
    planId: tereljId,
    departureId: sep19.id,
    pax: 1,
    room: ROOM.TWIN,
    totalUsd: 210,
    method: PAY_METHOD.CARD,
    status: BOOKING_STATUS.CONFIRMED,
    acceptedTradeoffs: true,
    guide: 'Oyuka D.',
    createdAt: D('2026-08-30')
  });

  const [plans, bookings, reviews] = await Promise.all([
    PlanModel.count(),
    BookingModel.count(),
    ReviewModel.count()
  ]);
  console.log(`🌱 Seeded demo: ${plans} plans, ${bookings} bookings, ${reviews} reviews`);
};
