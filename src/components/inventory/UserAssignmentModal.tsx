import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { UserPlus } from "lucide-react";

interface UserAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Profile {
  id: string;
  email: string;
  role: string;
}

export function UserAssignmentModal({ open, onOpenChange }: UserAssignmentModalProps) {
  const [newUserEmail, setNewUserEmail] = useState("");

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['profile_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_assignments')
        .select('profile_id');
      if (error) throw error;
      return new Set(data.map(a => a.profile_id));
    },
  });

  const handleAssignment = async (profileId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('profile_assignments')
          .delete()
          .eq('profile_id', profileId);
        if (error) throw error;
        toast.success('User assignment removed');
      } else {
        const { error } = await supabase
          .from('profile_assignments')
          .insert({ profile_id: profileId });
        if (error) throw error;
        toast.success('User assigned successfully');
      }
      refetch();
    } catch (error) {
      console.error('Error managing assignment:', error);
      toast.error('Failed to update user assignment');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Invite the user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(newUserEmail, {
        data: {
          role: 'user'
        }
      });

      if (authError) {
        throw authError;
      }

      toast.success('User invited successfully');
      setNewUserEmail("");
      refetch();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Assignments</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAddUser} className="space-y-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="newUserEmail">Add New User</Label>
            <div className="flex gap-2">
              <Input
                id="newUserEmail"
                type="email"
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
              <Button type="submit">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="font-medium">Existing Users</h3>
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="space-y-2">
              {profiles?.map((profile) => {
                const isAssigned = assignments?.has(profile.id);
                return (
                  <div key={profile.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{profile.email}</span>
                    <Button
                      variant={isAssigned ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleAssignment(profile.id, isAssigned || false)}
                    >
                      {isAssigned ? 'Remove' : 'Assign'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}