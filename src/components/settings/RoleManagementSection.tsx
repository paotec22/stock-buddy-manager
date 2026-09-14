import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { isSuperAdminUser, getRoleLabel } from "@/utils/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, User, UserCheck, Package, Trash2, Crown, Lock, AlertCircle, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  role: string;
}

export const RoleManagementSection = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentUserSuperAdmin = isSuperAdminUser(session?.user?.email);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email');

      if (error) throw error;
      return data as Profile[];
    }
  });

  const handleRoleUpdate = async (profileId: string, newRole: string) => {
    setUpdatingRoles(prev => ({ ...prev, [profileId]: true }));
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (!isCurrentUserSuperAdmin) {
      toast.error("Permission denied: Only the Super Admin can delete users");
      return;
    }

    if (isSuperAdminUser(userToDelete.email, userToDelete.role)) {
      toast.error("The Super Admin account cannot be deleted");
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Remove user assignments if any
      await supabase
        .from('profile_assignments')
        .delete()
        .eq('profile_id', userToDelete.id);

      // 2. Remove profile record
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }

      toast.success(`User ${userToDelete.email} has been permanently deleted`);
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete user. Please check database permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleIcon = (email: string, role: string) => {
    if (isSuperAdminUser(email, role)) {
      return <Crown className="h-4 w-4 text-amber-500" />;
    }
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'uploader':
        return <UserCheck className="h-4 w-4" />;
      case 'inventory_manager':
        return <Package className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (email: string, role: string) => {
    if (isSuperAdminUser(email, role)) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-[11px] border-0 shadow-xs">
          Super Admin
        </Badge>
      );
    }

    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'uploader':
        return <Badge variant="secondary">Uploader</Badge>;
      case 'inventory_manager':
        return <Badge variant="default">Inventory Manager</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Role Management & User Accounts</CardTitle>
              <CardDescription className="mt-1">
                Assign functional roles to team members. Only the Super Admin (paotec22) has permission to delete user accounts and purge the database.
              </CardDescription>
            </div>
            {isCurrentUserSuperAdmin ? (
              <Badge className="self-start sm:self-auto bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-2.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Super Admin Privileges Active</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="self-start sm:self-auto text-muted-foreground gap-1.5 py-1 px-2.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Administrator View (User deletion restricted to Super Admin)</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading user directory...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Role Assignment</TableHead>
                  <TableHead className="text-right">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((profile) => {
                  const isProfileSuper = isSuperAdminUser(profile.email, profile.role);

                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{profile.email}</span>
                          {isProfileSuper && (
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-500/10 border-amber-500/20">
                              Owner
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(profile.email, profile.role)}
                          {getRoleBadge(profile.email, profile.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isProfileSuper ? (
                          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Permanent Super Admin</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select
                              value={profile.role}
                              onValueChange={(newRole) => handleRoleUpdate(profile.id, newRole)}
                              disabled={updatingRoles[profile.id]}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="uploader">Uploader</SelectItem>
                                <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingRoles[profile.id] && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isProfileSuper ? (
                          <span className="text-xs text-muted-foreground italic">Protected</span>
                        ) : isCurrentUserSuperAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2 text-xs font-semibold"
                            onClick={() => setUserToDelete(profile)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            <span>Delete User</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Super Admin only</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal for Super Admin to Delete User */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Delete User Account</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Are you sure you want to permanently delete the user account for{" "}
                <span className="font-semibold text-foreground">{userToDelete?.email}</span>?
              </p>
              <p className="text-xs text-muted-foreground">
                This action will delete their profile and remove all associated assignments from the system. This cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Confirm Delete User</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
