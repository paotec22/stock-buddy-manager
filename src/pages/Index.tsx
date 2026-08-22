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
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <main className="relative z-10 w-full flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Desktop: Split layout | Mobile: Stacked */}
          <div className="lg:grid lg:grid-cols-12 gap-8 items-center">
            {/* Brand Hero Panel - desktop only */}
            <div className="hidden lg:block lg:col-span-7 relative p-10 md:p-12 bg-slate-900 dark:bg-slate-950 rounded-2xl text-slate-100 overflow-hidden border border-slate-800 shadow-xl">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">SI Manager</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white leading-tight">
                  Intelligent Inventory &amp; Sales Management
                </h1>
                <p className="text-slate-300 text-base mb-8 max-w-md leading-relaxed">
                  Enterprise-grade stock control, multi-location sales tracking, instant invoicing, and profit intelligence.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary/20 text-primary-light flex items-center justify-center">
                        <f.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-100">{f.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5 leading-snug">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-800 pt-6">
                  <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-400" /> Role-based Security</span>
                  <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-blue-400" /> Offline-First Sync</span>
                  <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-amber-400" /> Live Financials</span>
                </div>
              </div>
            </div>

            {/* Login Form Panel */}
            <div className="lg:col-span-5">
              <Card className="border border-border bg-card shadow-sm rounded-xl">
                <CardHeader className="space-y-1.5 text-center pb-4">
                  <div className="inline-flex items-center justify-center gap-2 h-10 w-10 rounded-lg bg-primary/10 text-primary mx-auto mb-1">
                    <Package className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">Sign In</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Access your company stock and sales records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-xs font-medium text-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@company.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          className="pl-9 h-10 text-sm"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
                          Password
                        </Label>
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
                          className="pl-9 h-10 text-sm"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-10 text-sm font-medium mt-2" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              /*<p className="text-center text-xs text-muted-foreground mt-4">
                Powered by <strong className="text-foreground font-medium">Puido Smart Solutions</strong>
              </p>*/
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
