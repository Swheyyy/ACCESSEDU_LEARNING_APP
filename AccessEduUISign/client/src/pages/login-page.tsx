import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    GraduationCap, Briefcase, ShieldCheck,
    ArrowRight, Users, Eye, Sparkles, Star
} from "lucide-react";

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();
    const [hoveredRole, setHoveredRole] = useState<string | null>(null);

    const roles = [
        {
            id: "deaf_student",
            username: "student",
            title: "I am a Student",
            description: "Visual-first learning, ASL support, and AI doubt solving.",
            icon: GraduationCap,
            color: "bg-blue-500",
            target: "/student-dashboard"
        },
        {
            id: "teacher",
            username: "teacher",
            title: "I am a Teacher",
            description: "Manage courses, auto-caption videos, and track student success.",
            icon: Briefcase,
            color: "bg-purple-500",
            target: "/teacher-dashboard"
        },
        {
            id: "admin",
            username: "admin",
            title: "I am an Admin",
            description: "Oversee systems, manage users, and ensure accessibility.",
            icon: ShieldCheck,
            color: "bg-green-500",
            target: "/admin-dashboard"
        }
    ];

    const handleLogin = async (role: any) => {
        try {
            await login({ username: role.username, password: "password123" });
            setLocation(role.target);
        } catch (error) {
            setLocation(role.target);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-white rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                AccessEdu
                            </span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Inclusive Education for Everyone
                    </h1>
                    <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                        Welcome back! Select your role to access your personalized dashboard and AI-powered tools.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <Card
                            key={role.id}
                            className={`relative overflow-hidden cursor-pointer transition-all duration-300 border-2 ${hoveredRole === role.id ? "border-blue-400 shadow-2xl scale-105 -translate-y-1" : "border-slate-100 shadow-lg"
                                }`}
                            onMouseEnter={() => setHoveredRole(role.id)}
                            onMouseLeave={() => setHoveredRole(null)}
                            onClick={() => handleLogin(role)}
                        >
                            <div className={`h-2 ${role.color}`} />
                            <CardHeader className="space-y-4">
                                <div className={`w-12 h-12 rounded-xl ${role.color}/10 flex items-center justify-center`}>
                                    <role.icon className={`w-6 h-6 ${role.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">{role.title}</CardTitle>
                                    <CardDescription className="mt-2 text-slate-500 line-clamp-2">
                                        {role.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Button 
                                    className="w-full gap-2 items-center group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogin(role);
                                    }}
                                >
                                    Enter Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>

                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${role.color}/5 -z-10`} />
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 pt-8 border-t border-slate-200">
                    <div className="flex items-center gap-8 text-slate-400 grayscale opacity-70">
                        <div className="flex items-center gap-2 font-bold"><Users className="w-4 h-4" /> 10K+ Learners</div>
                        <div className="flex items-center gap-2 font-bold"><StatIcon className="w-4 h-4" /> 12 AI Models</div>
                        <div className="flex items-center gap-2 font-bold"><GraduationCap className="w-4 h-4" /> 500+ Teachers</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatIcon({ className }: { className?: string }) {
    return <Eye className={className} />;
}

