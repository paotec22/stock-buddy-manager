import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    console.log("AuthProvider: Initializing");
    
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("AuthProvider: Initial session check", { session, error });
      if (!mounted) return;
      
      if (error) {
        console.error("Error getting session:", error);
        toast.error("Authentication error. Please try again.");
        return;
      }
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AuthProvider: Auth state changed", { event: _event, session });
      if (!mounted) return;
      
      setSession(session);
      
      if (!session) {
        console.log("AuthProvider: No session, redirecting to home");
        navigate("/");
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ session, loading }), [session, loading]);

  console.log("AuthProvider: Rendering", { session, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}