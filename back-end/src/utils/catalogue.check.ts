/**
 * The one check for the catalogue cache, against the dev database:
 *   npx ts-node src/utils/catalogue.check.ts
 * A second read is served from the cache; a write clears it at once, and a write inside a transaction
 * clears it only when the transaction commits. The writes match no row, so nothing changes.
 */
import assert from 'node:assert/strict';

import sequelize, { connectDatabase } from '../config/database';
import { PlanModel } from '../models/plan/plan.model';
import { catalogue } from './catalogue';

const main = async () => {
  await connectDatabase();
  let loads = 0;
  const read = () => catalogue(async () => ++loads);
  const nobody = { where: { id: '00000000-0000-0000-0000-000000000000' } };

  await read();
  await read();
  assert.equal(loads, 1, 'the second read comes from the cache');

  await PlanModel.update({ views: 0 }, nobody);
  await read();
  assert.equal(loads, 2, 'a write clears the cache');

  await sequelize.transaction(async (transaction) => {
    await PlanModel.update({ views: 0 }, { ...nobody, transaction });
    await read();
    assert.equal(loads, 2, 'not before the commit');
  });
  await read();
  assert.equal(loads, 3, 'cleared once the transaction commits');

  console.log('catalogue.check ✓');
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
