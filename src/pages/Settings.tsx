import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserManagementSection } from "@/components/settings/UserManagementSection";
import { DatabaseManagementSection } from "@/components/settings/DatabaseManagementSection";

const Settings = () => {
  const navigate = useNavigate();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      console.log("Checking admin status...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log("Admin check result:", profile?.role === 'admin');
      return profile?.role === 'admin';
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    toast.error("You don't have permission to access this page");
    navigate("/inventory");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <Accordion type="single" collapsible className="w-full max-w-md space-y-4">
            <AccordionItem value="user-management">
              <AccordionTrigger>User Management</AccordionTrigger>
              <AccordionContent>
                <UserManagementSection />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="database-management">
              <AccordionTrigger>Database Management</AccordionTrigger>
              <AccordionContent>
                <DatabaseManagementSection />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;