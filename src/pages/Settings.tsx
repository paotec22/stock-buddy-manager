import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserAssignmentModal } from "@/components/inventory/UserAssignmentModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Download, Upload, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Settings = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showAssignments, setShowAssignments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || "Failed to create account");
        return;
      }

      if (data.user) {
        toast.success("User account created successfully!");
        setSignupData({ email: "", password: "", confirmPassword: "" });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An unexpected error occurred during signup");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Database exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export database");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'import',
          data: importData
        }),
      });

      if (!response.ok) throw new Error('Import failed');

      toast.success("Database imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import database");
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
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
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Users</CardTitle>
                      <CardDescription>Create new user accounts for your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter email"
                            value={signupData.email}
                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Choose a password"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            placeholder="Confirm password"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Create User
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAssignments(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage User Assignments
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="database-management">
              <AccordionTrigger>Database Management</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Importing data will replace all existing records. Make sure to backup your current data before proceeding.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-4">
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isExporting ? "Exporting..." : "Export Database"}
                    </Button>

                    <div>
                      <Label htmlFor="import-file">Import Database</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={isImporting}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <UserAssignmentModal 
            open={showAssignments} 
            onOpenChange={setShowAssignments} 
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;