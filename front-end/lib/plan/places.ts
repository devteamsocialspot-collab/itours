/**
 * What the plan page's route map is drawn from.
 *
 * MONGOLIA: the country's border as [lon, lat], from Natural Earth 1:50m (public domain), simplified
 * with Douglas–Peucker at 0.08° — a sketch's outline, not a survey's.
 */
export const MONGOLIA: [number, number][] = [
  [87.81, 49.16], [88.12, 49.26], [88.19, 49.45], [89.11, 49.5], [89.65, 49.72], [89.64, 49.9], [90.05, 50.09], [91.41, 50.47],
  [91.8, 50.69], [92.19, 50.7], [92.35, 50.86], [92.63, 50.69], [92.94, 50.78], [93.1, 50.6], [94.25, 50.56], [94.36, 50.22],
  [94.61, 50.02], [95.52, 49.91], [96.07, 50], [97.36, 49.74], [98.17, 50.18], [98.28, 50.53], [98.03, 50.65], [97.84, 51.05],
  [98.04, 51.45], [98.64, 51.8], [98.89, 52.12], [99.92, 51.76], [102.11, 51.35], [102.29, 50.58], [103.3, 50.2], [104.08, 50.15],
  [105.38, 50.47], [106.71, 50.31], [107.23, 49.99], [107.92, 49.95], [107.97, 49.65], [108.61, 49.32], [110.71, 49.14], [111.34, 49.36],
  [112.81, 49.52], [113.45, 49.94], [114.3, 50.27], [114.74, 50.23], [115.43, 49.9], [116.35, 49.98], [116.68, 49.82], [115.82, 48.58],
  [115.79, 48.25], [115.52, 48.13], [115.62, 47.87], [115.9, 47.69], [116.23, 47.86], [116.76, 47.87], [117.35, 47.65], [117.77, 47.99],
  [118.5, 47.98], [119.71, 47.15], [119.9, 46.73], [119.71, 46.61], [118.84, 46.76], [117.74, 46.52], [117.44, 46.59], [117.33, 46.36],
  [116.56, 46.29], [116.2, 45.74], [115.68, 45.46], [114.56, 45.39], [114.08, 44.97], [113.59, 44.75], [112.71, 44.88], [112.41, 45.06],
  [111.9, 45.06], [111.62, 44.83], [111.4, 44.37], [111.93, 43.71], [111.01, 43.34], [110.4, 42.77], [109.34, 42.44], [106.77, 42.29],
  [104.98, 41.6], [104.5, 41.66], [104.5, 41.88], [103.71, 41.75], [103.07, 42.01], [102.16, 42.16], [101.49, 42.54], [99.98, 42.68],
  [99.47, 42.57], [97.21, 42.79], [96.39, 42.72], [96.3, 42.93], [95.86, 43.28], [95.53, 43.95], [95.33, 44.04], [95.35, 44.28],
  [94.71, 44.35], [93.52, 44.94], [90.88, 45.2], [90.66, 45.53], [91, 46.04], [90.91, 46.27], [91.03, 46.57], [90.33, 47.66],
  [90.03, 47.88], [89.78, 47.83], [89.48, 48.03], [89.05, 48], [88.58, 48.22], [88.52, 48.38], [87.98, 48.55], [88.06, 48.71],
  [87.74, 48.88], [87.86, 48.97], [87.82, 49.12]
];

/**
 * Approximate [lat, lon] of the stops tour plans use, keyed by every name an agency might type
 * (English, transliteration variants, Mongolian). A place that isn't here is simply left off the map.
 */
