import pg from "pg";

const { Pool } = pg;

const baseUrl = (process.env.ASPIRE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const oldEmail = process.env.ASPIRE_EXISTING_EMAIL;
const oldPassword = process.env.ASPIRE_EXISTING_PASSWORD;
const newEmail = process.env.ASPIRE_NEW_EMAIL;
const newPassword = process.env.ASPIRE_NEW_PASSWORD;
const newName = process.env.ASPIRE_NEW_NAME || "Aspire Smoke Test";

if (!oldEmail || !oldPassword || !newEmail || !newPassword) {
  console.error("Missing smoke-test credentials. Set ASPIRE_EXISTING_EMAIL, ASPIRE_EXISTING_PASSWORD, ASPIRE_NEW_EMAIL and ASPIRE_NEW_PASSWORD. Use an unused email for ASPIRE_NEW_EMAIL.");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("ASPIRE_NEW_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  absorb(response) {
    const values = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
    for (const value of values) {
      const first = value.split(";", 1)[0];
      const separator = first.indexOf("=");
      if (separator < 1) continue;
      const key = first.slice(0, separator).trim();
      const cookieValue = first.slice(separator + 1).trim();
      if (cookieValue) this.cookies.set(key, cookieValue);
      else this.cookies.delete(key);
    }
  }

  header() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }

  async fetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const cookie = this.header();
    if (cookie) headers.set("Cookie", cookie);
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    this.absorb(response);
    return response;
  }
}

async function json(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function postJson(jar, path, body) {
  const response = await jar.fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, data: await json(response) };
}

async function session(jar) {
  const response = await jar.fetch("/api/auth/get-session", { cache: "no-store" });
  return { response, data: await json(response) };
}

async function state(jar) {
  const response = await jar.fetch("/api/data/state", { cache: "no-store" });
  return { response, data: await json(response) };
}

const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
  : null;

async function findUser(email) {
  if (!database) return null;
  const result = await database.query('select id, email from "user" where lower(email) = lower($1)', [email]);
  return result.rows[0] || null;
}

async function accountRows(userId) {
  if (!database || !userId) return [];
  const result = await database.query('select * from "account" where "userId" = $1', [userId]);
  return result.rows;
}

async function storedProfile(userId) {
  if (!database || !userId) return null;
  const result = await database.query("select profile from aspire_profiles where user_id = $1", [userId]);
  return result.rows[0]?.profile ?? null;
}

