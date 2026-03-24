import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { UserType } from "@shared/schema";
import { Hand, Users, GraduationCap, Eye, ArrowRight } from "lucide-react";

const userTypes: {
  type: UserType;
  icon: typeof Hand;
  title: string;
  description: string;
  color: string;
}[] = [
    {
      type: "deaf",
      icon: Hand,
      title: "Deaf & Hard of Hearing",
      description: "Optimized for visual feedback.",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      type: "non_signer",
      icon: Users,
      title: "Non-Signer",
      description: "Learn sign language.",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      type: "teacher_admin",
      icon: GraduationCap,
      title: "Teacher / Administrator",
      description: "Facilitate inclusive learning environments.",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      type: "elderly_visually_challenged",
      icon: Eye,
      title: "Elderly / Visually Challenged",
      description: "Maximum accessibility.",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

export default function AuthPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = (userType: UserType) => {
    login(userType);

    if (userType === "teacher_admin") {
      setLocation("/teacher-dashboard");
    } else if (userType === "non_signer") {
      setLocation("/text-to-sign");
    } else if (userType === "elderly_visually_challenged") {
      setLocation("/elderly-dashboard");
    } else {
      setLocation("/recognize");
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4" role="main">
      <Card className="w-full max-w-2xl" data-testid="card-auth">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Hand className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Choose Your Experience</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Select the option that best describes you to personalize your AccessEdu experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {userTypes.map((userType) => (
              <Button
                key={userType.type}
                variant="outline"
                className="h-auto p-6 flex flex-col items-start text-left space-y-3 hover-elevate"
                onClick={() => handleLogin(userType.type)}
                data-testid={`button-usertype-${userType.type}`}
              >
                <div className={`w-12 h-12 rounded-xl ${userType.color} flex items-center justify-center`}>
                  <userType.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{userType.title}</p>
                  <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                    {userType.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-medium">
                  Continue
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </Button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            This is a demo experience. No account creation required.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
