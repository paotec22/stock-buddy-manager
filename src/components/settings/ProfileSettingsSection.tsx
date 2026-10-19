import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getRoleLabel } from "@/utils/roles";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  Lock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";

export function ProfileSettingsSection() {
  const { session } = useAuth();
  const { profile, displayName, initials, isLoading, updateProfile, isUpdating } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setJobTitle(profile.jobTitle || "");
    } else if (session?.user) {
      const meta = session.user.user_metadata || {};
      const fallbackName = meta.full_name || meta.display_name || meta.name || "";
      if (fallbackName) setFullName(fallbackName);
      if (meta.phone) setPhone(meta.phone);
      if (meta.job_title) setJobTitle(meta.job_title);
    }
  }, [profile, session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your name so the dashboard can greet you properly.");
      return;
    }

    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
      });
    } catch {
      // Error handled in hook
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
        return;
      }

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("An unexpected error occurred while changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleLabel = getRoleLabel(session?.user?.email, profile?.role || "user");
  const isSuperAdmin = session?.user?.email === "paotec22@gmail.com";

  // Time-based greeting for preview
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const previewGreetingName = fullName.trim() || displayName || session?.user?.email?.split("@")[0] || "Team Member";

  return (
    <div className="space-y-6">
      {/* Live Profile Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-r from-primary/10 via-card to-background p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {fullName.trim() || displayName}
                </h2>
                <Badge
                  variant={isSuperAdmin ? "default" : "secondary"}
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  {isSuperAdmin && <Crown className="h-3 w-3 mr-1 text-amber-300" />}
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-mono">
                <Mail className="h-3 w-3" />
                {session?.user?.email}
              </p>
            </div>
          </div>

          {/* Greeting Live Preview Pill */}
          <div className="self-start sm:self-auto rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Live Dashboard Greeting Preview
            </span>
            <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
              &ldquo;{timeGreeting}, <span className="text-primary capitalize">{previewGreetingName}</span>&rdquo;
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Details Form */}
        <div className="lg:col-span-7">
          <Card className="border-border shadow-xs">
            <form onSubmit={handleSaveProfile}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Personal Identity & Details</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Fill in your official name and details. The dashboard landing page uses this name for your daily store greeting.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Full Name / Greeting Name (Primary Requirement) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profile-fullname" className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <span>Full Name / Preferred Name</span>
                      <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[10px] text-primary font-medium">Used on Dashboard Greeting</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="profile-fullname"
                      type="text"
                      placeholder="e.g. Paul Otegbayo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-9 text-sm h-10 font-medium"
                    />
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This is the name that will be displayed on the dashboard greeting instead of your email username.
                  </p>
                </div>

                {/* Email Address (Read-only) */}
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="profile-email"
                      type="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="pl-9 text-sm h-10 bg-muted/60 text-muted-foreground cursor-not-allowed font-mono"
                    />
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Verified account email address
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone" className="text-xs font-semibold text-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="profile-phone"
                        type="tel"
                        placeholder="e.g. +234 801 234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 text-sm h-10"
                      />
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Job Title / Role */}
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-jobtitle" className="text-xs font-semibold text-foreground">
                      Job Title / Role
                    </Label>
                    <div className="relative">
                      <Input
                        id="profile-jobtitle"
                        type="text"
                        placeholder="e.g. Store Manager"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="pl-9 text-sm h-10"
                      />
                      <Briefcase className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-center border-t border-border/60 pt-4">
                <span className="text-xs text-muted-foreground">
                  {isLoading ? "Loading profile..." : "Changes sync immediately across the app."}
                </span>
                <Button type="submit" disabled={isUpdating} className="gap-2">
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Profile Details
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Account Security (Password) Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs">
            <form onSubmit={handlePasswordChange}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Security &amp; Password</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your account password to keep your portal access secure.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-9 text-sm h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold text-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-sm h-10"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/60 pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isChangingPassword || !newPassword}
                  className="w-full gap-2 text-xs"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Role & Permissions Info Card */}
          <Card className="border-border/60 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Account Role &amp; Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Your account is currently assigned the role of{" "}
                <strong className="text-foreground capitalize">{roleLabel}</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                To request permissions adjustments or additional module access, please contact your System Administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
