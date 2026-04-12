/**
 * Authentication Context Hook
 * 
 * Provides authentication state and functions throughout the app
 */

import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import * as auth from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setInitializing(false);
      return;
    }

    // Check initial session
    const initAuth = async () => {
      try {
        const { session, error } = await auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        } else if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up
  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp({ email, password, name });
      if (error) {
        setLoading(false);
        return { error };
      }
      setLoading(false);
      // User will be set via auth state change listener
      return { data, error: null };
    } catch (error: any) {
      setLoading(false);
      return { data: null, error };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn({ email, password });
      if (error) {
        setLoading(false);
        return { error };
      }
      // User will be set via auth state change listener
      return { data, error: null };
    } catch (error: any) {
      setLoading(false);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      if (error) {
        setLoading(false);
        return { error };
      }
      setUser(null);
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await auth.resetPassword(email);
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
});

