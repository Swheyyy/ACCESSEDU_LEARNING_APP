import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TextToSignPage from "@/pages/text-to-sign";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import LoginPage from "@/pages/login-page";

import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  allowedRole?: string;
}

function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait until auth state resolves before making any redirect decision
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Strict authentication enforcement
  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Root is now the Landing Page as requested for sign-out flow */}
      <Route path="/" component={LandingPage} />
      
      {/* Role Selection Page */}
      <Route path="/auth" component={LoginPage} />
      
      {/* Login/Signup Form Page */}
      <Route path="/login" component={AuthPage} />
      
      <Route path="/student-dashboard">
        <ProtectedRoute component={StudentDashboard} path="/student-dashboard" />
      </Route>
      <Route path="/teacher-dashboard">
        <ProtectedRoute component={TeacherDashboard} path="/teacher-dashboard" />
      </Route>
      <Route path="/admin-dashboard">
        <ProtectedRoute component={AdminDashboard} path="/admin-dashboard" />
      </Route>

      <Route path="/text-to-sign" component={TextToSignPage} />
      
      {/* Catch-all redirect to landing page */}
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isDashboard = location === "/" || 
    location.startsWith("/student-dashboard") ||
    location.startsWith("/teacher-dashboard") ||
    location.startsWith("/admin-dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="accessedu-theme">
        <AccessibilityProvider>
          <AuthProvider>
            <TooltipProvider>
              <div className="min-h-screen flex flex-col bg-background">
                {!isDashboard && <Header />}
                <Router />
              </div>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
