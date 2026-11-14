import { handle, ok, readJson } from '@/lib/server/http';
import { loginSchema } from '@/lib/contracts';
import { db } from '@/lib/server/db';
import { createSession } from '@/lib/server/session';
import { loadMe } from '@/lib/server/mappers';

export async function POST(req: Request) {
  return handle(async () => {
    const input = loginSchema.parse(await readJson(req));
    const email = input.email.toLowerCase();
    const local = email.split('@')[0].replace(/[._-]+/g, ' ');
    const fallback = local.charAt(0).toUpperCase() + local.slice(1);
    const user = await db.user.upsert({
      where: { email },
      update: input.displayName ? { displayName: input.displayName } : {},
      create: { email, displayName: input.displayName ?? fallback },
    });
    await createSession(user.id);
    return ok(await loadMe(user.id));
  });
}
