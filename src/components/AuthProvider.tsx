import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useCustomersRealtime } from "@/hooks/useCustomersRealtime";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Routes that anyone can view without signing in
const PUBLIC_PATHS = ["/share/catalogue", "/privacy"];
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true, 
  signOut: async () => {} 
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const pathnameRef = useRef(location.pathname);
  const navigateRef = useRef(navigate);
  pathnameRef.current = location.pathname;
  navigateRef.current = navigate;

  // Keep customer directory synced in real time only once authenticated
  useCustomersRealtime(Boolean(session));

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      throw error;
    }
    toast.success("Successfully signed out");
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    const redirectIfUnauthenticated = (activeSession: Session | null) => {
      const currentPath = pathnameRef.current;
      if (isPublicPath(currentPath)) return;
      if (!activeSession && currentPath !== '/' && currentPath !== '/login') {
        navigateRef.current('/');
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("Error getting initial session:", error);
          toast.error("Authentication error occurred");
          setLoading(false);
          return;
        }
        
        setSession(initialSession);
        setLoading(false);
        redirectIfUnauthenticated(initialSession);
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (mounted) {
          toast.error("Failed to initialize authentication");
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setLoading(false);
      redirectIfUnauthenticated(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    loading,
    signOut
  }), [session, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
