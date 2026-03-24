import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Sparkles, Star, User, Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, User as UserType } from "@shared/schema";

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("courses");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: "", description: "", tags: "" });

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
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8fafc]/5 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 border-r bg-white flex flex-col items-center py-6 lg:items-start lg:px-6 gap-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg text-white font-black">AE</div>
                    <span className="text-xl font-black lg:block hidden">TeacherPort</span>
                </div>

                <nav className="flex-1 w-full space-y-2">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { id: "courses", label: "Manage Courses", icon: BookOpen },
                        { id: "analytics", label: "Students", icon: Users2 },
                        { id: "doubts", label: "Doubts", icon: MessageSquare },
                        { id: "profile", label: "Profile", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? "bg-purple-50 text-purple-600 border border-purple-100 font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="lg:block hidden">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <button onClick={logout} className="flex lg:justify-start justify-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="lg:block hidden">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto">
                <header className="h-20 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black tracking-tight uppercase">Instructor Workspace</h1>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold">● Active Session</Badge>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 pr-6 border-r">
                            <p className="text-right">
                                <span className="block text-sm font-bold">{user?.name}</span>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Senior Educator</span>
                            </p>
                            <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white shadow-sm flex items-center justify-center text-purple-600 font-black">
                                {user?.name?.split(' ').map(n => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto">

                    {activeTab === "courses" && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black">Your Courses</h2>
                                    <p className="text-slate-500 font-medium">Manage your educational content and AI materials.</p>
                                </div>
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-slate-900 hover:bg-black text-white px-8 py-6 rounded-2xl gap-2 font-bold transform hover:scale-105 transition-all shadow-xl">
                                            <PlusCircle className="w-5 h-5" /> Create New Course
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[525px] rounded-[2rem] border-none shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-3xl font-black tracking-tight">Create Course</DialogTitle>
                                            <DialogDescription className="font-medium text-slate-500">
                                                Set up a new learning journey for your students.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateCourse} className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title" className="font-bold text-slate-700">Course Title</Label>
                                                <Input 
                                                    id="title" 
                                                    placeholder="e.g. Basics of Astrophysics" 
                                                    className="rounded-xl border-slate-200 focus:ring-purple-500"
                                                    value={newCourse.title}
                                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="font-bold text-slate-700">Description</Label>
                                                <Textarea 
                                                    id="description" 
                                                    placeholder="Describe what students will learn..." 
                                                    className="rounded-xl border-slate-200 focus:ring-purple-500 min-h-[100px]"
                                                    value={newCourse.description}
                                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tags" className="font-bold text-slate-700">Tags (comma separated)</Label>
                                                <Input 
                                                    id="tags" 
                                                    placeholder="science, space, physics" 
                                                    className="rounded-xl border-slate-200 focus:ring-purple-500"
                                                    value={newCourse.tags}
                                                    onChange={(e) => setNewCourse({ ...newCourse, tags: e.target.value })}
                                                />
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <Button 
                                                    type="submit" 
                                                    className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold"
                                                    disabled={createCourseMutation.isPending}
                                                >
                                                    {createCourseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Publish Course
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses?.map((course) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                                {courses?.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <p className="text-xl font-black text-slate-400">No courses yet. Create your first course!</p>
                                        <Button variant="ghost" className="mt-4 font-bold text-purple-600" onClick={() => setIsCreateDialogOpen(true)}>Start by creating one</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "analytics" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-black tracking-tight">Active Students</h2>
                            <div className="grid lg:grid-cols-1 gap-6">
                                <Card className="p-8 border-none shadow-xl rounded-[2.5rem] bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Student Name</th>
                                                    <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Course</th>
                                                    <th className="text-left pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Enrolled At</th>
                                                    <th className="text-right pb-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Action</th>
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
                        </div>
                    )}

                    {activeTab === "doubts" && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black">Student Doubts</h2>
                                    <p className="text-slate-500 font-medium">Respond to questions from your students.</p>
                                </div>
                                <Badge className="bg-purple-100 text-purple-600 border-none px-4 py-2 font-black rounded-full uppercase text-xs">
                                    {doubts.filter(d => !d.response).length} Pending
                                </Badge>
                            </div>

                            <div className="grid gap-6">
                                {doubts.map((doubt) => (
                                    <DoubtCard key={doubt.id} doubt={doubt} onRespond={(resp) => respondMutation.mutate({ doubtId: doubt.id, response: resp })} isPending={respondMutation.isPending} />
                                ))}
                                {doubts.length === 0 && (
                                    <Card className="p-20 text-center bg-slate-50 border-none rounded-[3rem]">
                                        <MessageSquare className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                                        <p className="text-xl font-black text-slate-400">No doubts found. All caught up!</p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-10">
                                <div className="w-40 h-40 rounded-[3rem] bg-purple-900 flex items-center justify-center text-4xl font-black text-white border-8 border-white shadow-2xl relative">
                                    {user?.name?.[0]}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black">{user?.name}</h2>
                                    <p className="text-slate-500 font-bold text-lg">Senior Educator • {user?.email}</p>
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

function CourseCard({ course }: { course: Course }) {
    const [isStudentsOpen, setIsStudentsOpen] = useState(false);
    const { data: students } = useQuery<any[]>({
        queryKey: [`/api/courses/${course.id}/students`],
        enabled: isStudentsOpen,
    });

    return (
        <Card className="border-none shadow-xl rounded-[2rem] bg-white hover:shadow-2xl transition-all duration-300 flex flex-col group overflow-hidden">
            <div className="h-32 bg-slate-100 flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                <Video className="w-10 h-10 text-slate-300 group-hover:text-purple-400" />
            </div>
            <CardHeader className="p-6">
                <div className="flex gap-2 flex-wrap mb-4">
                    {course.tags?.map((tag: string) => (
                        <Badge key={tag} className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-3 font-bold text-[10px]">{tag}</Badge>
                    ))}
                </div>
                <CardTitle className="text-xl font-black leading-tight group-hover:text-purple-600 transition-colors">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 font-medium pt-2 text-slate-500">{course.description}</CardDescription>
            </CardHeader>
            <CardFooter className="p-6 mt-auto pt-0">
                <Dialog open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full rounded-xl border-slate-200 font-bold hover:bg-slate-50">View Enrollments</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] sm:max-w-md border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Enrolled Students</DialogTitle>
                            <DialogDescription className="font-medium">{course.title}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mt-4">
                            {students?.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600">{s.name[0]}</div>
                                        <div>
                                            <p className="font-bold text-sm">{s.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Joined {new Date(s.enrolledAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-green-600 font-black">Active</Badge>
                                </div>
                            ))}
                            {students?.length === 0 && <p className="text-center py-6 text-slate-400 font-medium">No students enrolled yet.</p>}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    );
}

function EnrolledStudentsTable({ courseId, courseTitle }: { courseId: number, courseTitle: string }) {
    const { data: students } = useQuery<any[]>({
        queryKey: [`/api/courses/${courseId}/students`],
    });

    if (!students || students.length === 0) return null;

    return (
        <>
            {students.map(s => (
                <tr key={`${courseId}-${s.id}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-black text-blue-600 text-xs">
                                {s.name[0]}
                            </div>
                            <span className="font-bold text-sm tracking-tight">{s.name}</span>
                        </div>
                    </td>
                    <td className="py-4 align-middle">
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">{courseTitle}</span>
                    </td>
                    <td className="py-4 text-xs font-medium text-slate-400">
                        {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-lg font-bold text-slate-400 hover:text-slate-900">Details</Button>
                    </td>
                </tr>
            ))}
        </>
    );
}

function DoubtCard({ doubt, onRespond, isPending }: { doubt: any, onRespond: (resp: string) => void, isPending: boolean }) {
    const [response, setResponse] = useState("");

    return (
        <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-blue-600 text-sm">{doubt.student?.name?.[0]}</div>
                        <div>
                            <p className="font-bold text-slate-900">{doubt.student?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(doubt.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <Badge className={doubt.response ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {doubt.response ? "Answered" : "Pending"}
                    </Badge>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-lg font-medium text-slate-800 italic">"{doubt.content}"</p>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
                {doubt.response ? (
                    <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Your Response</Label>
                        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-purple-900 font-medium">
                            {doubt.response}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Respond to Doubt</Label>
                        <Textarea 
                            placeholder="Type your explanation here..." 
                            className="rounded-2xl border-slate-200 min-h-[100px]"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                        />
                        <Button 
                            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold"
                            onClick={() => onRespond(response)}
                            disabled={!response.trim() || isPending}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send Response"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
