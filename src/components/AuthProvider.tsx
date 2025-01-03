import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  userRole?: string;
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
  const [userRole, setUserRole] = useState<string>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session:', initialSession);
        
        setSession(initialSession);
        
        if (initialSession?.user) {
          console.log('AuthProvider: Fetching user profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError) {
            console.error('AuthProvider: Error fetching profile:', profileError);
          } else {
            console.log('AuthProvider: Profile data:', profileData);
            setUserRole(profileData?.role);
            
            // Redirect non-admin users to sales page if they try to access other pages
            if (profileData?.role !== 'admin' && 
                location.pathname !== '/' && 
                location.pathname !== '/sales') {
              navigate('/sales');
            }
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error during initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('AuthProvider: Auth state changed:', event, currentSession);
      
      setSession(currentSession);
      
      if (currentSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();
        
        if (profileError) {
          console.error('AuthProvider: Error fetching profile on auth change:', profileError);
        } else {
          console.log('AuthProvider: Updated profile data:', profileData);
          setUserRole(profileData?.role);
          
          // Redirect non-admin users to sales page if they try to access other pages
          if (profileData?.role !== 'admin' && 
              location.pathname !== '/' && 
              location.pathname !== '/sales') {
            navigate('/sales');
          }
        }
      } else {
        console.log('AuthProvider: No session, redirecting to home');
        navigate("/");
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Show loading state while initializing
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ session, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}