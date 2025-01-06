import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserAssignmentModal } from "@/components/inventory/UserAssignmentModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Users } from "lucide-react";

const Settings = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [showUserModal, setShowUserModal] = useState(false);

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      return profile?.role === 'admin';
    },
    enabled: !!session
  });

  // Redirect non-admin users
  if (!isLoading && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <Button 
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
            </div>
          </div>

          <UserAssignmentModal 
            open={showUserModal} 
            onOpenChange={setShowUserModal} 
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;