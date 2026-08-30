import { isAuthConfigured } from "../../../_lib/server/auth";
import { isDatabaseConfigured } from "../../../_lib/server/database";

export async function GET() {
  return Response.json({
    databaseConfigured: isDatabaseConfigured(),
    authConfigured: isAuthConfigured(),
  });
}
