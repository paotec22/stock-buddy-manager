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
import { isSuperAdminUser, isAdminUser } from "@/utils/roles";
import {
  Shield,
  Users,
  Database,
  AlertTriangle,
  Trash2,
  Lock,
  Loader2,
  Crown,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [resetType, setResetType] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        navigate("/");
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return null;
      }

      return profile;
    },
    enabled: !!session?.user?.id,
  });

  const isSuperAdmin = isSuperAdminUser(session?.user?.email, userProfile?.role);
  const isAdmin = isAdminUser(session?.user?.email, userProfile?.role);

  const handleReset = async () => {
    if (!session?.user?.email) {
      toast.error("Authentication required");
      return;
    }

    if (!isSuperAdmin) {
      toast.error("Permission denied: Only the Super Admin (paotec22) has authority to delete or reset the database");
      return;
    }

    if (!resetType) {
      toast.error("Please select a data set or table to reset");
      return;
    }

    if (!password) {
      toast.error("Please enter your Super Admin password to confirm");
      return;
    }

    setIsResetting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password,
      });

      if (authError) {
        toast.error("Invalid password. Reset operation aborted.");
        return;
      }

      if (resetType === "sales") {
        const { error } = await supabase.from("sales").delete().neq("id", 0);
        if (error) throw error;
        toast.success("All sales records purged successfully");
      } else if (resetType === "reports") {
        const { error } = await supabase.from("reports").delete().neq("id", 0);
        if (error) throw error;
        toast.success("All reports data purged successfully");
      } else if (resetType === "invoices") {
        const { error } = await supabase.from("invoices").delete().neq("id", 0);
        if (error) throw error;
        toast.success("All saved invoices purged successfully");
      } else if (resetType === "all") {
        // Complete database purge
        const [salesRes, expRes, invRes, repRes, invcRes] = await Promise.all([
          supabase.from("sales").delete().neq("id", 0),
          supabase.from("expenses").delete().neq("id", 0),
          supabase.from("inventory list").delete().neq("id", 0),
          supabase.from("reports").delete().neq("id", 0),
          supabase.from("invoices").delete().neq("id", 0),
        ]);

        if (salesRes.error || expRes.error || invRes.error) {
          console.warn("Some tables produced warnings during database wipe");
        }

        toast.success("Entire system database has been purged and reset");
      }

      setResetType("");
      setPassword("");
    } catch (err) {
      console.error("Error resetting data:", err);
      toast.error("Failed to execute data reset. Please verify database permissions.");
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
        <span className="text-sm text-muted-foreground">Verifying administrative authority...</span>
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
              {isSuperAdmin ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-[10px] uppercase tracking-wider border-0 shadow-xs flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  <span>Super Admin</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                  Admin Area
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isSuperAdmin
                ? "Full administrative authority: user management, role assignments, database purging, and backups."
                : "Manage team users, view roles, and export database backups. Destructive actions require Super Admin."}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60">
            {isSuperAdmin ? (
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-primary" />
            )}
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
              {isSuperAdmin ? (
                <Flame className="h-4 w-4 text-rose-500" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
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

          {/* Danger Zone: Data Reset - Strictly Super Admin */}
          <TabsContent value="reset" className="space-y-4 focus-visible:outline-none">
            {!isSuperAdmin ? (
              <Card className="border border-muted bg-card shadow-xs">
                <CardHeader className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">
                        Super Admin Access Restricted
                      </CardTitle>
                      <CardDescription>
                        Only the designated Super Admin (<span className="font-semibold text-foreground">paotec22</span>) has authorization to delete or purge the database.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-3">
                  <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                      Security Policy Enforcement
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      Standard administrators can manage daily records, export database backups, and configure team roles. For system data purges or user account removals, please contact the Super Admin.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-destructive/40 bg-card shadow-xs">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Reset System Database (Super Admin)</span>
                    </CardTitle>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px] uppercase font-bold">
                      <Crown className="h-3 w-3" />
                      Super Admin Exclusive
                    </Badge>
                  </div>
                  <CardDescription>
                    Permanently delete records or purge the database. As the Super Admin (paotec22), you hold the exclusive authority to perform these operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-4">
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold text-xs uppercase tracking-wide">
                      Irreversible Database Destruction
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      Always download a JSON backup from the Database & Backup tab before executing any purge. Purged records cannot be retrieved without an existing backup file.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="resetType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Scope to Delete / Purge
                      </Label>
                      <Select value={resetType} onValueChange={setResetType}>
                        <SelectTrigger id="resetType" className="h-10 text-sm">
                          <SelectValue placeholder="Choose database scope to reset..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Purge All Sales Records</SelectItem>
                          <SelectItem value="reports">Purge All Reports Data</SelectItem>
                          <SelectItem value="invoices">Purge All Saved Invoices</SelectItem>
                          <SelectItem value="all" className="text-destructive font-semibold">
                            ⚠️ Purge Entire Database (All Tables)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Confirm Super Admin Password
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
                          <span>Purging Database...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>
                            {resetType === "all"
                              ? "Confirm & Purge Entire Database"
                              : `Confirm & Reset ${resetType ? resetType.toUpperCase() : "Data"}`}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
};

export default Settings;
