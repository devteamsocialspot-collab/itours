"use client";

import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Photo, Score } from "@/components/app/ui";
import { useLocale, useT } from "@/lib/i18n";
import { AREAS } from "@/lib/plan/helpers";
import { locate, MONGOLIA, PLACE_NAMES } from "@/lib/plan/places";
import type { Area, Plan } from "@/lib/types";
import { pick, usd } from "@/lib/utils";

// the whole country on a 1000-unit canvas, projected like the route map (a degree of longitude × cos 47°)
const COS = Math.cos((47 * Math.PI) / 180);
const [W, PAD, LON0, LON1, LAT0, LAT1] = [1000, 24, 87.7, 120, 41.5, 52.2];
const k = (W - 2 * PAD) / ((LON1 - LON0) * COS);
const H = Math.round((LAT1 - LAT0) * k + 2 * PAD);
const X = (lon: number) => PAD + (lon - LON0) * COS * k;
const Y = (lat: number) => PAD + (LAT1 - lat) * k;
const OUTLINE = `M${MONGOLIA.map(([lon, lat]) => `${X(lon).toFixed(1)},${Y(lat).toFixed(1)}`).join("L")}Z`;
const STOPS = PLACE_NAMES.map(locate).filter((at) => at !== null);
const UB = locate("Ulaanbaatar")!;

const C = "https://upload.wikimedia.org/wikipedia/commons/thumb";
/** Each region's pin ([lat, lon]) and photo; the demo has none of the Altai or the east, so those get the drawn placeholder. */
const REGION: Record<Area, { at: [number, number]; photo?: string }> = {
  WEST: { at: [48.7, 89.9] },
  NORTH: { at: [50.4, 100.2], photo: `${C}/5/55/Lake_Kh%C3%B6vsg%C3%B6l%2C_Mongolia.jpg/1280px-Lake_Kh%C3%B6vsg%C3%B6l%2C_Mongolia.jpg` },
  CENTRAL: { at: [47.1, 102.8], photo: `${C}/c/c6/Erdene_Zuu_Monastery_07.jpg/1280px-Erdene_Zuu_Monastery_07.jpg` },
  GOBI: { at: [43.8, 103.6], photo: `${C}/6/67/Camels_in_Gobi_Desert_01.jpg/1280px-Camels_in_Gobi_Desert_01.jpg` },
  EAST: { at: [47.3, 112.6] },
};

/** The landing's map: a pin per region; picking one shows what it is known for and its best trips. */
export function RegionExplorer({ plans }: { plans: Plan[] }) {
  const t = useT();
  const { locale } = useLocale();
  const inArea = (area: Area) => plans.filter((plan) => plan.area === area);
  // opens on the region with the most trips
  const [active, setActive] = useState<Area>(() => AREAS.reduce((a, b) => (inArea(b).length > inArea(a).length ? b : a)));
  const trips = inArea(active);
  const name = t(`regions.${active}.name`);

  return (
    <div className="explore reveal">
      <div>
        <div className="map-box">
          <div className="map-canvas">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("home.exploreTitle")}>
              <path d={OUTLINE} className="map-land" />
              {STOPS.map(([lat, lon]) => (
                <circle key={`${lat},${lon}`} cx={X(lon)} cy={Y(lat)} r={4} className="map-dot" />
              ))}
              <circle cx={X(UB[1])} cy={Y(UB[0])} r={9} className="map-ub" />
              <text x={X(UB[1]) + 15} y={Y(UB[0]) + 7} className="map-ub-label">
                {pick(locale, "Ulaanbaatar", "Улаанбаатар")}
              </text>
            </svg>
            {AREAS.map((area) => {
              const [lat, lon] = REGION[area].at;
              return (
                <button
                  key={area}
                  type="button"
                  className="map-pin"
                  style={{ left: `${(X(lon) / W) * 100}%`, top: `${(Y(lat) / H) * 100}%` }}
                  aria-pressed={area === active}
                  onClick={() => setActive(area)}
                >
                  <span>
                    {t(`operatorPage.area.${area}`)} · {inArea(area).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="row small muted" style={{ marginTop: 12, gap: 6 }}>
          <MapPin size={14} />
          {t("home.startUb")}
        </div>
      </div>

      <div className="region-panel" key={active}>
        <Photo src={REGION[active].photo} alt={name} />
        <div className="region-body">
          <div className="eyebrow">{trips.length === 1 ? t("home.trips1") : t("home.tripsN", { n: trips.length })}</div>
          <h3>{name}</h3>
          <p>{t(`regions.${active}.tagline`)}</p>
          <div className="wrap-row">
            {t(`regions.${active}.highlights`)
              .split("|")
              .map((item) => (
                <span key={item} className="tag tag-neutral">
                  {item}
                </span>
              ))}
          </div>
          <div className="row small" style={{ gap: 6 }}>
            <CalendarDays size={14} />
            {t("home.bestSeason")}: <b>{t(`regions.${active}.season`)}</b>
          </div>
          <div className="col">
            {trips.slice(0, 3).map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.slug}`} className="mini-plan">
                <Photo src={plan.photos[0]} alt={plan.region} />
                <div style={{ minWidth: 0 }}>
                  <div className="mini-title">{pick(locale, plan.titleEn, plan.titleMn)}</div>
                  <div className="xs muted">
                    {t("plan.nDays", { n: plan.days })} · {usd(plan.priceUsd)}
                  </div>
                </div>
                <Score value={plan.score} size={34} />
              </Link>
            ))}
            {trips.length === 0 && <p className="muted small">{t("home.noTripsHere")}</p>}
          </div>
          {trips.length > 0 && (
            <Link href={`/search?area=${active}`} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              {t("home.seeRegion", { r: name })} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
