"use client";

import { useId } from "react";
import { useT } from "@/lib/i18n";
import { locate, MONGOLIA, placeKey } from "@/lib/plan/places";
import type { PlanDay } from "@/lib/types";

const PAD = 46;
/** Degrees of longitude shrink with latitude; at Mongolia's middle (47°N) one is ~0.68 of one of latitude. */
const COS = Math.cos((47 * Math.PI) / 180);
const R = 9;
const FONT = 21;

type Stop = { key: string; place: string; lat: number; lon: number };
type Box = { x1: number; y1: number; x2: number; y2: number };
const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/** "1", "3–4", "1, 8": the days spent at one stop. */
const dayRuns = (days: number[]) => {
  const runs: string[] = [];
  for (let i = 0; i < days.length; i++) {
    let j = i;
    while (j + 1 < days.length && days[j + 1] === days[j] + 1) j++;
    runs.push(i === j ? `${days[i]}` : `${days[i]}–${days[j]}`);
    i = j;
  }
  return runs.join(", ");
};

/** The point `gap` back from (bx, by) towards (ax, ay). */
const trim = (ax: number, ay: number, bx: number, by: number, gap: number) => {
  const l = Math.hypot(bx - ax, by - ay) || 1;
  return [bx - ((bx - ax) / l) * gap, by - ((by - ay) / l) * gap];
};

/**
 * One drawing of the route on a `width`-unit canvas. Labels keep their size in canvas units, so the
 * phone layout draws on a narrower canvas to keep them legible once the SVG is scaled down.
 */
