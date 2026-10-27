/**
 * The one check for the Expectation Score math; pure, no database:
 *   npx ts-node src/controllers/plan/plan.controller.check.ts
 */
import assert from 'node:assert/strict';

import { CLAIM_AREA } from '../../types/plan/plan.type';
import PlanController from './plan.controller';

const claim = (id: string, area: CLAIM_AREA, scores: number[]) => ({
  id,
  area,
  ratings: scores.map((score) => ({ score }))
});

// 2 = as described, 1 = partly, 0 = not; unrated is null, not 0
assert.equal(PlanController.scoreOf([]), null);
assert.equal(PlanController.scoreOf([2, 2, 2]), 100);
assert.equal(PlanController.scoreOf([2, 1]), 75);
assert.equal(PlanController.scoreOf([0, 0]), 0);

const claims = [
  claim('shower', CLAIM_AREA.LODGING, [2, 0, 1, 0]), // 38: the gap
  claim('dunes', CLAIM_AREA.ITINERARY, [2, 2, 2, 2]),
  claim('guide', CLAIM_AREA.GUIDE, [2, 2, 1, 2]),
  claim('new', CLAIM_AREA.COMFORT, [])
];
// the plan score pools every rating, so a well-rated promise outweighs a thin one
assert.equal(PlanController.planScore(claims), 75);
assert.deepEqual(PlanController.areaScores(claims), [
  { area: CLAIM_AREA.ITINERARY, score: 100 },
  { area: CLAIM_AREA.LODGING, score: 38 },
  { area: CLAIM_AREA.GUIDE, score: 88 },
  { area: CLAIM_AREA.COMFORT, score: null }
]);

// the worst promise, and what rewording it would do; nothing under 3 ratings counts as a gap
assert.deepEqual(PlanController.worstGap(claims), {
  claimId: 'shower',
  score: 38,
  misses: 3,
  total: 4,
  current: 75,
  ifFixed: 94
});
assert.equal(PlanController.worstGap([claim('thin', CLAIM_AREA.GUIDE, [0, 0])]), null);
assert.equal(PlanController.worstGap([claims[1]]), null);

// best match: an unreviewed plan sits at the prior, many reviews outweigh it, $500 costs a point
assert.equal(PlanController.rankValue(null, 0, 0), 80);
assert.equal(PlanController.rankValue(100, 5, 0), 90);
assert.ok(PlanController.rankValue(95, 40, 1180) > PlanController.rankValue(100, 1, 690));
assert.ok(PlanController.rankValue(90, 10, 500) > PlanController.rankValue(90, 10, 1000));

console.log('plan.controller.check ✓');
