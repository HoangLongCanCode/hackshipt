import { handle, ok } from '@/lib/server/http';
import { destroySession } from '@/lib/server/session';

export async function POST() {
  return handle(async () => {
    destroySession();
    return ok({});
  });
}