async function main() {
  console.log(`Running Aspire auth smoke test against ${baseUrl}`);

  const oldBefore = await findUser(oldEmail);
  if (database) assert(oldBefore, "Existing account email was not found in Neon before the test.");
  const oldAccountsBefore = oldBefore ? await accountRows(oldBefore.id) : [];
  const oldProfileBefore = oldBefore ? await storedProfile(oldBefore.id) : null;

  if (database) {
    const newBefore = await findUser(newEmail);
    assert(!newBefore, "ASPIRE_NEW_EMAIL is already present in Neon. Use a genuinely unused email.");
  }

  const browser = new CookieJar();

  console.log("1/8 Existing-user login");
  let result = await postJson(browser, "/api/auth/sign-in/email", { email: oldEmail, password: oldPassword });
  assert(result.response.ok, `Existing-user sign-in failed (${result.response.status}).`);
  let current = await session(browser);
  assert(current.response.ok && current.data?.user?.id, "Existing-user session was not created.");
  if (oldBefore) assert(current.data.user.id === oldBefore.id, "Existing-user ID changed after login.");
  let oldState = await state(browser);
  assert(oldState.response.ok && oldState.data.mode === "cloud" && oldState.data.signedIn === true, "Existing user did not receive cloud state.");

  console.log("2/8 Rejected credentials");
  const wrongJar = new CookieJar();
  result = await postJson(wrongJar, "/api/auth/sign-in/email", { email: oldEmail, password: `${oldPassword}-wrong` });
  assert(!result.response.ok, "Wrong password unexpectedly created a session.");
  const shortJar = new CookieJar();
  result = await postJson(shortJar, "/api/auth/sign-up/email", { name: "Too Short", email: `short-${Date.now()}@example.invalid`, password: "1234567" });
  assert(!result.response.ok, "Seven-character signup password was unexpectedly accepted.");

  console.log("3/8 Logout blocks cloud writes");
  result = await postJson(browser, "/api/auth/sign-out", {});
  assert(result.response.ok, "Existing-user logout failed.");
  current = await session(browser);
  assert(!current.data?.user, "Session still has a user after logout.");
  result = await postJson(browser, "/api/data/state", { type: "applications", applications: [] });
  assert(result.response.status === 401, "Signed-out cloud save was not rejected with 401.");

  console.log("4/8 New signup");
  result = await postJson(browser, "/api/auth/sign-up/email", { name: newName, email: newEmail, password: newPassword });
  assert(result.response.ok, `New signup failed (${result.response.status}).`);
  current = await session(browser);
  assert(current.data?.user?.id, "New signup did not create a usable session.");
  const newUserId = current.data.user.id;
  if (database) {
    const newRows = await database.query('select id from "user" where lower(email) = lower($1)', [newEmail]);
    assert(newRows.rows.length === 1, `Expected exactly one new user row, found ${newRows.rows.length}.`);
    const linkedAccounts = await accountRows(newUserId);
    assert(linkedAccounts.length === 1, `Expected exactly one linked account row, found ${linkedAccounts.length}.`);
  }

  console.log("5/8 New-user cloud persistence");
  const marker = `smoke-${Date.now()}`;
  const application = {
    id: marker,
    company: "Aspire Smoke Test",
    role: "Persistence Marker",
    stage: "Saved",
    location: "Test",
    url: "",
    source: "Automated smoke test",
    nextAction: marker,
    dueDate: "",
    notes: "Safe temporary test marker for cloud persistence verification.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  result = await postJson(browser, "/api/data/state", { type: "applications", applications: [application] });
  assert(result.response.ok && result.data.saved === true, "New-user cloud save was not confirmed.");
  let newState = await state(browser);
  assert(newState.data.applications?.some?.((item) => item.id === marker), "Saved marker did not restore from Neon.");

  console.log("6/8 New-user logout and login restore");
  result = await postJson(browser, "/api/auth/sign-out", {});
  assert(result.response.ok, "New-user logout failed.");
  result = await postJson(browser, "/api/auth/sign-in/email", { email: newEmail, password: newPassword });
  assert(result.response.ok, "New-user login after logout failed.");
  newState = await state(browser);
  assert(newState.data.applications?.some?.((item) => item.id === marker), "New-user data did not restore after fresh login.");

  console.log("7/8 Same-browser account isolation (A → logout → B → logout → A)");
  result = await postJson(browser, "/api/auth/sign-out", {});
  assert(result.response.ok, "Second new-user logout failed.");
  result = await postJson(browser, "/api/auth/sign-in/email", { email: oldEmail, password: oldPassword });
  assert(result.response.ok, "Existing-user re-login failed.");
  oldState = await state(browser);
  assert(!oldState.data.applications?.some?.((item) => item.id === marker), "Account A received account B's cloud marker.");

  console.log("8/8 Existing Neon IDs/data remain intact");
  if (database && oldBefore) {
    const oldAfter = await findUser(oldEmail);
    const oldAccountsAfter = await accountRows(oldBefore.id);
    const oldProfileAfter = await storedProfile(oldBefore.id);
    assert(oldAfter?.id === oldBefore.id, "Existing user's Neon user ID changed.");
    assert(JSON.stringify(oldAccountsAfter.map((row) => row.id).sort()) === JSON.stringify(oldAccountsBefore.map((row) => row.id).sort()), "Existing user's account-row IDs changed.");
    assert(JSON.stringify(oldProfileAfter) === JSON.stringify(oldProfileBefore), "Existing user's stored profile changed during auth smoke test.");
  } else {
    console.log("DATABASE_URL not provided: row-count/ID assertions were skipped, but HTTP auth/state checks ran.");
  }

  console.log("✅ Aspire auth/cloud smoke test passed.");
}

main()
  .catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (database) await database.end();
  });
