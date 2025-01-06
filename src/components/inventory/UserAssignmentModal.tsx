import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

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
  const { session, loading } = useAuth();
  
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!session, // Only fetch when session exists
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['profile_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_assignments')
        .select('profile_id');
      if (error) throw error;
      return new Set(data.map(a => a.profile_id));
    },
    enabled: !!session, // Only fetch when session exists
  });

  const handleAssignment = async (profileId: string, isAssigned: boolean) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to manage assignments');
      return;
    }

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
          .insert({ 
            profile_id: profileId,
            assigned_by: session.user.id 
          });
        if (error) throw error;
        toast.success('User assigned successfully');
      }
    } catch (error) {
      console.error('Error managing assignment:', error);
      toast.error('Failed to update user assignment');
    }
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error if not authenticated
  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <p>You must be logged in to manage user assignments.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Assignments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(profilesLoading || assignmentsLoading) ? (
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