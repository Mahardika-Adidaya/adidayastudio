import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is not configured; skipping auth account generation");
      return NextResponse.json({ skipped: true, message: "Service role key not configured" });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const defaultPassword = "Adidaya2025";

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: defaultPassword,
      user_metadata: { role },
    });

    if (error) {
      console.warn("Auth user creation warning:", error.message || error);
      return NextResponse.json({ error: error.message || "Failed to create auth user" }, { status: 200 });
    }

    return NextResponse.json({ user: data?.user });
  } catch (err: any) {
    console.error("create-auth-user API error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
