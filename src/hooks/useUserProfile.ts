import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface UserProfileDetails {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  role: string;
  createdAt?: string;
}

export function useUserProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email || "";

  // Local storage cache keys
  const localCacheKey = userId ? `si_user_profile_${userId}` : null;
  const localNameKey = userId ? `si_user_profile_name_${userId}` : null;

  // Read local cache for immediate synchronous display
  const getCachedName = useCallback((): string => {
    if (!userId) return "";
    try {
      const cached = localStorage.getItem(localNameKey || "");
      if (cached && cached.trim()) return cached.trim();

      const profileRaw = localStorage.getItem(localCacheKey || "");
      if (profileRaw) {
        const parsed = JSON.parse(profileRaw);
        if (parsed?.fullName && typeof parsed.fullName === "string") {
          return parsed.fullName.trim();
        }
      }
    } catch {
      // Ignore storage errors
    }
    return "";
  }, [userId, localCacheKey, localNameKey]);

  const [localName, setLocalName] = useState<string>(getCachedName);

  // Listen for custom profile update events across components
  useEffect(() => {
    setLocalName(getCachedName());

    const handleProfileUpdate = () => {
      setLocalName(getCachedName());
    };

    window.addEventListener("user-profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
    };
  }, [getCachedName]);

  // Query to fetch profile from Supabase profiles table and auth user metadata
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async (): Promise<UserProfileDetails | null> => {
      if (!userId) return null;

      // 1. Check Auth user metadata (always accessible and editable)
      const userMeta = session?.user?.user_metadata || {};
      const metaFullName = (userMeta.full_name || userMeta.display_name || userMeta.name || "").trim();
      const metaPhone = (userMeta.phone || "").trim();
      const metaJobTitle = (userMeta.job_title || userMeta.department || "").trim();

      // 2. Also check public.profiles table
      let dbRole = "user";
      let dbFullName = "";
      let dbPhone = "";
      let dbJobTitle = "";
      let createdAt = session?.user?.created_at;

      try {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileRow) {
          const row = profileRow as Record<string, unknown>;
          dbRole = (row.role as string) || "user";
          dbFullName = String(row.full_name || row.display_name || row.name || "").trim();
          dbPhone = String(row.phone || "").trim();
          dbJobTitle = String(row.job_title || "").trim();
          if (row.created_at) createdAt = String(row.created_at);
        }
      } catch (err) {
        console.warn("Could not query profiles table, using auth metadata:", err);
      }

      // Local storage fallback
      const cached = getCachedName();

      const resolvedFullName = dbFullName || metaFullName || cached || "";

      // Sync local storage if we found a name
      if (resolvedFullName && localNameKey) {
        try {
          localStorage.setItem(localNameKey, resolvedFullName);
        } catch {
          // Ignore
        }
      }

      return {
        id: userId,
        email: userEmail,
        fullName: resolvedFullName,
        phone: dbPhone || metaPhone,
        jobTitle: dbJobTitle || metaJobTitle,
        role: dbRole,
        createdAt,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate greeting/display name:
  // Priority:
  // 1. Profile full name from setting
  // 2. Local storage cache name
  // 3. User metadata full name
  // 4. Email username (fallback)
  const displayName = useMemo(() => {
    if (profileData?.fullName && profileData.fullName.trim()) {
      return profileData.fullName.trim();
    }
    if (localName && localName.trim()) {
      return localName.trim();
    }
    const userMeta = session?.user?.user_metadata;
    if (userMeta?.full_name && typeof userMeta.full_name === "string" && userMeta.full_name.trim()) {
      return userMeta.full_name.trim();
    }
    if (userMeta?.display_name && typeof userMeta.display_name === "string" && userMeta.display_name.trim()) {
      return userMeta.display_name.trim();
    }
    if (userEmail) {
      return userEmail.split("@")[0];
    }
    return "Team Member";
  }, [profileData?.fullName, localName, session?.user?.user_metadata, userEmail]);

  // Compute clean initials for avatars
  const initials = useMemo(() => {
    if (!displayName) return "U";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  // Mutation to update user details
  const updateProfileMutation = useMutation({
    mutationFn: async (updated: {
      fullName: string;
      phone?: string;
      jobTitle?: string;
    }) => {
      if (!userId) throw new Error("No active session");

      const trimmedName = updated.fullName.trim();
      const trimmedPhone = (updated.phone || "").trim();
      const trimmedJobTitle = (updated.jobTitle || "").trim();

      // 1. Update Supabase Auth user_metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          display_name: trimmedName,
          name: trimmedName,
          phone: trimmedPhone,
          job_title: trimmedJobTitle,
        },
      });

      if (authError) {
        console.error("Auth updateUser error:", authError);
        throw authError;
      }

      // 2. Try to update public.profiles table (if columns exist)
      try {
        await supabase
          .from("profiles")
          .update({
            full_name: trimmedName,
            phone: trimmedPhone,
            job_title: trimmedJobTitle,
          } as unknown as Record<string, string>)
          .eq("id", userId);
      } catch (err) {
        // Tolerated if custom columns don't exist yet in the database schema
        console.warn("Notice: public.profiles table update skipped or column missing:", err);
      }

      // 3. Immediately update local storage for zero-latency client sync
      if (localNameKey) {
        try {
          localStorage.setItem(localNameKey, trimmedName);
          if (localCacheKey) {
            localStorage.setItem(
              localCacheKey,
              JSON.stringify({
                id: userId,
                email: userEmail,
                fullName: trimmedName,
                phone: trimmedPhone,
                jobTitle: trimmedJobTitle,
                role: profileData?.role || "user",
              })
            );
          }
        } catch {
          // Ignore storage errors
        }
      }

      // 4. Notify app
      setLocalName(trimmedName);
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: { name: trimmedName } }));

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      toast.success("Profile updated! Your name is now displayed on the dashboard.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile details");
    },
  });

  return {
    profile: profileData,
    displayName,
    initials,
    hasCustomName: Boolean(profileData?.fullName?.trim() || localName?.trim()),
    isLoading,
    refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
