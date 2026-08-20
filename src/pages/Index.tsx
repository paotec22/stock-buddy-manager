import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Package, Shield, Zap, BarChart3, ArrowRight, Loader2 } from "lucide-react";

const features = [
  { icon: Package, title: "Smart Inventory", desc: "Real-time stock tracking with multi-location support" },
  { icon: Shield, title: "Secure Access", desc: "Role-based permissions & audit trails for compliance" },
  { icon: Zap, title: "Instant Insights", desc: "Live dashboards with revenue trends & profit analysis" },
  { icon: BarChart3, title: "Visual Catalogue", desc: "Photo-rich product grid with quick-view & print" },
];

const Index = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      navigate("/inventory");
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("email_not_confirmed")) {
          toast.error("Please check your email to confirm your account");
        } else {
          toast.error(error.message || "Failed to login");
        }
        return;
      }

      if (data?.session) {
        toast.success("Welcome back!");
        navigate("/inventory");
      }
    } catch {
      toast.error("An unexpected error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite] delay-[1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Desktop: Split layout | Mobile: Stacked */}
          <div className="lg:grid lg:grid-cols-2 gap-8 items-center">
            {/* Brand Hero Panel - desktop only */}
            <div className="hidden lg:block relative p-10 md:p-16 bg-gradient-to-br from-primary via-primary/80 to-secondary rounded-3xl text-primary-foreground overflow-hidden">
              <div className="absolute inset-0 bg-[url('/Puido_Smart_Solutions.svg')] bg-center bg-no-repeat opacity-5" aria-hidden="true" />

              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center border border-primary-foreground/20">
                    <Package className="h-7 w-7" />
                  </div>
                  <span className="text-xl font-bold">SI Manager</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                  Manage Inventory <br />with <span className="relative">Confidence</span>
                </h1>
                <p className="text-primary-foreground/80 text-lg mb-10 max-w-md leading-relaxed">
                  Complete stock management for modern businesses. Track, sell, analyse & grow — all in one place.
                </p>

                {/* Feature highlights */}
                <div className="space-y-4 mb-10">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-foreground/15 backdrop-blur flex items-center justify-center border border-primary-foreground/20 group-hover:bg-primary-foreground/25 transition-colors">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{f.title}</p>
                        <p className="text-primary-foreground/70 text-sm">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap gap-6 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1">🔒 Enterprise-grade security</span>
                  <span className="flex items-center gap-1">☁️ Cloud-synced</span>
                  <span className="flex items-center gap-1">📱 Works offline</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute bottom-8 right-8 opacity-20">
                <BarChart3 className="h-24 w-24" />
              </div>
            </div>

            {/* Login Form Panel - shown on both desktop and mobile */}
            <div className="lg:col-span-1">
              <Card className="bg-card/80 backdrop-blur-xl border-border/40 shadow-2xl card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                <CardHeader className="space-y-2 text-center pb-2">
                  <div className="inline-flex items-center justify-center gap-2 h-12 w-12 rounded-xl bg-primary/10 mx-auto mb-2">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Sign in to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@company.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          className="pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-sm font-medium">
                          Password
                        </Label>
                        <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full py-3 text-base font-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>

                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Powered by <strong className="text-foreground">Puido Smart Solutions</strong>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
