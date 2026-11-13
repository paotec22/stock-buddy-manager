import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isAdminUser, isSuperAdminUser } from "@/utils/roles";
import { PageLoader } from "./PageLoader";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/" 
}: RoleProtectedRouteProps) {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEmailSuperAdmin = isSuperAdminUser(session?.user?.email);

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
    enabled: !!session?.user?.id && !isEmailSuperAdmin,
    staleTime: 1000 * 60 * 30,
  });

  const isSuperAdmin = isEmailSuperAdmin || isSuperAdminUser(session?.user?.email, userRole);
  const isAdmin = isAdminUser(session?.user?.email, userRole);

  const isAuthorized = Boolean(
    isSuperAdmin ||
    (isAdmin && allowedRoles.includes('admin')) ||
    (userRole && allowedRoles.includes(userRole))
  );

  const checking = authLoading || (!isSuperAdmin && isLoading);

  useEffect(() => {
    if (!checking && !isAuthorized) {
      navigate(redirectTo);
    }
  }, [isAuthorized, checking, navigate, redirectTo]);

  if (checking) {
    return <PageLoader />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}