import { getDb } from "@/lib/db";
import { handleRouteError, json } from "@/lib/api";
import { upsertUserSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, username } = upsertUserSchema.parse(body);
    const db = getDb();

    const user = await db.user.upsert({
      where: { address },
      create: {
        address,
        username,
      },
      update: {
        username,
      },
    });

    return json(user, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
