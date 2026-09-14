import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserManagementSection } from "@/components/settings/UserManagementSection";
import { DatabaseManagementSection } from "@/components/settings/DatabaseManagementSection";
import { RoleManagementSection } from "@/components/settings/RoleManagementSection";
import { useAuth } from "@/components/AuthProvider";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Shield, Users, Database, AlertTriangle, Trash2, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [resetType, setResetType] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const { data: isAdmin, isLoading, error } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!session?.user?.id) {
        navigate("/");
        return false;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return false;
      }

      return profile?.role === "admin";
    },
    enabled: !!session,
  });

  const handleReset = async () => {
    if (!session?.user?.email) {
      toast.error("Authentication required");
      return;
    }

    if (!resetType) {
      toast.error("Please select a data type to reset");
      return;
    }

    if (!password) {
      toast.error("Please enter your admin password to confirm");
      return;
    }

    setIsResetting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password,
      });

      if (authError) {
        toast.error("Invalid password. Reset cancelled.");
        return;
      }

      if (resetType === "sales") {
        await supabase.from("sales").delete().neq("id", 0);
      } else if (resetType === "reports") {
        await supabase.from("reports").delete().neq("id", 0);
      } else if (resetType === "invoices") {
        await supabase.from("invoices").delete().neq("id", 0);
      }

      toast.success(`${resetType.charAt(0).toUpperCase() + resetType.slice(1)} reset successfully`);
      setResetType("");
      setPassword("");
    } catch (err) {
      console.error("Error resetting data:", err);
      toast.error("Failed to reset data");
    } finally {
      setIsResetting(false);
    }
  };

  if (!session) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Verifying administrator privileges...</span>
      </div>
    );
  }

  if (error || !isAdmin) {
    toast.error("You don't have permission to access the Settings page");
    navigate("/inventory");
    return null;
  }

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Ribbon */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Settings & Administration
              </h1>
              <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                Admin Area
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage system users, access control, database backups, and maintenance routines
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>{session.user.email}</span>
          </div>
        </div>

        {/* Administration Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/60 border border-border/80 rounded-xl gap-1">
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs"
            >
              <Users className="h-4 w-4" />
              <span>User Accounts</span>
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs"
            >
              <Shield className="h-4 w-4" />
              <span>Roles & Access</span>
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs"
            >
              <Database className="h-4 w-4" />
              <span>Database & Backup</span>
            </TabsTrigger>
            <TabsTrigger
              value="reset"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs text-destructive data-[state=active]:text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
            <UserManagementSection />
          </TabsContent>

          {/* Role Management */}
          <TabsContent value="roles" className="space-y-4 focus-visible:outline-none">
            <RoleManagementSection />
          </TabsContent>

          {/* Database Management */}
          <TabsContent value="database" className="space-y-4 focus-visible:outline-none">
            <DatabaseManagementSection />
          </TabsContent>

          {/* Danger Zone: Data Reset */}
          <TabsContent value="reset" className="space-y-4 focus-visible:outline-none">
            <Card className="border border-destructive/40 bg-card shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Reset System Data</span>
                </CardTitle>
                <CardDescription>
                  Permanently purge specific data records from the system. This action cannot be undone. Please proceed with extreme caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-4">
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-semibold text-xs uppercase tracking-wide">
                    Warning: Irreversible Action
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Always export a full JSON database backup under the Database & Backup tab before executing any reset operation.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label htmlFor="resetType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Data Set to Reset
                    </Label>
                    <Select value={resetType} onValueChange={setResetType}>
                      <SelectTrigger id="resetType" className="h-10 text-sm">
                        <SelectValue placeholder="Choose what to reset..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Purge All Sales Records</SelectItem>
                        <SelectItem value="reports">Purge All Reports Data</SelectItem>
                        <SelectItem value="invoices">Purge All Saved Invoices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Confirm Admin Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReset}
                    disabled={isResetting || !resetType || !password}
                    className="w-full h-10 text-sm font-semibold shadow-xs"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Purging Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Confirm & Reset {resetType ? resetType.toUpperCase() : "Data"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
};

export default Settings;
