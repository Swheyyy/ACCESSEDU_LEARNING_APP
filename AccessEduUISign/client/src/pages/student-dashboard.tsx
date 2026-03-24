import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Course } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import {
    PlayCircle, BookOpen, MessageSquare, Video,
    HelpCircle, CheckCircle, Languages, LayoutTemplate,
    Settings, Loader2, Camera, User, Star, Bell,
    Trophy, TrendingUp, Search, MoreVertical, LogOut,
    Sparkles, BrainCircuit, ArrowRight
} from "lucide-react";

export default function StudentDashboard() {
    const { toast } = useToast();
    const { user, logout } = useAuth();
    const [showSignOverlay, setShowSignOverlay] = useState(true);
    const [showCaptions, setShowCaptions] = useState(true);
    const [activeTab, setActiveTab] = useState("course");
    const [askingDoubt, setAskingDoubt] = useState(false);
    const [recordingDoubt, setRecordingDoubt] = useState(false);
    const [doubtText, setDoubtText] = useState("");

    // Fetch all available courses
    const { data: allCourses = [], isLoading: loadingAll } = useQuery<Course[]>({
        queryKey: ["/api/courses"]
    });

    // Fetch enrolled courses
    const { data: enrolledCourses = [], isLoading: loadingEnrolled } = useQuery<any[]>({
        queryKey: ["/api/enrollments"]
    });

    const enrolledIds = useMemo(() => new Set(enrolledCourses.map(e => e.courseId)), [enrolledCourses]);

    // Doubt Queries
    const { data: doubts = [] } = useQuery<any[]>({
        queryKey: ["/api/doubts/student"],
    });

    const askDoubtMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch("/api/doubts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessedu_token")}`
                },
                body: JSON.stringify({ content, teacherId: enrolledCourses[0]?.course?.teacherId || 1 })
            });
            if (!res.ok) throw new Error("Failed to send doubt");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/doubts/student"] });
            toast({ title: "Question Sent", description: "Your teacher will respond soon." });
            setAskingDoubt(false);
            setDoubtText("");
        }
    });

    // Enrollment Mutation
    const enrollMutation = useMutation({
        mutationFn: async (courseId: number) => {
            const res = await fetch(`/api/enrollments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessedu_token")}`
                },
                body: JSON.stringify({ courseId })
            });
            if (!res.ok) throw new Error("Enrollment failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
            toast({
                title: "Successfully Enrolled!",
                description: "The course has been added to your dashboard.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const handleEnroll = (courseId: number) => {
        enrollMutation.mutate(courseId);
    };

    const handleAskDoubt = () => {
        if (!doubtText.trim()) return;
        askDoubtMutation.mutate(doubtText);
    };

    const startVideoDoubt = () => {
        setRecordingDoubt(true);
        toast({
            title: "Recording Sign Language",
            description: "Please sign your question. AI will transcribe it for the teacher.",
        });
        setTimeout(() => {
            setRecordingDoubt(false);
            setAskingDoubt(false);
            toast({
                title: "Doubt Uploaded",
                description: "Your sign language video was translated to text and sent to the teacher.",
            });
        }, 4000);
    };

    if (loadingAll || loadingEnrolled) {
        return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="flex h-screen bg-[#f8fafc]/5 overflow-hidden">
            {/* Visual Sidebar */}
            <aside className="w-20 lg:w-64 border-r bg-white flex flex-col items-center py-6 lg:items-start lg:px-6 gap-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white"><Sparkles className="w-6 h-6" /></div>
                    <span className="text-xl font-black lg:block hidden">AccessEdu</span>
                </div>

                <nav className="flex-1 w-full space-y-2">
                    {[
                        { id: "course", label: "Courses", icon: BookOpen },
                        { id: "path", label: "Learning Path", icon: LayoutTemplate },
                        { id: "quizzes", label: "Quizzes", icon: CheckCircle },
                        { id: "messages", label: "Teacher Chat", icon: MessageSquare },
                        { id: "profile", label: "My Profile", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? "bg-blue-50 text-blue-600 border border-blue-100 font-bold" : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="lg:block hidden">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <button className="flex lg:justify-start justify-center gap-3 p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                        <Settings className="w-5 h-5" />
                        <span className="lg:block hidden">Settings</span>
                    </button>
                    <button onClick={logout} className="flex lg:justify-start justify-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="lg:block hidden">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto">
                <header className="h-20 border-b bg-white/50 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="relative max-w-md w-full md:block hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search lessons..." className="pl-10 bg-slate-100/50 border-none rounded-full h-10 w-full" />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        </Button>
                        <div className="flex items-center gap-3 pl-4 border-l">
                            <p className="text-right sm:block hidden">
                                <span className="block text-sm font-bold">{user?.name}</span>
                                <span className="block text-xs text-slate-400 font-medium">{user?.userType === 'deaf_student' ? 'DHH Student' : 'Student'} • 450 XP</span>
                            </p>
                            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black">
                                {user?.name?.split(' ').map(n => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
                    
                    {/* Gamification Dashboard TopBar */}
                    <div className="grid lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="col-span-1 lg:col-span-2 shadow-xl border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Trophy className="w-32 h-32" />
                            </div>
                            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
                                <div>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4">Level 3: Sign Master</Badge>
                                    <h2 className="text-3xl font-black mb-1">Keep it up, {user?.name?.split(' ')[0]}!</h2>
                                    <p className="text-blue-100 font-medium opacity-90">You are 150 XP away from the next tier.</p>
                                </div>
                                <div className="mt-8 space-y-3">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>450 XP</span>
                                        <span>600 XP</span>
                                    </div>
                                    <Progress value={75} className="h-4 bg-black/20 [&>div]:bg-white rounded-full" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-none rounded-[2rem] bg-orange-50/50 relative overflow-hidden group">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                    <TrendingUp className="w-8 h-8" />
                                </div>
                                <h3 className="text-4xl font-black text-slate-800">5 <span className="text-xl text-slate-400">Days</span></h3>
                                <p className="font-bold text-orange-600 mt-1">Learning Streak</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-none rounded-[2rem] bg-purple-50/50 relative overflow-hidden group">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                    <Star className="w-8 h-8" />
                                </div>
                                <h3 className="text-4xl font-black text-slate-800">4</h3>
                                <p className="font-bold text-purple-600 mt-1">Badges Earned</p>
                            </CardContent>
                        </Card>
                    </div>

                    {activeTab === "course" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">Your Enrolled Courses</h2>
                                    <p className="text-slate-500">Pick up right where you left off.</p>
                                </div>
                                <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 gap-2">
                                    <TrendingUp className="w-4 h-4" /> 5 Day Streak
                                </Badge>
                            </div>

                            {enrolledCourses.length === 0 ? (
                                <Card className="p-12 text-center space-y-4 border-dashed border-2">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold">No courses yet</h3>
                                    <p className="text-slate-500">You haven't enrolled in any courses. Explore the Learning Path to get started!</p>
                                    <Button onClick={() => setActiveTab("path")} className="rounded-full px-8">Explore Learning Path</Button>
                                </Card>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {enrolledCourses.map(e => (
                                        <Card key={e.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                                            <div className="h-40 relative bg-slate-100 flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-slate-300" />
                                                <Badge className="absolute top-4 right-4 bg-blue-600 text-white border-none">Active</Badge>
                                            </div>
                                            <CardHeader className="p-5">
                                                <CardTitle className="text-lg font-bold">{e.course?.title}</CardTitle>
                                                <CardDescription className="line-clamp-2">{e.course?.description}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="p-5 pt-0">
                                                <Button className="w-full rounded-xl">Resume Learning</Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-6 pt-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">Active Lesson</h2>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Emotion-Aware Learning Alert */}
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="w-5 h-5 text-red-600 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-red-800 tracking-tight">AI Intervention Triggered</h4>
                                            <p className="text-sm font-medium text-red-700/80 mt-1">
                                                We noticed you spent 3x longer on the last quiz and got sequential incorrect answers. Would you like to switch to <strong className="font-extrabold cursor-pointer border-b-2 border-red-300 hover:text-red-900 transition-colors">Simplified Mode</strong> or view a <strong className="font-extrabold cursor-pointer border-b-2 border-red-300 hover:text-red-900 transition-colors">Step-by-Step Visualization</strong>?
                                            </p>
                                        </div>
                                    </div>

                                    <Card className="overflow-hidden border-2 border-blue-100/50 shadow-2xl group">
                                        <div className="relative aspect-video bg-black rounded-t-xl">
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-colors">
                                                <PlayCircle className="w-20 h-20 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xl" />
                                            </div>
                                            {showCaptions && (
                                                <div className="absolute bottom-6 left-6 right-6">
                                                    <div className="bg-black/90 p-4 rounded-xl border border-white/20 text-center">
                                                        <p className="text-yellow-400 font-black text-xl leading-relaxed">
                                                            The Sun is a yellow dwarf star, a hot ball of glowing gases at the heart of our solar system.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {showSignOverlay && (
                                                <div className="absolute right-6 top-6 w-1/3 aspect-video bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden shadow-2xl ring-4 ring-black/20">
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <User className="w-16 h-16 text-white/40" />
                                                    </div>
                                                    <div className="absolute bottom-2 right-2"><Badge variant="outline" className="text-[8px] bg-black/40 border-none text-white uppercase tracking-widest">ASL Live</Badge></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 bg-white flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <Button variant={showCaptions ? "default" : "outline"} className="gap-2 rounded-full px-6" onClick={() => setShowCaptions(!showCaptions)}>
                                                    <Languages className="w-4 h-4" /> Captions
                                                </Button>
                                                <Button variant={showSignOverlay ? "default" : "outline"} className="gap-2 rounded-full px-6" onClick={() => setShowSignOverlay(!showSignOverlay)}>
                                                    <Video className="w-4 h-4" /> Sign Avatar
                                                </Button>
                                            </div>
                                            <Button variant="secondary" className="gap-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" onClick={() => setAskingDoubt(true)}>
                                                <HelpCircle className="w-5 h-5" /> Doubt Solver
                                            </Button>
                                        </div>
                                    </Card>

                                    {askingDoubt && (
                                        <Card className="border-blue-400 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                            <CardHeader>
                                                <CardTitle>AI Help System</CardTitle>
                                                <CardDescription>Not understanding something? Our AI will translate your sign language into a question for the teacher.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex gap-2">
                                                    <Input 
                                                        placeholder="Type question..." 
                                                        className="rounded-full bg-slate-50 border-slate-200"
                                                        value={doubtText}
                                                        onChange={(e) => setDoubtText(e.target.value)}
                                                    />
                                                    <Button 
                                                        className="rounded-full px-8" 
                                                        onClick={handleAskDoubt}
                                                        disabled={askDoubtMutation.isPending}
                                                    >
                                                        {askDoubtMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                                                    </Button>
                                                </div>
                                                <div className="relative flex items-center my-2">
                                                    <div className="flex-grow border-t"></div>
                                                    <span className="mx-4 text-xs font-bold text-slate-400">OR RECORD ASL</span>
                                                    <div className="flex-grow border-t"></div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-32 flex flex-col gap-3 rounded-2xl border-dashed border-2 hover:bg-slate-50 transition-colors"
                                                    onClick={startVideoDoubt}
                                                    disabled={recordingDoubt}
                                                >
                                                    {recordingDoubt ? <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> : <Camera className="w-8 h-8 text-slate-400" />}
                                                    <span className="font-bold text-slate-600">{recordingDoubt ? "Translating Signing into English Text..." : "Record ASL Question (Sign Language to Text)"}</span>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {doubts.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold">Previous Doubts</h3>
                                            {doubts.map(doubt => (
                                                <Card key={doubt.id} className="p-4 border-l-4 border-blue-500">
                                                    <p className="font-bold">{doubt.content}</p>
                                                    {doubt.response ? (
                                                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800 border border-green-100">
                                                            <p className="font-black uppercase text-[10px] mb-1">Teacher Response:</p>
                                                            {doubt.response}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest italic">Awaiting response...</p>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <Card className="h-full border-none shadow-xl bg-gradient-to-br from-white to-indigo-50/50">
                                        <CardHeader>
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"><Sparkles className="w-3 h-3 mr-1" /> AI Generated</Badge>
                                            </div>
                                            <CardTitle className="text-2xl font-black text-indigo-900 tracking-tight">Visual Concept Engine</CardTitle>
                                            <CardDescription className="font-medium text-slate-500">Our AI has translated this lesson into visual infographics to aid comprehension.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-white space-y-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-inner">1</div>
                                                    <span className="font-bold text-lg text-slate-800">Gravity Mechanics</span>
                                                </div>
                                                <div className="bg-slate-50/50 p-6 rounded-2xl flex flex-col items-center gap-3 border border-slate-100 shadow-inner">
                                                    <div className="flex gap-4 items-center animate-pulse">
                                                        <span className="text-5xl">🌎</span>
                                                        <span className="text-2xl font-black text-slate-300">⬅</span>
                                                        <span className="text-5xl shrink-0">🍏</span>
                                                    </div>
                                                    <p className="text-xs text-center font-medium text-slate-500 uppercase tracking-wider">Earth pulls things down.</p>
                                                </div>
                                            </div>
                                            <Button className="w-full bg-slate-900 text-white hover:bg-black rounded-xl">Generate More Visuals</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    {activeTab === "path" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Personalized Learning Path</h2>
                                <p className="text-slate-500">AI-suggested next steps based on your progress.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allCourses.map(course => (
                                    <Card key={course.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                                        <div className="h-40 relative bg-slate-100 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-slate-300" />
                                            <Badge className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white border-white/30">Course</Badge>
                                        </div>
                                        <CardHeader className="p-5">
                                            <CardTitle className="text-lg font-bold">{course.title}</CardTitle>
                                            <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0 space-y-4">
                                            {enrolledIds.has(course.id) ? (
                                                <Button className="w-full rounded-xl" onClick={() => setActiveTab("course")}>
                                                    Go to Dashboard
                                                </Button>
                                            ) : (
                                                <Button 
                                                    className="w-full rounded-xl" 
                                                    variant="outline"
                                                    disabled={enrollMutation.isPending}
                                                    onClick={() => handleEnroll(course.id)}
                                                >
                                                    {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Add to my courses
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "quizzes" && (
                        <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-black tracking-tight">Interactive Visual Quiz</h2>
                                <p className="text-slate-500 font-bold">Question 4 of 10 • Topic: Space Exploration</p>
                                <Progress value={40} className="h-2 w-48 mx-auto" />
                            </div>

                            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
                                <CardHeader className="p-10 text-center space-y-6">
                                    <div className="aspect-video w-full bg-slate-900 rounded-[2rem] flex items-center justify-center relative shadow-inner overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" alt="Space" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <CardTitle className="text-white text-3xl font-black drop-shadow-2xl px-10">Which planet is known as the "Red Planet"?</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-10 pb-10">
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: "Venus", emoji: "🌕", color: "bg-orange-50 hover:bg-orange-100" },
                                            { label: "Mars", emoji: "🔴", color: "bg-red-50 hover:bg-red-100" },
                                            { label: "Jupiter", emoji: "🟠", color: "bg-amber-50 hover:bg-amber-100" },
                                            { label: "Saturn", emoji: "🪐", color: "bg-yellow-50 hover:bg-yellow-100" },
                                        ].map((opt, i) => (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-slate-100 transition-all hover:scale-105 active:scale-95 ${opt.color}`}
                                                onClick={() => {
                                                    toast({
                                                        title: opt.label === "Mars" ? "Correct! 🎉" : "Try Again!",
                                                        description: opt.label === "Mars" ? "You've earned 20 XP." : "Mars is the Red Planet.",
                                                        variant: opt.label === "Mars" ? "default" : "destructive"
                                                    })
                                                }}
                                            >
                                                <span className="text-3xl">{opt.emoji}</span>
                                                <span className="font-black text-slate-800 uppercase tracking-widest text-xs">{opt.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-10">
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-4xl font-black text-blue-600 border-4 border-white shadow-2xl">
                                        {user?.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                                        <Star className="w-6 h-6 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-4xl font-black">{user?.name}</h2>
                                        <Badge className="bg-blue-600 text-white border-none px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">Level 12</Badge>
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg">{user?.userType === 'deaf_student' ? 'Deaf Learner' : 'Learner'} • Visual First Advocate</p>
                                    <div className="flex gap-4 pt-4">
                                        <Button className="rounded-xl font-bold px-6 bg-slate-900">Edit Profile</Button>
                                        <Button variant="outline" className="rounded-xl font-bold px-6">Public View</Button>
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
