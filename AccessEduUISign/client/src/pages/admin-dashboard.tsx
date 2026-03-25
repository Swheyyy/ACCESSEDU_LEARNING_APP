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
    UserPlus, Bell, User, Languages, TrendingUp, Loader2,
    Sparkles, Star, LayoutDashboard, LogOut, SearchIcon, Hand
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import type { User as UserType, Course } from "@shared/schema";

export default function AdminDashboard() {
    const { user: currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");

    const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
        queryKey: ["/api/users"],
    });

    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
        queryKey: ["/api/courses"],
    });

    if (usersLoading || coursesLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    const dhhStudentsCount = users?.filter(u => u.userType === 'deaf_student' || u.userType === 'student').length || 0;
    const teachersCount = users?.filter(u => u.userType === 'teacher').length || 0;
    const totalUsers = users?.length || 0;
    const totalCourses = courses?.length || 0;

    const staticUsers = [
        { id: 901, name: "Pranav Sharma", userType: "deaf_student", email: "pranav.asl@edu.com", createdAt: "2024-03-20T10:00:00Z" },
        { id: 902, name: "Ananya Iyer", userType: "student", email: "ananya.i@network.com", createdAt: "2024-03-21T12:30:00Z" },
        { id: 903, name: "Rahul Verma", userType: "teacher", email: "r.verma@faculty.edu.com", createdAt: "2024-02-15T09:15:00Z" },
        { id: 904, name: "Meera Reddy", userType: "deaf_student", email: "meera.reddy@asl.org", createdAt: "2024-03-22T08:45:00Z" },
        { id: 905, name: "Aditya Das", userType: "teacher", email: "aditya.sign@edu.com", createdAt: "2024-01-10T14:20:00Z" },
        { id: 906, name: "Sneha Kapur", userType: "admin", email: "skapur.gov@admin.com", createdAt: "2023-12-01T11:00:00Z" },
        { id: 907, name: "Vikram Malhotra", userType: "student", email: "vikram.m@domain.com", createdAt: "2024-03-23T16:10:00Z" },
        { id: 908, name: "Ishani Bose", userType: "deaf_student", email: "ishani.b@asl-learn.com", createdAt: "2024-03-24T10:00:00Z" },
    ];

    const allUsers = [...(users || []), ...staticUsers];

    return (
        <div className="flex h-screen bg-[#f8fafc]/5 overflow-hidden text-slate-900">
            {/* Unified Sidebar */}
            <aside className="w-20 lg:w-64 border-r bg-white flex flex-col items-center py-6 lg:items-start lg:px-6 gap-8 z-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white font-black shadow-lg shadow-blue-200"><Sparkles className="w-6 h-6" /></div>
                    <span className="text-xl font-black lg:block hidden tracking-tight">AccessEdu <span className="text-blue-600 text-[8px] border border-blue-200 px-1 rounded uppercase">Admin</span></span>
                </div>

                <nav className="flex-1 w-full space-y-2">
                    {[
                        { id: "overview", label: "Overview", icon: LayoutDashboard },
                        { id: "students", label: "Students", icon: Users },
                        { id: "staff", label: "Staff", icon: ShieldCheck },
                        { id: "profile", label: "Profile Settings", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="lg:block hidden text-sm font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <button onClick={logout} className="flex lg:justify-start justify-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="lg:block hidden text-xs">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto">
                {/* Unified Header */}
                <header className="h-20 bg-white/50 backdrop-blur-xl px-8 border-b flex items-center justify-between sticky top-0 z-40 border-slate-200">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            ADMIN CONSOLE
                            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black tracking-widest uppercase italic">GOVERNANCE</Badge>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="md:flex hidden items-center gap-3 px-6 py-2 bg-green-50 rounded-full border border-green-100 mr-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitoring</span>
                        </div>
                        
                        <div className="flex items-center gap-3 pl-4 border-l">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900">{currentUser?.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">Network Principal</p>
                            </div>
                            <div className="w-10 h-10 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-xl hover:rotate-6 transition-transform">
                                {currentUser?.name?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 space-y-12 max-w-7xl mx-auto">

                    {activeTab === "overview" && (
                        <div className="space-y-10 animate-in fade-in duration-700">
                            <div className="grid md:grid-cols-4 gap-6">
                                {[
                                    { label: "ASL Learners", count: "12,840", change: "+12.4%", icon: EarOff, color: "bg-blue-600" },
                                    { label: "Expert Staff", count: "842", change: "+4.2%", icon: Users, color: "bg-purple-600" },
                                    { label: "ASL Lessons", count: "1,250", change: "Active", icon: Video, color: "bg-green-600" },
                                    { label: "Signs Recognized", count: "482K", change: "Optimal", icon: Zap, color: "bg-amber-600" },
                                ].map((stat, i) => (
                                    <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group rounded-[2.5rem] overflow-hidden">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</CardTitle>
                                            <div className={`${stat.color} p-2 rounded-xl text-white shadow-lg`}><stat.icon className="w-4 h-4" /></div>
                                        </CardHeader>
                                        <CardContent className="px-6 pb-6 pt-0">
                                            <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.count}</div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Badge className="bg-slate-50 text-slate-500 border-none font-black text-[9px] px-3 py-1 rounded-full tracking-widest uppercase">MONTHLY CAP</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 border-none shadow-2xl bg-white p-10 rounded-[3rem] relative overflow-hidden group border-t-8 border-t-blue-600/5">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tight">
                                                <Activity className="w-6 h-6 text-blue-600" />
                                                Daily Signs Translated
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-10">Network-wide ASL Recognition Traffic</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl font-black text-blue-600 tracking-tighter">4,821</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signs Today</span>
                                        </div>
                                    </div>
                                    <div className="h-[280px] w-full bg-slate-50/50 rounded-[2.5rem] flex items-end justify-center px-8 pb-10 gap-1 border-b-4 border-b-blue-600/5 relative overflow-hidden">
                                        {[30, 45, 20, 60, 40, 75, 55, 90, 65, 100, 80, 50, 70, 45, 85, 95, 60, 40, 75, 55, 90, 65, 100, 78, 85, 95, 30, 45, 20, 60].map((h, i) => (
                                            <div key={i} className="flex-1 min-w-[3px] group/bar relative h-full flex items-end">
                                                <div 
                                                    className={`w-full rounded-t-full transition-all duration-500 ${i === 23 ? 'bg-blue-600' : 'bg-blue-400 group-hover/bar:bg-blue-600'}`} 
                                                    style={{ height: `${Math.max(4, i === 23 ? 85 : h)}%` }}
                                                >
                                                    {i === 23 && (
                                                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-30 border-2 border-white pointer-events-none">
                                                            782 SIGNS
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between px-14 pt-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                        <span>MAR 01</span>
                                        <span>PEAK: MAR 24</span>
                                        <span>TODAY</span>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-2xl bg-slate-900 text-white p-8 rounded-[3rem] relative overflow-hidden flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20"><Hand className="w-6 h-6 text-white" /></div>
                                        <h3 className="text-2xl font-black leading-tight mb-1 tracking-tight">Translation Accuracy</h3>
                                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest pt-2">WLASL Model V4.2</p>
                                    </div>
                                    
                                    <div className="relative z-10 mt-auto space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                               <span className="text-4xl font-black text-blue-400 tracking-tighter">98.4%</span>
                                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">High Precision</span>
                                            </div>
                                            <Progress value={98} className="h-1.5 bg-white/10" />
                                        </div>
                                        <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-full h-12 text-[10px] uppercase tracking-widest">View Recognition Logs</Button>
                                    </div>
                                    <Globe className="w-64 h-64 text-blue-500/5 absolute -right-24 -top-24 transform rotate-12" />
                                </Card>
                            </div>
                        </div>
                    )}

                    {(activeTab === "students" || activeTab === "staff") && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight uppercase tracking-tight">{activeTab === "students" ? "Student Registry" : "Faculty & Staff"}</h2>
                                    <p className="text-slate-500 font-medium">Manage platform-wide identities and security profiles.</p>
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-full font-black shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest italic">
                                    <UserPlus className="w-5 h-5 mr-3" /> Enroll Identity
                                </Button>
                            </div>

                            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                {["Identity", "Role", "Credentials", "Registration", "Action"].map((h) => (
                                                    <th key={h} className="p-8 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {allUsers?.filter(u => activeTab === 'students' ? (u.userType === 'student' || u.userType === 'deaf_student') : (u.userType === 'teacher' || u.userType === 'admin')).map((u) => (
                                                <tr key={u.id} className="hover:bg-blue-50/30 transition-all group">
                                                    <td className="p-8 border-none">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{u.name?.[0]}</div>
                                                            <div className="font-black text-slate-900 text-lg tracking-tight italic">{u.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 border-none">
                                                        <Badge className={`bg-blue-50 text-blue-600 border-none font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest group-hover:bg-white group-hover:shadow-sm`}>{u.userType?.replace('_', ' ')}</Badge>
                                                    </td>
                                                    <td className="p-8 border-none text-sm font-bold text-slate-500 italic">"{u.email}"</td>
                                                    <td className="p-8 border-none text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(u.createdAt as any).toLocaleDateString()}</td>
                                                    <td className="p-8 border-none text-right">
                                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md transition-all"><MoreHorizontal className="w-5 h-5 text-slate-400" /></Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-500 pt-10">
                            <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-[3.5rem] bg-slate-900 flex items-center justify-center text-5xl font-black text-white border-8 border-white shadow-2xl overflow-hidden">
                                        {currentUser?.name?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-blue-600 rounded-3xl border-4 border-white flex items-center justify-center shadow-xl">
                                        <Star className="w-7 h-7 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-5xl font-black tracking-tight text-slate-900 italic uppercase">{currentUser?.name}</h2>
                                        <p className="text-blue-600 font-black uppercase tracking-widest text-sm italic">Network Administrator • Governance Lead</p>
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg max-w-lg italic">"{currentUser?.email}"</p>
                                    <div className="flex gap-4 justify-center md:justify-start pt-4">
                                        <Button className="rounded-full font-black px-12 py-6 h-auto bg-slate-900 text-white shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest italic">Modify Permissions</Button>
                                        <Button variant="outline" className="rounded-full font-black px-12 py-6 h-auto border-2 hover:bg-slate-50 text-xs uppercase tracking-widest italic">System Settings</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
