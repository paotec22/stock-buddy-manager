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
    console.log("AuthProvider: Initializing");
    
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Authentication error. Please try again.");
          return;
        }

        console.log("AuthProvider: Initial session check", { session });
        setSession(session);
        
        // Handle navigation based on auth state
        if (session && location.pathname === '/') {
          navigate('/inventory');
        } else if (!session && location.pathname !== '/') {
          navigate('/');
        }
        
      } catch (error) {
        console.error("Error in auth initialization:", error);
        toast.error("Failed to initialize authentication");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AuthProvider: Auth state changed", { event: _event, session });
      if (!mounted) return;
      
      setSession(session);
      
      if (session && location.pathname === '/') {
        navigate('/inventory');
      } else if (!session && location.pathname !== '/') {
        navigate('/');
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ session, loading }), [session, loading]);

  console.log("AuthProvider: Rendering", { session, loading });

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}