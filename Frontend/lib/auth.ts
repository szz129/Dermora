/**
 * Authentication Functions
 * 
 * Handles user sign up, sign in, sign out, and session management
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password, name }: SignUpData) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;

    // Profile is automatically created by trigger (see schema.sql)
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error('Supabase is not configured') };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error: any) {
    return { session: null, error };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { subscription: null } };
  }

  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

/**
 * Reset password via email
 */
export async function resetPassword(email: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error('Supabase is not configured') };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'dermora://reset-password', // Deep link for mobile app
    });
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error };
  }
}

