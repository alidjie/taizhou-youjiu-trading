const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: "Server auth configuration is incomplete." }, 500);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Missing user access token." }, 401);
  const userToken = auth.slice(7);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` },
  });
  if (!userRes.ok) return json({ error: "Invalid or expired user session." }, 401);
  const caller = await userRes.json() as { id: string };

  const adminHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/crm_user_profiles?select=role,is_active&user_id=eq.${encodeURIComponent(caller.id)}&limit=1`,
    { headers: adminHeaders },
  );
  if (!profileRes.ok) return json({ error: "Unable to verify CRM administrator." }, 500);
  const callerRows = await profileRes.json() as Array<{ role: string; is_active: boolean }>;
  if (!callerRows[0] || callerRows[0].role !== "admin" || !callerRows[0].is_active) {
    return json({ error: "Administrator permission required." }, 403);
  }

  const rest = async (path: string, init: RequestInit = {}) =>
    fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers: { ...adminHeaders, ...(init.headers || {}) } });
  const authAdmin = async (path: string, init: RequestInit = {}) =>
    fetch(`${supabaseUrl}/auth/v1/admin/${path}`, { ...init, headers: adminHeaders });

  try {
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action || "");
    const validUsername = (value: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value);
    const validEmail = (value: string) => /^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(value);

    if (action === "create_factory") {
      const factory_code = String(body.factory_code || "").trim().toUpperCase();
      const name = String(body.name || "").trim();
      if (!factory_code || !name) return json({ error: "Factory code and name are required." }, 400);
      const created = await rest("crm_factories", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          factory_code, name,
          contact_name: String(body.contact_name || "").trim() || null,
          email: String(body.email || "").trim() || null,
          phone: String(body.phone || "").trim() || null,
          address: String(body.address || "").trim() || null,
          status: "active",
        }),
      });
      const data = await created.json();
      if (!created.ok) return json({ error: data.message || data.details || data.hint || "Unable to create factory." }, created.status);
      return json({ success: true, data: Array.isArray(data) ? data[0] : data });
    }

    if (action === "create_user") {
      const username = String(body.username || "").trim().toLowerCase();
      const email = String(body.email || "").trim().toLowerCase();
      const full_name = String(body.full_name || "").trim();
      const password = String(body.password || "");
      const role = String(body.role || "");
      const factory_id = role === "factory" ? String(body.factory_id || "") : null;
      if (!validUsername(username)) {
        return json({ error: "用户名必须为 3–32 位小写英文字母、数字、点、下划线或连字符，且以字母或数字开头。" }, 400);
      }
      if (!validEmail(email)) {
        return json({ error: "请输入有效的登录邮箱地址。" }, 400);
      }
      if (!full_name || password.length < 10 || !["admin", "sales", "factory"].includes(role)) {
        return json({ error: "姓名、角色不能为空，初始密码至少 10 位。" }, 400);
      }
      if (role === "factory" && !factory_id) return json({ error: "Factory users must be assigned to a factory." }, 400);
      const exists = await rest(`crm_user_profiles?select=user_id&or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})&limit=1`);
      if (!exists.ok) return json({ error: "Unable to check username uniqueness." }, 500);
      if ((await exists.json()).length) return json({ error: "Username or email already exists." }, 409);
      if (factory_id) {
        const factoryRes = await rest(`crm_factories?select=id& id=eq.${encodeURIComponent(factory_id)}&status=eq.active&limit=1`.replace("?select=id& id", "?select=id&id"));
        if (!factoryRes.ok || !(await factoryRes.json()).length) return json({ error: "Selected factory is not active or does not exist." }, 400);
      }

      const createdAuth = await authAdmin("users", {
        method: "POST",
        body: JSON.stringify({
          email, password, email_confirm: true,
          user_metadata: { username, full_name, crm_managed: true },
        }),
      });
      const authData = await createdAuth.json() as { id?: string; msg?: string; message?: string };
      if (!createdAuth.ok || !authData.id) return json({ error: authData.msg || authData.message || "Auth user creation failed." }, createdAuth.status);

      const profileInsert = await rest("crm_user_profiles", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: authData.id, username, email, full_name, role, factory_id, is_active: true }),
      });
      const profileData = await profileInsert.json();
      if (!profileInsert.ok) {
        await authAdmin(`users/${authData.id}`, { method: "DELETE" });
        return json({ error: profileData.message || profileData.details || "CRM profile creation failed; Auth user was rolled back." }, profileInsert.status);
      }
      return json({ success: true, data: { user_id: authData.id, username, email, full_name, role, factory_id, is_active: true } });
    }

    if (action === "update_user") {
      const user_id = String(body.user_id || "");
      const username = String(body.username || "").trim().toLowerCase();
      const email = String(body.email || "").trim().toLowerCase();
      const full_name = String(body.full_name || "").trim();
      const role = String(body.role || "");
      const factory_id = role === "factory" ? String(body.factory_id || "") : null;

      if (!user_id || !full_name || !["admin", "sales", "factory"].includes(role)) {
        return json({ error: "User ID, full name and role are required." }, 400);
      }
      if (!validEmail(email)) {
        return json({ error: "请输入有效的登录邮箱地址。" }, 400);
      }
      if (role === "factory" && !factory_id) {
        return json({ error: "Factory users must be assigned to a factory." }, 400);
      }
      if (user_id === caller.id && role !== "admin") {
        return json({ error: "You cannot change your own administrator role." }, 400);
      }

      const targetRes = await rest(`crm_user_profiles?select=user_id,username,email,full_name,role,factory_id,is_active&user_id=eq.${encodeURIComponent(user_id)}&limit=1`);
      if (!targetRes.ok) return json({ error: "Unable to load target account." }, 500);
      const targetRows = await targetRes.json() as Array<{
        user_id: string; username: string; email: string; full_name: string;
        role: string; factory_id: string | null; is_active: boolean;
      }>;
      const target = targetRows[0];
      if (!target) return json({ error: "Account not found." }, 404);
      // Preserve existing imported administrator identifiers; enforce the new username format only when it changes.
      if (username !== target.username && !validUsername(username)) {
        return json({ error: "新用户名必须为 3–32 位小写英文字母、数字、点、下划线或连字符，且以字母或数字开头。" }, 400);
      }

      const duplicateRes = await rest(
        `crm_user_profiles?select=user_id&or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})&user_id=neq.${encodeURIComponent(user_id)}&limit=1`
      );
      if (!duplicateRes.ok) return json({ error: "Unable to check username/email uniqueness." }, 500);
      if ((await duplicateRes.json()).length) {
        return json({ error: "Username or email already exists. Please use a unique value." }, 409);
      }

      if (factory_id) {
        const factoryRes = await rest(
          `crm_factories?select=id&id=eq.${encodeURIComponent(factory_id)}&status=eq.active&limit=1`
        );
        if (!factoryRes.ok || !(await factoryRes.json()).length) {
          return json({ error: "Selected factory is not active or does not exist." }, 400);
        }
      }

      const emailChanged = email !== target.email.toLowerCase();
      if (emailChanged) {
        const authChanged = await authAdmin(`users/${encodeURIComponent(user_id)}`, {
          method: "PUT",
          body: JSON.stringify({
            email,
            email_confirm: true,
            user_metadata: { username, full_name, crm_managed: true },
          }),
        });
        const authData = await authChanged.json() as { msg?: string; message?: string };
        if (!authChanged.ok) {
          return json({ error: authData.msg || authData.message || "Unable to update authentication email." }, authChanged.status);
        }
      }

      const changed = await rest(`crm_user_profiles?user_id=eq.${encodeURIComponent(user_id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ username, email, full_name, role, factory_id }),
      });
      const changedData = await changed.json();
      if (!changed.ok) {
        if (emailChanged) {
          await authAdmin(`users/${encodeURIComponent(user_id)}`, {
            method: "PUT",
            body: JSON.stringify({
              email: target.email,
              email_confirm: true,
              user_metadata: { username: target.username, full_name: target.full_name, crm_managed: true },
            }),
          });
        }
        return json({ error: changedData.message || changedData.details || "Unable to update CRM profile." }, changed.status);
      }
      return json({ success: true, data: Array.isArray(changedData) ? changedData[0] : changedData });
    }

    if (action === "set_active") {
      const user_id = String(body.user_id || "");
      const is_active = body.is_active === true;
      if (!user_id) return json({ error: "user_id is required." }, 400);
      if (user_id === caller.id && !is_active) return json({ error: "You cannot disable your own administrator account." }, 400);
      const changed = await rest(`crm_user_profiles?user_id=eq.${encodeURIComponent(user_id)}`, {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ is_active }),
      });
      const data = await changed.json();
      if (!changed.ok) return json({ error: "Unable to update account status." }, changed.status);
      return json({ success: true, data: Array.isArray(data) ? data[0] : data });
    }

    if (action === "reset_password") {
      const user_id = String(body.user_id || "");
      const password = String(body.password || "");
      if (!user_id || password.length < 10) return json({ error: "User ID and a new password of at least 10 characters are required." }, 400);
      const changed = await authAdmin(`users/${encodeURIComponent(user_id)}`, { method: "PUT", body: JSON.stringify({ password }) });
      const data = await changed.json();
      if (!changed.ok) return json({ error: data.msg || data.message || "Password reset failed." }, changed.status);
      return json({ success: true });
    }

    if (action === "delete_user") {
      const user_id = String(body.user_id || "");
      if (!user_id) return json({ error: "user_id is required." }, 400);
      if (user_id === caller.id) return json({ error: "You cannot delete your own administrator account." }, 400);
      const p = await rest(`crm_user_profiles?select=role&user_id=eq.${encodeURIComponent(user_id)}&limit=1`);
      if (!p.ok) return json({ error: "Unable to verify target account." }, 500);
      const target = (await p.json())[0] as { role?: string } | undefined;
      if (!target) return json({ error: "Account not found." }, 404);
      if (target.role === "admin") return json({ error: "Administrator accounts cannot be deleted through this screen. Disable only after appointing another administrator." }, 400);

      const checks = [
        `crm_customers?select=id&owner_id=eq.${encodeURIComponent(user_id)}&limit=1`,
        `crm_quotes?select=id&owner_id=eq.${encodeURIComponent(user_id)}&limit=1`,
        `crm_orders?select=id&owner_id=eq.${encodeURIComponent(user_id)}&limit=1`,
        `crm_customer_followups?select=id&created_by=eq.${encodeURIComponent(user_id)}&limit=1`,
      ];
      for (const path of checks) {
        const check = await rest(path);
        if (!check.ok) return json({ error: "Unable to verify whether the account owns business records." }, 500);
        if ((await check.json()).length) return json({ error: "This user owns CRM business records. Disable the account instead of deleting it so historical ownership is preserved." }, 409);
      }
      const profileDelete = await rest(`crm_user_profiles?user_id=eq.${encodeURIComponent(user_id)}`, { method: "DELETE" });
      if (!profileDelete.ok) return json({ error: "Unable to remove CRM profile." }, profileDelete.status);
      const authDelete = await authAdmin(`users/${encodeURIComponent(user_id)}`, { method: "DELETE" });
      if (!authDelete.ok) return json({ error: "CRM profile removed, but Auth user deletion failed. Disable the account and investigate Auth cleanup." }, 500);
      return json({ success: true });
    }

    return json({ error: "Unsupported action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected CRM admin error." }, 500);
  }
});