function RouteCanvas({ route, dayAt, width: W, heights: [minH, maxH], className }: { route: Stop[]; dayAt: Map<string, number[]>; width: number; heights: [number, number]; className: string }) {
  const t = useT();
  const arrow = useId();

  // the route's box, padded and at least 2.4 projected degrees wide; a north–south route gets a taller frame
  const px = (lon: number) => lon * COS;
  const py = (lat: number) => -lat;
  let minX = Math.min(...route.map((s) => px(s.lon))) - 1.1;
  let maxX = Math.max(...route.map((s) => px(s.lon))) + 1.1;
  let minY = Math.min(...route.map((s) => py(s.lat))) - 0.7;
  let maxY = Math.max(...route.map((s) => py(s.lat))) + 0.7;
  const grow = (lo: number, hi: number, span: number) => [lo - (span - (hi - lo)) / 2, hi + (span - (hi - lo)) / 2];
  if (maxX - minX < 2.4) [minX, maxX] = grow(minX, maxX, 2.4);
  const H = Math.round(Math.min(maxH, Math.max(minH, (W - 2 * PAD) / ((maxX - minX) / (maxY - minY)) + 2 * PAD)));
  const frame = (W - 2 * PAD) / (H - 2 * PAD);
  if ((maxX - minX) / (maxY - minY) > frame) [minY, maxY] = grow(minY, maxY, (maxX - minX) / frame);
  else [minX, maxX] = grow(minX, maxX, (maxY - minY) * frame);
  const k = (W - 2 * PAD) / (maxX - minX);
  const X = (lon: number) => PAD + (px(lon) - minX) * k;
  const Y = (lat: number) => PAD + (py(lat) - minY) * k;

  const outline = `M${MONGOLIA.map(([lon, lat]) => `${X(lon).toFixed(1)},${Y(lat).toFixed(1)}`).join("L")}Z`;
  const points = route.map((s) => ({ ...s, x: X(s.lon), y: Y(s.lat) }));

  // legs: a gentle curve, trimmed so the arrow stops at the marker's edge. The bend is measured from the
  // pair's west end, so A→B and a later B→A bow to opposite sides instead of drawing over each other.
  const drawn = new Map<string, number>();
  const legs = points.slice(1).map((to, i) => {
    const from = points[i];
    const [a, b] = from.x <= to.x ? [from, to] : [to, from];
    const pair = `${a.key}>${b.key}`;
    const repeat = drawn.get(pair) ?? 0;
    drawn.set(pair, repeat + 1);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = (repeat % 2 ? -1 : 1) * Math.min(60, len * 0.18);
    const cx = (a.x + b.x) / 2 - (dy / len) * bend;
    const cy = (a.y + b.y) / 2 + (dx / len) * bend;
    const [sx, sy] = trim(cx, cy, from.x, from.y, R + 3);
    const [ex, ey] = trim(cx, cy, to.x, to.y, R + 5);
    return `M${sx.toFixed(1)},${sy.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  });

  // one marker per place; its label goes right, left, above or below — the first spot that is free
  const stops = points.filter((p, i) => points.findIndex((q) => q.key === p.key) === i);
  const taken: Box[] = stops.map((s) => ({ x1: s.x - R - 4, y1: s.y - R - 4, x2: s.x + R + 4, y2: s.y + R + 4 }));
  const labels = stops.map((s, own) => {
    const days = `${t("plan.dayShort")}${dayRuns(dayAt.get(s.key) ?? [])}`;
    const w = s.place.length * FONT * 0.56 + (days.length + 3) * FONT * 0.48;
    const spots = [
      { x: s.x + 16, y: s.y + 7, anchor: "start" as const, box: { x1: s.x + 14, x2: s.x + 18 + w } },
      { x: s.x - 16, y: s.y + 7, anchor: "end" as const, box: { x1: s.x - 18 - w, x2: s.x - 14 } },
      { x: s.x, y: s.y - 18, anchor: "middle" as const, box: { x1: s.x - w / 2, x2: s.x + w / 2 } },
      { x: s.x, y: s.y + 34, anchor: "middle" as const, box: { x1: s.x - w / 2, x2: s.x + w / 2 } },
    ].map((spot) => ({ ...spot, box: { ...spot.box, y1: spot.y - FONT + 2, y2: spot.y + 5 } }));
    const free = (box: Box) => box.x1 > 4 && box.x2 < W - 4 && taken.every((b, i) => i === own || !overlaps(b, box));
    let spot = spots.find((c) => free(c.box));
    // all four taken: under the right-hand spot, a line at a time
    for (let step = 1; !spot && step < 8; step++) {
      const box = { ...spots[0].box, y1: spots[0].box.y1 + step * 24, y2: spots[0].box.y2 + step * 24 };
      if (free(box)) spot = { ...spots[0], y: spots[0].y + step * 24, box };
    }
    spot ??= spots[0];
    taken.push(spot.box);
    return { ...s, days, spot };
  });

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={t("plan.routeMap")}
      style={{ width: "100%", height: "auto", borderRadius: 18 }}
    >
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent-700)" />
        </marker>
      </defs>
      <rect width={W} height={H} fill="var(--color-neutral-300)" />
      <path d={outline} fill="var(--color-bg)" stroke="var(--color-neutral-500)" strokeWidth={2} strokeLinejoin="round" />
      {legs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--color-accent-700)" strokeWidth={3} markerEnd={`url(#${arrow})`} />
      ))}
      {labels.map((s, i) => (
        <circle
          key={s.key}
          cx={s.x}
          cy={s.y}
          r={i === 0 ? R + 2 : R}
          fill={i === 0 ? "var(--color-accent)" : "var(--color-bg)"}
          stroke="var(--color-accent-700)"
          strokeWidth={3}
        />
      ))}
      {/* labels last, so no leg is drawn across one */}
      {labels.map((s) => (
        <text
          key={s.key}
          x={s.spot.x}
          y={s.spot.y}
          textAnchor={s.spot.anchor}
          fontSize={FONT}
          fontWeight={700}
          fill="var(--color-text)"
          stroke="var(--color-bg)"
          strokeWidth={5}
          paintOrder="stroke"
        >
          {s.place}
          <tspan fontWeight={400} fill="var(--color-neutral-700)">
            {" · "}
            {s.days}
          </tspan>
        </text>
      ))}
    </svg>
  );
}

/**
 * The plan's route on a map of Mongolia (after the drawn route maps tour operators put on their trip
 * pages): every day's place the gazetteer knows, in order, joined by arrows. The view crops to the route
 * so a weekend near Ulaanbaatar is as readable as a crossing of the Gobi. Renders nothing under two stops.
 */
export function RouteMap({ days, compact }: { days: Pick<PlanDay, "dayNo" | "place">[]; compact?: boolean }) {
  const t = useT();

  // the route: consecutive days in one place are one stop
  const route: Stop[] = [];
  const dayAt = new Map<string, number[]>();
  for (const d of days) {
    const at = locate(d.place);
    if (!at) continue;
    const key = placeKey(d.place);
    dayAt.set(key, [...(dayAt.get(key) ?? []), d.dayNo]);
    if (route.at(-1)?.key !== key) route.push({ key, place: d.place, lat: at[0], lon: at[1] });
  }
  if (route.length < 2) return null;

  return (
    <figure style={{ margin: compact ? "0 0 12px" : "0 0 18px" }}>
      <RouteCanvas route={route} dayAt={dayAt} width={1000} heights={[380, 560]} className="map-wide" />
      <RouteCanvas route={route} dayAt={dayAt} width={560} heights={[420, 640]} className="map-narrow" />
      <figcaption>{t("plan.routeMapNote")}</figcaption>
    </figure>
  );
}
