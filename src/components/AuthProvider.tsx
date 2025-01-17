import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

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

  useEffect(() => {
    console.log("AuthProvider: Initializing with current location:", location.pathname);
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("AuthProvider: Getting initial session");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log("AuthProvider: Component unmounted during initialization");
          return;
        }

        if (error) {
          console.error("Error getting initial session:", error);
          toast.error("Authentication error occurred");
          setLoading(false);
          return;
        }

        console.log("AuthProvider: Initial session retrieved", { 
          hasSession: !!initialSession,
          currentPath: location.pathname 
        });
        
        setSession(initialSession);
        setLoading(false);

        // Only handle navigation after we've confirmed the session state
        if (initialSession && location.pathname === '/') {
          console.log("AuthProvider: Redirecting authenticated user to inventory");
          navigate('/inventory');
        } else if (!initialSession && location.pathname !== '/') {
          console.log("AuthProvider: Redirecting unauthenticated user to login");
          navigate('/');
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (mounted) {
          toast.error("Failed to initialize authentication");
          setLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) {
        console.log("AuthProvider: Ignoring auth state change on unmounted component");
        return;
      }

      console.log("AuthProvider: Auth state changed", { 
        event, 
        hasSession: !!currentSession,
        currentPath: location.pathname 
      });

      setSession(currentSession);

      // Handle navigation based on new auth state
      if (currentSession && location.pathname === '/') {
        navigate('/inventory');
      } else if (!currentSession && location.pathname !== '/') {
        navigate('/');
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    loading
  }), [session, loading]);

  console.log("AuthProvider: Rendering", { 
    hasSession: !!session, 
    loading,
    currentPath: location.pathname 
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}