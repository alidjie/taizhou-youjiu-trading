import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://crm.almcp.com",
  "https://www.almcp.com",
  "https://almcp.com",
  "http://localhost:3000",
]);

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://crm.almcp.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: "Server auth configuration is incomplete." }, 500, origin);
  }

  try {
    const body = await req.json() as { username?: unknown; password?: unknown };
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !password || username.length > 254 || password.length > 1024) {
      return json({ error: "账号或密码错误。" }, 401, origin);
    }

    // Support the documented username login and retain email login for existing users.
    const lookup = new URL(`${supabaseUrl}/rest/v1/crm_user_profiles`);
    lookup.searchParams.set("select", "email,is_active");
    lookup.searchParams.set(username.includes("@") ? "email" : "username", `eq.${username}`);
    lookup.searchParams.set("limit", "1");

    const profileRes = await fetch(lookup, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!profileRes.ok) {
      return json({ error: "登录服务暂时不可用，请稍后重试。" }, 503, origin);
    }

    const profiles = await profileRes.json() as Array<{ email: string; is_active: boolean }>;
    const profile = profiles[0];
    // Use the same response for unknown, disabled and wrong-password accounts.
    if (!profile?.email) {
      return json({ error: "账号或密码错误。" }, 401, origin);
    }
    if (!profile.is_active) {
      return json({ error: "该账号已被禁用，请联系管理员。" }, 401, origin);
    }

    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, password }),
      cache: "no-store",
    });
    const authData = await authRes.json() as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };

    if (!authRes.ok || !authData.access_token || !authData.refresh_token) {
      return json({ error: "账号或密码错误，或账号已被停用。" }, 401, origin);
    }

    return json({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      token_type: authData.token_type || "bearer",
      expires_in: authData.expires_in || 3600,
    }, 200, origin);
  } catch {
    return json({ error: "登录请求格式错误，请重试。" }, 400, origin);
  }
});
