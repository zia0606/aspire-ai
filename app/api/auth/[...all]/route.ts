import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "../../../_lib/server/auth";

function unavailable() {
  return Response.json(
    {
      error: "Cloud accounts are not configured yet. Aspire AI is still available in local mode.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request: Request) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).POST(request);
}
