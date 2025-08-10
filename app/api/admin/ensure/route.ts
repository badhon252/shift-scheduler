/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const DEFAULT_NAME = process.env.ADMIN_NAME || "Administrator";
const ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN;

type EnsureBody = {
  token?: string;
  email?: string;
  password?: string;
  fullName?: string;
};

function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

import type { SupabaseClient } from "@supabase/supabase-js";

async function findUserByEmail(
  admin: SupabaseClient<any, any, any>,
  email: string
) {
  let page = 1;
  const perPage = 1000;
  // paginate to be safe
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
    page++;
  }
}

async function ensureAdminUser(
  email: string,
  password: string,
  fullName: string
) {
  ok(
    !!url && !!serviceRole,
    "Supabase URL or Service Role key missing on server"
  );
  const admin = createClient(url!, serviceRole!);
  // Try to create first
  const create = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: "admin" },
  });
  if (!create.error) {
    return { created: true, userId: create.data.user?.id };
  }
  // If creation failed because it exists, update it
  const existing = await findUserByEmail(admin, email);
  if (!existing)
    throw new Error(
      `User not found via listUsers(). Check Supabase Auth for ${email}.`
    );
  const update = await admin.auth.admin.updateUserById(existing.id, {
    app_metadata: { ...(existing.app_metadata || {}), role: "admin" },
    email_confirm: true,
    user_metadata: { ...(existing.user_metadata || {}), full_name: fullName },
    password, // force-set password
  });
  if (update.error) throw update.error;
  return { created: false, userId: update.data.user?.id };
}

function isAuthorizedToken(reqToken?: string) {
  if (!ADMIN_SETUP_TOKEN) return true; // if not set, do not enforce
  return reqToken === ADMIN_SETUP_TOKEN;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token =
      searchParams.get("token") ||
      request.headers.get("x-setup-token") ||
      undefined;
    if (!isAuthorizedToken(token || undefined)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized (bad token)" },
        { status: 401 }
      );
    }
    const res = await ensureAdminUser(
      DEFAULT_EMAIL,
      DEFAULT_PASSWORD,
      DEFAULT_NAME
    );
    return NextResponse.json({ ok: true, ...res, email: DEFAULT_EMAIL });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as EnsureBody;
    const token =
      request.headers.get("x-setup-token") ||
      body.token ||
      new URL(request.url).searchParams.get("token") ||
      undefined;
    if (!isAuthorizedToken(token || undefined)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized (bad token)" },
        { status: 401 }
      );
    }
    const email = (body.email || DEFAULT_EMAIL).trim().toLowerCase();
    const password = (body.password || DEFAULT_PASSWORD).trim();
    const fullName = body.fullName || DEFAULT_NAME;
    const res = await ensureAdminUser(email, password, fullName);
    return NextResponse.json({ ok: true, ...res, email });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
