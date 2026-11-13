import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Package,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const features = [
  { icon: Package, title: "Smart Inventory", desc: "Real-time stock tracking with multi-location support" },
  { icon: Shield, title: "Secure Access", desc: "Role-based permissions & audit trails for compliance" },
  { icon: Zap, title: "Instant Insights", desc: "Live dashboards with revenue trends & profit analysis" },
  { icon: BarChart3, title: "Visual Catalogue", desc: "Photo-rich product grid with quick-view & print" },
];

const Index = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      navigate("/");
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
        navigate("/");
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
      <main className="relative z-10 w-full flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl space-y-6 lg:space-y-0">
          {/* Compact Mobile & Tablet Brand Intro */}
          <div className="lg:hidden text-center space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Package className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                SI Manager
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Inventory tracking, branch sales operations, and invoicing workspace.
            </p>
          </div>

          {/* Desktop: Split layout | Mobile: Stacked */}
          <div className="lg:grid lg:grid-cols-12 gap-8 items-center">
            {/* Brand Hero Panel - desktop only */}
            <div className="hidden lg:block lg:col-span-7 relative p-10 md:p-12 bg-slate-900 dark:bg-slate-950 rounded-2xl text-slate-100 overflow-hidden border border-slate-800 shadow-sm">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
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
                      <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
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
            <div className="lg:col-span-5 max-w-md mx-auto w-full">
              <Card className="border border-border bg-card shadow-xs rounded-xl">
                <CardHeader className="space-y-1 text-center pb-4">
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
                        <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@company.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="pl-9 pr-10 h-11 sm:h-10 text-base sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          disabled={isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 sm:h-10 text-sm font-semibold mt-2" disabled={isLoading}>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
