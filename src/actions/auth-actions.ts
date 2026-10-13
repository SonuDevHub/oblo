"use server";

import { createServerClient } from "@/lib/supabase/create-server-client";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation/auth-schema";

export async function signInAction(data: LoginInput) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const supabase = await createServerClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !authData.user) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // Check user role for redirection
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_blocked")
    .eq("id", authData.user.id)
    .single();

  const redirectTo = profile?.role === "admin" ? "/admin" : "/rides/search";

  return {
    success: true,
    redirectTo,
    isBlocked: profile?.is_blocked ?? false,
  };
}

export async function signUpAction(data: SignupInput) {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: "/rides/search",
  };
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();

  return {
    success: true,
    redirectTo: "/login",
  };
}
