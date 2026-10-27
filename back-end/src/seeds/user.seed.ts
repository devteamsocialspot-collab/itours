import config from '../config';
import { UserModel } from '../models/user/user.model';
import { ROLES } from '../types/user/role.type';

/** Idempotent: creates the first SUPER_ADMIN from SEED_ADMIN_* when that phone doesn't exist. Safe on every boot. */
export const seedAdmin = async () => {
  if (!config.SEED_ADMIN_PHONE || !config.SEED_ADMIN_PASSWORD) return;
  const [user, created] = await UserModel.findOrCreate({
    where: { phone: config.SEED_ADMIN_PHONE },
    defaults: {
      name: config.SEED_ADMIN_NAME,
      password: config.SEED_ADMIN_PASSWORD,
      role: ROLES.SUPER_ADMIN,
      isActive: true
    }
  });
  if (created) console.log(`🌱 Seeded SUPER_ADMIN ${user.phone}`);
};
