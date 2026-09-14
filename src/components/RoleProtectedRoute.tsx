import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isAdminUser, isSuperAdminUser } from "@/utils/roles";

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

  const isSuperAdmin = isSuperAdminUser(session?.user?.email, userRole);
  const isAdmin = isAdminUser(session?.user?.email, userRole);

  const isAuthorized = Boolean(
    isSuperAdmin ||
    (isAdmin && allowedRoles.includes('admin')) ||
    (userRole && allowedRoles.includes(userRole))
  );

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      navigate(redirectTo);
    }
  }, [isAuthorized, isLoading, navigate, redirectTo]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}