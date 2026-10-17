// CONTROL Cloud: self-service data erasure, to deploy ONLY after security review.
// SUPABASE_SERVICE_ROLE_KEY is a server-side secret injected by Supabase; never in browser files.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const allowedOrigin = Deno.env.get("CONTROL_ALLOWED_ORIGIN") ?? "https://cosscoll.github.io";
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
});
function response(status: number, value: unknown, origin: string | null) {
  return new Response(JSON.stringify(value), { status, headers: cors(origin) });
}
Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (origin !== allowedOrigin) return response(403, { error: "Origin not allowed" }, origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== "POST") return response(405, { error: "Method not allowed" }, origin);
  const header = request.headers.get("authorization") ?? "";
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(header)) return response(401, { error: "Authentication required" }, origin);

  try {
    const body = await request.json();
    if (body?.confirmation !== "SUPPRIMER MON COMPTE") return response(400, { error: "Explicit confirmation required" }, origin);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) return response(503, { error: "Server configuration missing" }, origin);
    const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
    const jwt = header.replace(/^Bearer /, "");
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data?.user) return response(401, { error: "Session invalid" }, origin);

    // Only delete the verified owner of this exact JWT; auth.users cascades tenant rows.
    const deleted = await admin.auth.admin.deleteUser(data.user.id);
    if (deleted.error) return response(500, { error: "Account removal failed" }, origin);
    return response(200, { deleted: true }, origin);
  } catch {
    return response(400, { error: "Invalid request" }, origin);
  }
});
