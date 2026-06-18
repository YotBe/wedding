import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkIsAdmin } from '../lib/admin';

interface AdminAuth {
  loading: boolean;
  session: Session | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Tracks the Supabase session and whether the signed-in user is an
 * allowlisted admin. Email/password auth; the `admins` table + RLS are the
 * real gate, this only drives the UI.
 */
export function useAdminAuth(): AdminAuth {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function resolve(next: Session | null) {
      const admin = next ? await checkIsAdmin() : false;
      if (!active) return;
      setSession(next);
      setIsAdmin(admin);
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setLoading(true);
      void resolve(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { loading, session, isAdmin, signIn, signOut };
}
