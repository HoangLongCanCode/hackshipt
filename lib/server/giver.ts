import type { User } from '@prisma/client';
import { ApiError } from '@/lib/contracts';
import { db } from './db';

export const DEMO_GIVER_EMAIL = 'giver@rpgbirmingham.app';

/** Returns the caller's orgId. Demo shortcut: the demo giver is attached to the first org on first call. */
export async function requireGiverOrg(user: User): Promise<string> {
  if (user.orgId) return user.orgId;
  if (user.email.toLowerCase() === DEMO_GIVER_EMAIL) {
    const org = await db.org.findFirst({ orderBy: { id: 'asc' } });
    if (org) {
      await db.user.update({ where: { id: user.id }, data: { orgId: org.id } });
      return org.id;
    }
  }
  throw new ApiError('FORBIDDEN', 'Only quest givers can do that');
}