// ponytail: a fixed gazetteer; give PlanDay lat/lng columns (picked on a map in the editor) when agencies outgrow it
const PLACES: [names: string[], lat: number, lon: number][] = [
  [["Ulaanbaatar", "Ulan Bator", "UB", "Улаанбаатар"], 47.92, 106.92],
  [["Terelj", "Gorkhi-Terelj", "Turtle Rock", "Тэрэлж"], 47.9, 107.43],
  [["Genghis Khan Statue", "Chinggis Khaan Statue", "Tsonjin Boldog"], 47.81, 107.53],
  [["Hustai", "Khustai", "Hustai National Park", "Хустай"], 47.7, 105.88],
  [["Zuunmod", "Manzushir"], 47.71, 106.95],
  [["Baga Gazriin Chuluu", "Бага газрын чулуу"], 46.21, 106.03],
  [["Mandalgovi"], 45.76, 106.27],
  [["Tsagaan Suvarga", "White Stupa", "Цагаан суварга"], 44.59, 105.77],
  [["Dalanzadgad"], 43.57, 104.42],
  [["Yolyn Am", "Yol Valley", "Ёлын ам"], 43.49, 104.07],
  [["Khongor Els", "Khongoryn Els", "Хонгорын элс"], 43.78, 102.35],
  [["Bayanzag", "Flaming Cliffs", "Баянзаг"], 44.14, 103.73],
  [["Ongi", "Ongi Monastery", "Онгийн хийд"], 45.34, 104.0],
  [["Kharkhorin", "Karakorum", "Erdene Zuu", "Хархорин"], 47.2, 102.83],
  [["Khögnö Khan", "Elsen Tasarkhai", "Bayan Gobi", "Mini Gobi"], 47.4, 103.65],
  [["Ögii Lake", "Ugii Lake", "Ögii nuur"], 47.77, 102.77],
  [["Orkhon valley", "Orkhon", "Орхоны хөндий"], 46.85, 102.1],
  [["Ulaan Tsutgalan", "Orkhon waterfall", "Улаан цутгалан"], 46.79, 101.96],
  [["Tsenkher", "Tsenkher hot springs", "Цэнхэр"], 47.32, 101.65],
  [["Tsetserleg"], 47.47, 101.45],
  [["Terkhiin Tsagaan", "Terkhiin Tsagaan Lake", "Khorgo"], 48.17, 99.72],
  [["Mörön", "Moron", "Мөрөн"], 49.64, 100.16],
  [["Khatgal", "Хатгал"], 50.44, 100.16],
  [["Khövsgöl", "Lake Khövsgöl", "Khuvsgul", "Хөвсгөл"], 50.6, 100.25],
  [["Tsaatan camp", "Tsaatan", "Tsagaannuur", "Цаатан"], 51.35, 99.35],
  [["Ölgii", "Olgii", "Bayan-Ölgii", "Өлгий"], 48.97, 89.97],
  [["Sagsai"], 48.9, 89.66],
  [["Tsengel"], 48.94, 89.14],
  [["Tolbo lake", "Tolbo"], 48.58, 90.06],
  [["Khoton lake", "Khoton"], 48.67, 88.3],
  [["Tavan Bogd base camp", "Tavan Bogd"], 49.13, 87.98],
  [["Potanin glacier"], 49.15, 87.86],
  [["Khovd"], 48.01, 91.64],
  [["Uvs lake", "Uvs"], 50.33, 92.75],
  [["Chinggis city", "Öndörkhaan"], 47.32, 110.66],
  [["Dariganga"], 45.31, 113.86],
];

/** "Khövsgöl", "khovsgol" and "KHÖVSGÖL " are one key: lower case, no accents, no spaces or dashes. */
export const placeKey = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-zа-яёөү]/g, "");

const BY_KEY = new Map(PLACES.flatMap(([names, lat, lon]) => names.map((name) => [placeKey(name), [lat, lon] as const])));

/** One name per known place, for the editor's suggestions. */
export const PLACE_NAMES = PLACES.map(([names]) => names[0]);

/** [lat, lon] of a day's place, or null when the gazetteer doesn't know it. */
export const locate = (place: string) => BY_KEY.get(placeKey(place)) ?? null;
