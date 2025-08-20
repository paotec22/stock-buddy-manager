import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, User, UserCheck } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  role: string;
}

export const RoleManagementSection = () => {
  const queryClient = useQueryClient();
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'uploader':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'uploader':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Assign roles to users. Admin has full access, Uploader can edit inventory and sales dates, User has basic access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(profile.role)}
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {profile.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={profile.role}
                        onValueChange={(newRole) => handleRoleUpdate(profile.id, newRole)}
                        disabled={updatingRoles[profile.id]}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="uploader">Uploader</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingRoles[profile.id] && (
                        <div className="text-sm text-muted-foreground">Updating...</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};