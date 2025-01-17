import { useState } from "react";
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
  const [resetType, setResetType] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

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

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: supabase.auth.user().email,
        password,
      });

      if (authError) throw authError;

      if (resetType === "sales") {
        await supabase.from('sales').delete().neq('id', 0);
      } else if (resetType === "reports") {
        await supabase.from('reports').delete().neq('id', 0);
      } else if (resetType === "invoices") {
        await supabase.from('invoices').delete().neq('id', 0);
      }

      toast.success(`${resetType.charAt(0).toUpperCase() + resetType.slice(1)} reset successfully`);
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error("Failed to reset data");
    } finally {
      setIsResetting(false);
    }
  };

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
            <AccordionItem value="reset-data">
              <AccordionTrigger>Reset Data</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="resetType" className="block text-sm font-medium text-gray-700">Select Reset Type</label>
                    <select
                      id="resetType"
                      value={resetType}
                      onChange={(e) => setResetType(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select an option</option>
                      <option value="sales">Reset Sales</option>
                      <option value="reports">Reset Reports</option>
                      <option value="invoices">Reset Invoices</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isResetting ? "Resetting..." : "Reset Data"}
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;