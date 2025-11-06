import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/inventory" 
}: RoleProtectedRouteProps) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      return profile?.role;
    },
    enabled: !!session?.user?.id
  });

  useEffect(() => {
    if (!isLoading && userRole && !allowedRoles.includes(userRole)) {
      navigate(redirectTo);
    }
  }, [userRole, isLoading, allowedRoles, navigate, redirectTo]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}