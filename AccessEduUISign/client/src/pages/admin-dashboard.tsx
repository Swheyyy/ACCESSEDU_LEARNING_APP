import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Users, Activity, ShieldCheck, Cpu,
    AlertTriangle, CheckCircle, Video, EarOff,
    Search, ExternalLink, MoreHorizontal, Settings,
    FileCheck, PieChart, ShieldAlert, Zap, Globe,
    UserPlus, Bell, User, Languages, TrendingUp, Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import type { User as UserType, Course } from "@shared/schema";

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");

    const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
        queryKey: ["/api/users"],
    });

    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
        queryKey: ["/api/courses"],
    });

    if (usersLoading || coursesLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            </div>
        );
    }

    const dhhStudentsCount = users?.filter(u => u.userType === 'deaf_student' || u.userType === 'student').length || 0;
    const teachersCount = users?.filter(u => u.userType === 'teacher').length || 0;
    const totalUsers = users?.length || 0;
    const totalCourses = courses?.length || 0;

    return (
        <div className="flex h-screen bg-[#f1f5f9]/40 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 lg:w-72 border-r bg-slate-900 text-white flex flex-col items-center py-8 lg:items-start lg:px-8 gap-10 shadow-2xl z-50">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-green-500 rounded-2xl text-slate-900 shadow-lg shadow-green-500/20"><ShieldCheck className="w-6 h-6" /></div>
                    <span className="text-2xl font-black lg:block hidden tracking-tighter">AdminCenter</span>
                </div>

                <nav className="flex-1 w-full space-y-3">
                    {[
                        { id: "overview", label: "Overview", icon: Activity },
                        { id: "users", label: "User Management", icon: Users },
                        { id: "interpreters", label: "Interpreters", icon: Languages },
                        { id: "ai_models", label: "AI Monitoring", icon: Cpu },
                        { id: "compliance", label: "Accessibility Hub", icon: FileCheck },
                        { id: "settings", label: "Settings", icon: Settings },
                        { id: "profile", label: "Profile", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? "bg-white/10 text-green-400 border border-white/5 font-extrabold shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="lg:block hidden text-sm uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full pt-8 border-t border-white/10 flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 lg:opacity-100 opacity-0 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-white/10">
                            {currentUser?.name?.[0] || 'A'}
                        </div>
                        <div className="hidden lg:block overflow-hidden">
                            <p className="text-xs font-black truncate">{currentUser?.name || "SuperAdmin"}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{currentUser?.userType}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto">
                <header className="h-24 bg-white/80 backdrop-blur-xl px-10 border-b flex items-center justify-between sticky top-0 z-40 shadow-sm border-slate-200">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Governance</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Performance & Compliance Monitoring</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-black text-slate-600 uppercase">System: Operational</span>
                        </div>
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-slate-50 transition-colors"><Bell className="w-4 h-4 text-slate-600" /></Button>
                        <Button className="bg-slate-900 text-white hover:bg-black rounded-full px-6 font-bold shadow-xl">System Logs</Button>
                    </div>
                </header>

                <div className="p-10 lg:p-14 space-y-12 max-w-7xl mx-auto">

                    {activeTab === "overview" && (
                        <div className="space-y-10 animate-in fade-in duration-700">
                            <div className="grid md:grid-cols-4 gap-8">
                                {[
                                    { label: "DHH Students", count: dhhStudentsCount.toLocaleString(), change: "+12%", status: "up", icon: EarOff, color: "text-blue-600" },
                                    { label: "Active Teachers", count: teachersCount.toLocaleString(), change: "+4", status: "up", icon: Users, color: "text-purple-600" },
                                    { label: "Total Courses", count: totalCourses.toLocaleString(), change: "Active", status: "none", icon: Video, color: "text-green-600" },
                                    { label: "Total Users", count: totalUsers.toLocaleString(), change: "Optimal", status: "neutral", icon: Zap, color: "text-amber-600" },
                                ].map((stat, i) => (
                                    <Card key={i} className="border-none shadow-2xl hover:scale-105 transition-transform duration-300 bg-white group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-slate-900 transition-colors" />
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</CardTitle>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-black text-slate-900">{stat.count}</div>
                                            <p className={`text-[10px] font-black mt-2 tracking-widest flex items-center gap-1 ${stat.status === 'up' ? 'text-green-600' : 'text-slate-500'
                                                }`}>
                                                {stat.status === 'up' && <TrendingUp className="w-3 h-3" />}
                                                {stat.change}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 border-none shadow-2xl bg-white p-10 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                                <PieChart className="w-6 h-6 text-indigo-600" /> Engagement Analysis
                                            </h3>
                                            <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Platform Activity last 24h</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black px-4 py-2">Real-time Analytics</Badge>
                                        </div>
                                    </div>
                                    <div className="h-[250px] w-full bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner relative group">
                                        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between h-32 gap-4">
                                            {[30, 80, 45, 90, 60, 100, 70].map((h, i) => (
                                                <div key={i} className={`flex-1 rounded-t-xl transition-all duration-1000 bg-indigo-500/20 group-hover:bg-indigo-600/40`} style={{ height: `${h}%` }}>
                                                    <div className="w-full bg-indigo-600 rounded-t-xl transition-all duration-1000 group-hover:h-full" style={{ height: '40%' }} />
                                                </div>
                                            ))}
                                        </div>
                                        <Activity className="w-12 h-12 text-indigo-400/20" />
                                    </div>
                                </Card>

                                <Card className="border-none shadow-2xl bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
                                    <div>
                                        <ShieldAlert className="w-12 h-12 text-red-400 mb-6" />
                                        <h3 className="text-3xl font-black mb-4">Accessibility Compliance</h3>
                                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                            Current compliance rating: <span className="text-white font-black underline decoration-green-400 decoration-4 underline-offset-8">98.4%</span>
                                        </p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-black text-slate-500 uppercase">
                                                <span>WCAG 2.1 Level AA</span>
                                                <span className="text-green-400">PASSED</span>
                                            </div>
                                            <Progress value={98} className="h-2 bg-white/10" />
                                        </div>
                                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl h-14">View Warnings (2)</Button>
                                    </div>
                                    <Globe className="w-48 h-48 text-white/5 absolute -right-16 -top-16" />
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black">User Management</h2>
                                    <p className="text-slate-500">Manage students, teachers, and interpreters.</p>
                                </div>
                                <Button className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-2xl font-bold gap-2">
                                    <UserPlus className="w-5 h-5" /> Add New User
                                </Button>
                            </div>

                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                {["Name", "Role", "Email", "Joined", "Preferences"].map((h) => (
                                                    <th key={h} className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users?.map((u, i) => (
                                                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-6 font-bold text-slate-900">{u.name}</td>
                                                    <td className="p-6">
                                                        <Badge className={`bg-slate-100 text-slate-600 border-none font-black text-[10px] px-3 py-1 rounded-full uppercase`}>{u.userType}</Badge>
                                                    </td>
                                                    <td className="p-6 text-sm font-medium text-slate-600">{u.email}</td>
                                                    <td className="p-6 text-sm text-slate-500 font-medium">{new Date(u.createdAt as any).toLocaleDateString()}</td>
                                                    <td className="p-6 text-sm font-bold text-slate-700">{u.preferences ? 'Set' : 'No'}</td>
                                                    <td className="p-6 text-right">
                                                        <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="w-5 h-5" /></Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Other tabs remain largely static for now as they are placeholder AI monitoring etc */}
                </div>
            </main>
        </div>
    );
}
