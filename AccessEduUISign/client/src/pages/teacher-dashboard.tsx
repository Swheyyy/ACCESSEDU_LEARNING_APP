import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Plus, Search, BookOpen, Users, CheckCircle,
    Clock, Video, FileText, Bot, BarChart3,
    Mic, MessageSquare, PlusCircle, LayoutDashboard,
    LogOut, Settings, Users2, BrainCircuit, Activity,
    Sparkles, Star, User, Loader2, Bell, TrendingUp,
    Accessibility, Sun, Moon, Monitor, Type, Eye, Gauge,
    FileVideo, Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SignAvatar } from "@/components/sign-avatar";
import { useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Course, User as UserType } from "@shared/schema";

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const { settings, setFontSize, toggleHighContrast, toggleReducedMotion } = useAccessibility();
    const [activeTab, setActiveTab] = useState("courses");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newCourse, setNewCourse] = useState({ title: "", description: "", tags: "" });
    const [newLesson, setNewLesson] = useState({ title: "", videoUrl: "", signVideoUrl: "", order: 1 });

    // Fetch Teacher's Courses
    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
        queryKey: [`/api/courses/teacher/${user?.id}`],
        enabled: !!user,
    });

    // Create Course Mutation
    const createCourseMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem("accessedu_token");
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    tags: data.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
                }),
            });
            if (!res.ok) throw new Error("Failed to create course");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/courses/teacher/${user?.id}`] });
            toast({ title: "Success", description: "Course created successfully!" });
            setIsCreateDialogOpen(false);
            setNewCourse({ title: "", description: "", tags: "" });
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const createLessonMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem("accessedu_token");
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("courseId", selectedCourseId?.toString() || "");
            formData.append("description", "Educational sign language content.");
            formData.append("order", (data.order || 1).toString());
            
            if (selectedFile) {
                formData.append("video", selectedFile);
            } else {
                throw new Error("Please select a video file to upload");
            }

            const res = await fetch("/api/lessons/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to upload lesson");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/courses/teacher/${user?.id}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/lessons`] });
            toast({ title: "Lesson Published", description: "Sign Language content is now available to students." });
            setIsLessonDialogOpen(false);
            setNewLesson({ title: "", videoUrl: "", signVideoUrl: "", order: 1 });
            setSelectedFile(null);
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        createCourseMutation.mutate(newCourse);
    };

    // Doubt Queries
    const { data: doubts = [], isLoading: doubtsLoading } = useQuery<any[]>({
        queryKey: ["/api/doubts/teacher"],
    });

    const respondMutation = useMutation({
        mutationFn: async ({ doubtId, response }: { doubtId: number, response: string }) => {
            const res = await fetch(`/api/doubts/${doubtId}/respond`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessedu_token")}`
                },
                body: JSON.stringify({ response })
            });
            if (!res.ok) throw new Error("Failed to send response");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/doubts/teacher"] });
            toast({ title: "Response Sent", description: "The student has been notified." });
        }
    });

    if (coursesLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8fafc]/5 overflow-hidden">
            {/* Unified Sidebar - Teacher Branded */}
            <aside className="w-20 lg:w-72 border-r bg-white flex flex-col items-center py-8 lg:items-start lg:px-8 gap-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-600 rounded-[1.2rem] text-white shadow-lg shadow-purple-200">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black lg:block hidden tracking-tighter">Access<span className="text-purple-600">Edu</span></span>
                </div>

                <nav className="flex-1 w-full space-y-3">
                    {[
                        { id: "courses", label: "My Curriculum", icon: BookOpen },
                        { id: "analytics", label: "Assigned Students", icon: Users2 },
                        { id: "doubts", label: "Sign Doubts", icon: MessageSquare },
                        { id: "profile", label: "Instructor Profile", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3.5 p-3.5 rounded-2xl transition-all duration-300 ${activeTab === item.id 
                                ? "bg-purple-50 text-purple-600 border border-purple-100 font-bold" 
                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                            }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? "text-purple-600" : ""}`} />
                            <span className="lg:block hidden text-[15px]">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="space-y-2 mt-auto">
                    <button className="w-full flex lg:justify-start justify-center items-center gap-3.5 p-3.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all duration-300">
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="lg:block hidden text-[15px]">Settings</span>
                    </button>
                    <button onClick={logout} className="w-full flex lg:justify-start justify-center items-center gap-3.5 p-3.5 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300">
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="lg:block hidden text-[15px]">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto">
                {/* Unified Header */}
                <header className="h-20 border-b bg-white/50 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <h2 className="text-xl font-black tracking-tight md:block hidden text-slate-900">INSTRUCTOR WORKSPACE</h2>
                       <Badge variant="secondary" className="px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 gap-2 font-black text-[10px] uppercase tracking-widest">
                           <Activity className="w-3 h-3" /> Live
                       </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-600" />
                                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-600" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-2xl">
                                    <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 font-bold cursor-pointer transition-colors">
                                        <Sun className="h-4 w-4" /> Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 font-bold cursor-pointer transition-colors">
                                        <Moon className="h-4 w-4" /> Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 font-bold cursor-pointer transition-colors">
                                        <Monitor className="h-4 w-4" /> System
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                                        <Accessibility className="h-5 w-5 text-slate-600" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 rounded-[2rem] p-4 shadow-2xl border-none">
                                    <DropdownMenuLabel className="flex items-center gap-3 text-lg font-black tracking-tight mb-2">
                                        <Accessibility className="h-5 w-5 text-blue-600" /> Accessibility Hub
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="mb-4" />
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                                <Type className="h-3 w-3" /> Font Size
                                            </Label>
                                            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                                {(["100", "125", "150"] as const).map((size) => (
                                                    <Button
                                                        key={size}
                                                        variant={settings.fontSize === size ? "default" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setFontSize(size)}
                                                        className={`flex-1 rounded-lg font-black text-[10px] ${settings.fontSize === size ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                                                    >
                                                        {size}%
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <Label htmlFor="high-contrast" className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
                                                <Eye className="h-4 w-4 text-blue-500" /> High Contrast
                                            </Label>
                                            <Switch
                                                id="high-contrast"
                                                checked={settings.highContrast}
                                                onCheckedChange={toggleHighContrast}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <Label htmlFor="reduced-motion" className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
                                                <Gauge className="h-4 w-4 text-orange-500" /> Reduce Motion
                                            </Label>
                                            <Switch
                                                id="reduced-motion"
                                                checked={settings.reducedMotion}
                                                onCheckedChange={toggleReducedMotion}
                                            />
                                        </div>

                                        <p className="text-[10px] text-slate-400 font-bold italic text-center pt-2">
                                            Settings auto-save to platform profile
                                        </p>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        </Button>
                        <div className="flex items-center gap-3 pl-4 border-l">
                            <p className="text-right sm:block hidden">
                                <span className="block text-sm font-bold">{user?.name}</span>
                                <span className="block text-xs text-slate-400 font-medium tracking-wide uppercase">Senior Educator</span>
                            </p>
                            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black">
                                {user?.name?.split(' ').map(n => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">

                    {activeTab === "courses" && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight">Manage Courses</h2>
                                    <p className="text-slate-500 font-medium">Create and refine your educational materials.</p>
                                </div>
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-6 h-auto rounded-full gap-3 font-black transform hover:scale-105 transition-all shadow-xl shadow-purple-100">
                                            <PlusCircle className="w-5 h-5" /> New Course
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[525px] rounded-[2.5rem] border-none shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-3xl font-black tracking-tight">Create Course</DialogTitle>
                                            <DialogDescription className="font-medium text-slate-500">
                                                Set up a new learning journey for your students.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateCourse} className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title" className="font-bold text-slate-700 ml-1">Course Title</Label>
                                                <Input 
                                                    id="title" 
                                                    placeholder="e.g. Basics of Astrophysics" 
                                                    className="rounded-xl border-slate-200 focus:ring-blue-500 h-12"
                                                    value={newCourse.title}
                                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="font-bold text-slate-700 ml-1">Description</Label>
                                                <Textarea 
                                                    id="description" 
                                                    placeholder="Describe what students will learn..." 
                                                    className="rounded-xl border-slate-200 focus:ring-blue-500 min-h-[120px]"
                                                    value={newCourse.description}
                                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tags" className="font-bold text-slate-700 ml-1">Tags (comma separated)</Label>
                                                <Input 
                                                    id="tags" 
                                                    placeholder="science, space, physics" 
                                                    className="rounded-xl border-slate-200 focus:ring-blue-500 h-12"
                                                    value={newCourse.tags}
                                                    onChange={(e) => setNewCourse({ ...newCourse, tags: e.target.value })}
                                                />
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <Button 
                                                    type="submit" 
                                                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200"
                                                    disabled={createCourseMutation.isPending}
                                                >
                                                    {createCourseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Launch Course
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {courses?.map((course) => (
                                        <CourseCard 
                                            key={course.id} 
                                            course={course} 
                                            onUpload={() => {
                                                setSelectedCourseId(course.id);
                                                setIsLessonDialogOpen(true);
                                            }}
                                        />
                                    ))}
                                    {courses?.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                            <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                            <p className="text-xl font-black text-slate-400">No active courses. Launch your first course!</p>
                                            <Button variant="ghost" className="mt-4 font-bold text-blue-600" onClick={() => setIsCreateDialogOpen(true)}>Start by creating one</Button>
                                        </div>
                                    )}
                                </div>

                                {/* New Lesson Dialog */}
                                <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10 border-none shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-3xl font-black tracking-tight italic uppercase">Upload Sign Lesson</DialogTitle>
                                            <DialogDescription className="font-bold text-slate-400">Add a sign language video to your course curriculum.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => { e.preventDefault(); createLessonMutation.mutate(newLesson); }} className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <Label className="font-black uppercase text-[10px] tracking-widest text-slate-400 ml-1">Lesson Title</Label>
                                                <Input 
                                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-300"
                                                    placeholder="e.g. Hand Shapes & Motion"
                                                    value={newLesson.title}
                                                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-black uppercase text-[10px] tracking-widest text-slate-400 ml-1">Upload Video (MP4, WebM)</Label>
                                                <div className="relative">
                                                    <Input 
                                                        type="file"
                                                        accept="video/mp4,video/webm"
                                                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold pt-4 pl-12 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                        required
                                                    />
                                                    <Video className="absolute left-4 top-4.5 w-5 h-5 text-slate-300" />
                                                </div>
                                                {selectedFile && (
                                                    <p className="text-[10px] font-bold text-blue-600 ml-1 transition-all animate-in fade-in">
                                                        Selected: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                )}
                                            </div>
                                            <Button 
                                                type="submit" 
                                                className="w-full bg-purple-600 rounded-full h-16 font-black shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all"
                                                disabled={createLessonMutation.isPending}
                                            >
                                                {createLessonMutation.isPending ? (
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="animate-spin w-5 h-5" />
                                                        <span>Uploading Video...</span>
                                                    </div>
                                                ) : "Publish to Assigned Students"}
                                            </Button>
                                        </form>

                                    </DialogContent>
                                </Dialog>
                            </div>
                    )}

                    {activeTab === "analytics" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-black tracking-tight">Active Students</h2>
                                <Badge className="bg-purple-50 text-purple-600 border-none px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">Total Enrolled: {courses?.reduce((acc, c) => acc + (c as any).studentsCount || 0, 0) || 0}</Badge>
                            </div>
                            <Card className="p-10 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400 px-4">Student Name</th>
                                                <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Applied Course</th>
                                                <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Join Date</th>
                                                <th className="text-right pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400 px-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {courses?.map(course => (
                                                <EnrolledStudentsTable key={course.id} courseId={course.id} courseTitle={course.title} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "doubts" && (
                        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight">Student Doubts</h2>
                                    <p className="text-slate-500 font-medium">Respond to visual-assistance queries and text doubts.</p>
                                </div>
                                <Badge className="bg-orange-100 text-orange-700 border-none px-6 py-2 font-black rounded-full uppercase text-xs shadow-sm">
                                    {doubts.filter(d => !d.response).length} Pending Queries
                                </Badge>
                            </div>

                            <div className="grid gap-8">
                                {doubts.map((doubt) => (
                                    <DoubtCard key={doubt.id} doubt={doubt} onRespond={(resp) => respondMutation.mutate({ doubtId: doubt.id, response: resp })} isPending={respondMutation.isPending} />
                                ))}
                                {doubts.length === 0 && (
                                    <Card className="p-20 text-center bg-slate-50/50 border-none rounded-[3.5rem]">
                                        <MessageSquare className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                                        <p className="text-2xl font-black text-slate-300">Clean Slate! No pending doubts.</p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-500 pt-10">
                            <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-[3.5rem] bg-slate-900 flex items-center justify-center text-5xl font-black text-white border-8 border-white shadow-2xl overflow-hidden">
                                        {user?.name?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-blue-600 rounded-3xl border-4 border-white flex items-center justify-center shadow-xl">
                                        <Star className="w-7 h-7 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-5xl font-black tracking-tight text-slate-900">{user?.name}</h2>
                                        <p className="text-blue-600 font-black uppercase tracking-widest text-sm">Senior Faculty • Educational Lead</p>
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg max-w-lg">{user?.email} • Specializing in Multi-modal Inclusive Education.</p>
                                    <div className="flex gap-4 justify-center md:justify-start pt-4">
                                        <Button className="rounded-full font-black px-10 py-6 h-auto bg-slate-900 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">Edit Public Profile</Button>
                                        <Button variant="outline" className="rounded-full font-black px-10 py-6 h-auto border-2 hover:bg-slate-50">Settings</Button>
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

function CourseCard({ course, onUpload }: { course: Course, onUpload: () => void }) {
    const { toast } = useToast();
    const [isStudentsOpen, setIsStudentsOpen] = useState(false);

    const [isLessonsOpen, setIsLessonsOpen] = useState(false);
    
    const { data: students } = useQuery<any[]>({
        queryKey: [`/api/courses/${course.id}/students`],
        enabled: isStudentsOpen,
    });

    const { data: lessons } = useQuery<any[]>({
        queryKey: [`/api/courses/${course.id}/lessons`],
        enabled: isLessonsOpen,
    });

    const deleteLessonMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/lessons/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessedu_token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete lesson");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/lessons`] });
            toast({ title: "Lesson Deleted", description: "The curriculum has been updated." });
        }
    });

    return (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-white to-purple-50/20 hover:shadow-2xl transition-all duration-500 flex flex-col group overflow-hidden border-b-4 border-b-transparent hover:border-b-purple-600">
            <div className="h-40 bg-slate-100 flex items-center justify-center group-hover:bg-purple-50/50 transition-colors relative text-slate-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                <Video className="w-12 h-12 group-hover:text-purple-500/50 transition-all transform group-hover:scale-110" />
                <Badge className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-slate-900 border-none font-black shadow-sm">COURSE</Badge>
            </div>
            <CardHeader className="p-6">
                <div className="flex gap-2 flex-wrap mb-4">
                    {course.tags?.map((tag: string) => (
                        <Badge key={tag} className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-none px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider">{tag}</Badge>
                    ))}
                </div>
                <CardTitle className="text-xl font-black leading-tight group-hover:text-purple-600 transition-colors tracking-tight">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 font-medium pt-2 text-slate-500 leading-relaxed italic text-sm">"{course.description}"</CardDescription>
            </CardHeader>
            <CardFooter className="p-6 mt-auto pt-0 flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                    <Dialog open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 rounded-xl bg-white border-2 border-slate-100 text-slate-600 font-black hover:bg-slate-50 transition-all h-12 shadow-sm">Students</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[3rem] sm:max-w-md border-none shadow-2xl p-8">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">Enrolled Students</DialogTitle>
                                <DialogDescription className="font-black text-purple-600 uppercase tracking-widest text-[10px] pt-1 leading-relaxed">{course.title}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mt-8 custom-scrollbar">
                                {students?.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1.2rem] bg-purple-600 flex items-center justify-center font-black text-white shadow-lg text-lg transform hover:rotate-6 transition-transform">{s.name[0]}</div>
                                            <div>
                                                <p className="font-black text-slate-900 tracking-tight">{s.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Joined {new Date(s.enrolledAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-none px-4 py-1.5 rounded-full font-black text-[10px]">ACTIVE</Badge>
                                    </div>
                                ))}
                                {(!students || students.length === 0) && <p className="text-center py-10 font-bold text-slate-400">No students enrolled yet.</p>}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isLessonsOpen} onOpenChange={setIsLessonsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 rounded-xl bg-white border-2 border-slate-100 text-slate-600 font-black hover:bg-slate-50 transition-all h-12 shadow-sm">Curriculum</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[3rem] sm:max-w-2xl border-none shadow-2xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black tracking-tight">Course Curriculum</DialogTitle>
                                <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-xs pt-1">{course.title}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 mt-6 custom-scrollbar">
                                {lessons?.map((lesson, idx) => (
                                    <div key={lesson.id} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">{idx + 1}</div>
                                                <h4 className="text-xl font-black tracking-tight">{lesson.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {lesson.processingStatus === 'completed' ? (
                                                    <Badge className="bg-green-50 text-green-600 border-none font-black px-4 py-1 rounded-full uppercase text-[10px]">AI Processed</Badge>
                                                ) : lesson.processingStatus === 'failed' ? (
                                                    <Badge className="bg-red-50 text-red-600 border-none font-black px-4 py-1 rounded-full uppercase text-[10px]">Processing Failed</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-50 text-blue-600 border-none font-black px-4 py-1 rounded-full uppercase text-[10px] animate-pulse">Processing AI...</Badge>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                                    disabled={deleteLessonMutation.isPending}
                                                >
                                                    {deleteLessonMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        {lesson.signVideoUrl && (
                                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
                                                <video 
                                                    src={lesson.signVideoUrl} 
                                                    className="w-full h-full object-cover" 
                                                    controls 
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!lessons || lessons.length === 0) && (
                                    <div className="py-20 text-center space-y-4">
                                        <FileVideo className="w-16 h-16 mx-auto text-slate-200" />
                                        <p className="text-xl font-black text-slate-300">No lessons uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <Button 
                    className="w-full rounded-xl bg-purple-600 text-white font-black hover:bg-purple-700 transition-all h-14 shadow-lg shadow-purple-100 gap-3"
                    onClick={onUpload}
                >
                    <PlusCircle className="w-5 h-5" /> Add New Sign Lesson
                </Button>
            </CardFooter>
        </Card>
    );
}

// Dialog for adding lessons (placed inside the main component body in the previous turn)

function EnrolledStudentsTable({ courseId, courseTitle }: { courseId: number, courseTitle: string }) {
    const { data: students } = useQuery<any[]>({
        queryKey: [`/api/courses/${courseId}/students`],
    });

    if (!students || students.length === 0) return null;

    return (
        <>
            {students.map(s => (
                <tr key={`${courseId}-${s.id}`} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-[1rem] bg-purple-50 flex items-center justify-center font-black text-purple-600 text-sm shadow-inner group-hover:bg-purple-600 group-hover:text-white transition-all">
                                {s.name[0]}
                            </div>
                            <span className="font-black text-slate-900 tracking-tight">{s.name}</span>
                        </div>
                    </td>
                    <td className="py-6 align-middle">
                        <span className="text-[10px] font-black tracking-widest uppercase text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full border border-purple-100">{courseTitle}</span>
                    </td>
                    <td className="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                        {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-6 text-right px-4">
                        <Badge className="bg-green-50 text-green-700 border-none font-black text-[10px] px-4 py-1 rounded-full">ENROLLED</Badge>
                    </td>
                </tr>
            ))}
        </>
    );
}

function DoubtCard({ doubt, onRespond, isPending }: { doubt: any, onRespond: (resp: string) => void, isPending: boolean }) {
    const [response, setResponse] = useState("");
    const [isSigning, setIsSigning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<number | null>(null);
    const { toast } = useToast();

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleSignLanguage = async () => {
        if (isSigning) {
            setIsSigning(false);
            if (wsRef.current) wsRef.current.close();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsSigning(true);
            
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws-recognition`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 224;
                canvas.height = 224;
                const ctx = canvas.getContext("2d");

                intervalRef.current = window.setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN && videoRef.current && ctx) {
                        ctx.drawImage(videoRef.current, 0, 0, 224, 224);
                        const data = canvas.toDataURL("image/jpeg", 0.7);
                        ws.send(JSON.stringify({
                            type: "FRAME",
                            image: data.split(",")[1] || data
                        }));
                    }
                }, 500);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "RECOGNITION_RESULT" && data.gestures?.[0]) {
                        const word = data.gestures[0].categoryName;
                        const score = data.gestures[0].score;
                        if (word !== "None" && score > 0.45) { // tuned for response flow
                            setResponse(prev => {
                                const lastWord = prev.trim().split(" ").pop();
                                if (lastWord === word) return prev; // avoid immediate dupes
                                return prev ? `${prev} ${word}` : word;
                            });
                        }
                    }
                } catch (e) {
                   console.error("Teacher ML Parse Error", e);
                }
            };

            ws.onerror = (e) => {
                console.error("ML WebSocket Error", e);
                toast({ title: "WebSocket Error", description: "Successfully caught AI stream disconnection. Trying again.", variant: "destructive" });
                setIsSigning(false);
            };
        } catch (e) {
            console.error(e);
            toast({ title: "Camera Error", description: "Could not access teacher camera", variant: "destructive" });
        }
    };

    return (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group hover:shadow-purple-900/5 transition-all duration-500">
            <CardHeader className="p-10 border-b border-slate-50 bg-gradient-to-b from-purple-50/50 to-transparent">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-purple-100 flex items-center justify-center font-black text-purple-600 shadow-inner group-hover:rotate-3 transition-transform">{doubt.student?.name?.[0]}</div>
                        <div>
                            <p className="font-black text-xl text-slate-900 tracking-tight">{doubt.student?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">{new Date(doubt.createdAt).toLocaleString()} • Student Query</p>
                        </div>
                    </div>
                    <Badge className={doubt.response ? "bg-green-100 text-green-700 font-black px-6 py-2 rounded-full border-none" : "bg-orange-100 text-orange-700 font-black px-6 py-2 rounded-full border-none"}>
                        {doubt.response ? "ANSWERED" : "PENDING"}
                    </Badge>
                </div>
                <div className="p-8 bg-white rounded-[2rem] border-2 border-slate-100/50 shadow-sm relative overflow-hidden group-hover:border-purple-100 transition-colors">
                    <div className="absolute top-4 left-4"><Bot className="w-5 h-5 text-purple-200" /></div>
                    <p className="text-xl font-bold text-slate-800 italic leading-relaxed pl-6 tracking-tight">"{doubt.content}"</p>
                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 block">Student's query dynamically signed</Label>
                        <div className="aspect-video bg-muted rounded-xl overflow-hidden relative border border-slate-200">
                            <SignAvatar text={doubt.content} trigger={true} />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
                {doubt.response ? (
                    <div className="space-y-3 animate-in fade-in duration-500">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Your response history</Label>
                        <div className="p-8 bg-purple-50/50 rounded-[2.5rem] border border-purple-100 text-purple-900 font-medium leading-relaxed shadow-inner">
                            {doubt.response}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2 relative">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Craft your explanation / Use Sign Language</Label>
                            
                            <div className="relative">
                                {isSigning ? (
                                    <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden relative mb-4">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                                            <div className="w-2 h-2 bg-white rounded-full"></div> Recording Sign
                                        </div>
                                    </div>
                                ) : null}

                                <Textarea 
                                    placeholder="Type your detailed explanation or enable camera to sign..." 
                                    className="rounded-[2.5rem] border-2 border-slate-100 p-8 min-h-[160px] focus:ring-purple-500 focus:border-purple-500 text-lg font-medium leading-relaxed transition-all pb-16"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleSignLanguage}
                                    className={`absolute bottom-4 right-4 rounded-full h-10 w-10 transition-colors ${isSigning ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200'}`}
                                >
                                    <Video className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <Button 
                            className="w-full h-16 rounded-full bg-purple-600 hover:bg-purple-700 font-black text-lg shadow-xl shadow-purple-200 transition-all active:scale-95"
                            onClick={() => onRespond(response)}
                            disabled={!response.trim() || isPending}
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <><Plus className="w-5 h-5 mr-3" /> Send Response</>}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
