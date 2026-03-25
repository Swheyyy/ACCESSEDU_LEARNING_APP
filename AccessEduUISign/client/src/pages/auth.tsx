import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { Star, Loader2, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    setLocation("/student_dashboard");
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>, type: "login" | "register") => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      if (type === "login") {
        await login(data);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Registration failed");
        await login({ username: data.username, password: data.password });
        toast({ title: "Welcome to AccessEdu", description: "Account created successfully." });
      }
      setLocation("/student_dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[90vh] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl mb-4 transform hover:rotate-12 transition-transform">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">AccessEdu</CardTitle>
          <CardDescription className="text-slate-500 font-medium">Empowering communication for every learner</CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-100/50 rounded-2xl">
              <TabsTrigger value="login" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={(e) => handleAuth(e, "login")} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Username</Label>
                  <Input name="username" placeholder="johndoe" required className="rounded-xl border-slate-200 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Password</Label>
                  <Input name="password" type="password" required className="rounded-xl border-slate-200 focus:ring-blue-500" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={(e) => handleAuth(e, "register")} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Full Name</Label>
                  <Input name="name" placeholder="John Doe" required className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Email</Label>
                  <Input name="email" type="email" placeholder="john@example.com" required className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Username</Label>
                  <Input name="username" placeholder="johndoe123" required className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold ml-1">Password</Label>
                  <Input name="password" type="password" required className="rounded-xl border-slate-200" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold shadow-lg shadow-purple-200 transition-all active:scale-95" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="bg-slate-50/50 p-6 flex flex-col gap-2 text-center border-t border-slate-100">
           <p className="text-xs text-slate-400 font-medium tracking-wide">
             SECURE AUTHENTICATION POWERED BY ACCESSEDU CLOUD
           </p>
        </CardFooter>
      </Card>
    </main>
  );
}
