import { handle, ok, readJson } from '@/lib/server/http';
import { patchMeSchema } from '@/lib/contracts';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import { loadMe } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => ok(await loadMe((await requireUser()).id)));
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = patchMeSchema.parse(await readJson(req));
    await db.$transaction(async (tx) => {
      if (input.displayName !== undefined || input.bio !== undefined || input.favoriteArtist !== undefined || input.hobby !== undefined) {
        await tx.user.update({ where: { id: user.id }, data: { displayName: input.displayName, bio: input.bio, favoriteArtist: input.favoriteArtist, hobby: input.hobby } });
      }
      if (input.interestSlugs) {
        const found = await tx.interest.findMany({ where: { slug: { in: input.interestSlugs } } });
        await tx.userInterest.deleteMany({ where: { userId: user.id } });
        for (const i of found) await tx.userInterest.create({ data: { userId: user.id, interestId: i.id } });
      }
    });
    return ok(await loadMe(user.id));
  });
}
