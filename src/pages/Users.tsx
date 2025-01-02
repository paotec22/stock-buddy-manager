import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AddUserForm } from "@/components/users/AddUserForm";
import { UsersTable } from "@/components/users/UsersTable";
import { toast } from "sonner";

const Users = () => {
  const [showAddUser, setShowAddUser] = useState(false);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        toast.error("Failed to load users");
        throw error;
      }
      
      return data;
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col md:flex-row w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">User Management</h1>
            <Button onClick={() => setShowAddUser(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {isLoading ? (
            <div>Loading users...</div>
          ) : error ? (
            <div className="text-red-500">
              Failed to load users. Please try refreshing the page.
            </div>
          ) : (
            <UsersTable users={users || []} onUserUpdated={refetch} />
          )}

          <AddUserForm 
            open={showAddUser} 
            onOpenChange={setShowAddUser}
            onSuccess={refetch}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Users;