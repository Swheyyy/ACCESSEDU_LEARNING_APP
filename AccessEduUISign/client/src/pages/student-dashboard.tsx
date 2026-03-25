import { useState, useMemo, useEffect, useRef } from "react";
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
    Sparkles, BrainCircuit, ArrowRight, Plus,
    Accessibility, Sun, Moon, Monitor, Type, Eye, Gauge, Volume2,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-context";
import { formatSignSentence, evaluateConfidence } from "@/lib/nlp-formatter";
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

export default function StudentDashboard() {
    const { toast } = useToast();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { settings, setFontSize, toggleHighContrast, toggleReducedMotion } = useAccessibility();
    const [showSignOverlay, setShowSignOverlay] = useState(true);
    const [showCaptions, setShowCaptions] = useState(true);
    const [activeTab, setActiveTab] = useState("course");
    const [askingDoubt, setAskingDoubt] = useState(false);
    const [recordingDoubt, setRecordingDoubt] = useState(false);
    const [doubtText, setDoubtText] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [activeLessonIndex, setActiveLessonIndex] = useState(0);
    const [translatedText, setTranslatedText] = useState("");
    const [activeSentence, setActiveSentence] = useState<string[]>([]);
    const [finalizedSentence, setFinalizedSentence] = useState<string>("");
    const [isIdle, setIsIdle] = useState<boolean>(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const isAudioEnabledRef = useRef(false);
    const lastWordRef = useRef<string>("");
    const lastWordTimeRef = useRef<number>(Date.now());

    const speakCaption = (text: string) => {
        if (!("speechSynthesis" in window) || !text || text === "Listening for sign language...") return;
        window.speechSynthesis.cancel();
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.05;
            utterance.lang = "en-US";
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Speech API error:", e);
        }
    };
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<WebSocket | null>(null);



    // Fetch all available courses
    const { data: allCourses = [], isLoading: loadingAll } = useQuery<Course[]>({
        queryKey: ["/api/courses"]
    });

    // Fetch enrolled courses
    const { data: enrolledCourses = [], isLoading: loadingEnrolled } = useQuery<any[]>({
        queryKey: ["/api/enrollments"]
    });

    const enrolledIds = useMemo(() => new Set(enrolledCourses.map(e => e.courseId)), [enrolledCourses]);

    // Auto-select first course when data arrives
    useEffect(() => {
        if (!selectedCourseId && enrolledCourses.length > 0) {
            setSelectedCourseId(enrolledCourses[0].courseId);
        }
    }, [enrolledCourses, selectedCourseId]);

    // Fetch lessons for selected course
    const { data: lessons = [], isLoading: loadingLessons } = useQuery<any[]>({
        queryKey: [`/api/courses/${selectedCourseId}/lessons`],
        enabled: !!selectedCourseId,
    });

    const currentLesson = lessons[activeLessonIndex] || null;

    // WebSocket and Frame Capture Logic
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws-recognition`;
        console.log("Connecting to ML WebSocket:", wsUrl);
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "CAPTION_SENTENCE" && data.sentence) {
                    // Full sentence delivered — display it directly
                    setFinalizedSentence(data.sentence);
                    setActiveSentence([]);
                    setIsIdle(false);
                    lastWordRef.current = "";
                    lastWordTimeRef.current = Date.now();

                    // Auto-read aloud if speech synthesis is toggled ON
                    if (isAudioEnabledRef.current) {
                        speakCaption(data.sentence);
                    }

                } else if (data.type === "RECOGNITION_RESULT" && data.gestures?.[0]) {
                    const newWord = data.gestures[0].categoryName;
                    const confidence = data.gestures[0].score;

                    const validWord = evaluateConfidence(newWord, confidence);
                    if (validWord) {
                        setTranslatedText(validWord);
                        setIsIdle(false);
                        // Only update the word timer on real detections — NOT on None/noise
                        lastWordTimeRef.current = Date.now();
                        
                        if (validWord !== lastWordRef.current && validWord !== "None") {
                            setActiveSentence(prev => [...prev.slice(-10), validWord]);
                            lastWordRef.current = validWord;
                        }
                    }
                    // Note: We deliberately do NOT update lastWordTimeRef for None/low-confidence frames
                    //       so the pause detection timer fires correctly.
                } else if (data.type === "SYSTEM_STATUS") {
                    console.log("ML System Status:", data.message);
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };

        socket.onerror = (error) => console.error("WS WebSocket error:", error);
        socket.onclose = () => console.log("ML WebSocket disconnected");

        return () => socket.close();
    }, []);

    // Pause Detection Loop for AI Natural Language
    useEffect(() => {
        const intervalId = setInterval(() => {
            const timeSinceLast = Date.now() - lastWordTimeRef.current;
            
            // Sentence termination (pause of 2.5s)
            if (timeSinceLast > 2500 && activeSentence.length > 0) {
                const formatted = formatSignSentence(activeSentence);
                if (formatted) {
                    setFinalizedSentence(formatted);
                }
                setActiveSentence([]);
                lastWordRef.current = "";
            }
            
            // Complete idleness detected (4.5s)
            if (timeSinceLast > 4500) {
                setIsIdle(true);
            }
        }, 500);

        return () => clearInterval(intervalId);
    }, [activeSentence]);

    useEffect(() => {
        if (!showSignOverlay || !currentLesson || !videoRef.current) return;

        const intervalId = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.paused || video.ended || video.readyState < 2) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Draw at reduced resolution for performance
            canvas.width = 300;
            canvas.height = (300 / video.videoWidth) * video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            const base64Data = dataUrl.split(",")[1];

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: "FRAME",
                    image: base64Data,
                    timestamp: Date.now()
                }));
            }
        }, 2000); // 1 frame per 2s — gives enough time for each word to advance in the mock

        return () => clearInterval(intervalId);
    }, [showSignOverlay, currentLesson]);

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
            <aside className="w-20 lg:w-72 border-r bg-white flex flex-col items-center py-8 lg:items-start lg:px-8 gap-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600 rounded-[1.2rem] text-white shadow-lg shadow-blue-200">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black lg:block hidden tracking-tighter">Access<span className="text-blue-600">Edu</span></span>
                </div>

                <nav className="flex-1 w-full space-y-3">
                    {[
                        { id: "course", label: "My Learning", icon: BookOpen },
                        { id: "path", label: "Learning Path", icon: LayoutTemplate },
                        { id: "quizzes", label: "Quizzes", icon: CheckCircle },
                        { id: "messages", label: "Teacher Chat", icon: MessageSquare },
                        { id: "profile", label: "My Profile", icon: User },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3.5 p-3.5 rounded-2xl transition-all duration-300 ${activeTab === item.id 
                                ? "bg-blue-50 text-blue-600 border border-blue-100 font-bold" 
                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                            }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? "text-blue-600" : ""}`} />
                            <span className="lg:block hidden text-[15px]">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full mt-auto space-y-2">
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
                <header className="h-20 border-b bg-white/50 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="relative max-w-md w-full md:block hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search lessons..." className="pl-10 bg-slate-100/50 border-none rounded-full h-10 w-full" />
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
                                <span className="block text-xs text-slate-400 font-medium">{user?.userType === 'deaf_student' ? 'DHH Student' : 'Student'} • 450 XP</span>
                            </p>
                            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black">
                                {user?.name?.split(' ').map(n => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">

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
                                                <Button 
                                                    className={`w-full rounded-xl ${selectedCourseId === e.courseId ? "bg-blue-600 shadow-lg shadow-blue-100" : ""}`}
                                                    onClick={() => {
                                                        setSelectedCourseId(e.courseId);
                                                        setActiveLessonIndex(0);
                                                        setActiveTab("course");
                                                    }}
                                                >
                                                    {selectedCourseId === e.courseId ? "Now Learning" : "Resume Learning"}
                                                </Button>
                                            </CardFooter>

                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-6 pt-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">Active Lesson</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Course: {enrolledCourses.find(e => e.courseId === selectedCourseId)?.course?.title || "Select a course above"}</p>
                                </div>


                                <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <Card className="overflow-hidden border-2 border-blue-100/50 shadow-2xl group relative">
                                        <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
                                            {currentLesson?.signVideoUrl ? (
                                                <video 
                                                    ref={videoRef}
                                                    src={currentLesson.signVideoUrl} 
                                                    className="w-full h-full object-cover" 
                                                    controls 
                                                    autoPlay
                                                    muted
                                                    onVolumeChange={(e) => {
                                                        const vid = e.target as HTMLVideoElement;
                                                        vid.muted = true;
                                                    }}
                                                    onPlay={(e) => {
                                                        const vid = e.target as HTMLVideoElement;
                                                        if (vid.currentTime < 1 && socketRef.current?.readyState === WebSocket.OPEN) {
                                                            socketRef.current.send(JSON.stringify({ type: "RESET", id: `reset_${Date.now()}` }));
                                                        }
                                                    }}
                                                    onSeeked={(e) => {
                                                        const vid = e.target as HTMLVideoElement;
                                                        if (vid.currentTime < 1 && socketRef.current?.readyState === WebSocket.OPEN) {
                                                            socketRef.current.send(JSON.stringify({ type: "RESET", id: `reset_${Date.now()}` }));
                                                        }
                                                    }}
                                                />

                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-colors">
                                                    <PlayCircle className="w-20 h-20 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xl" />
                                                    <div className="absolute bottom-10 text-white font-bold opacity-40">No sign video available for this lesson</div>
                                                </div>
                                            )}
                                            
                                            {showCaptions && (
                                                <div className="absolute bottom-10 left-10 right-10 z-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                    <div className="bg-black/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center shadow-2xl">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">AI Realtime Translation</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newState = !isAudioEnabled;
                                                                    setIsAudioEnabled(newState);
                                                                    isAudioEnabledRef.current = newState;
                                                                    if (newState && finalizedSentence) {
                                                                        speakCaption(finalizedSentence);
                                                                    } else if (!newState) {
                                                                        window.speechSynthesis.cancel();
                                                                        setIsSpeaking(false);
                                                                    }
                                                                }}
                                                                title={isAudioEnabled ? "Auto-read enabled (click to disable)" : "Auto-read disabled (click to enable)"}
                                                                className={`w-auto px-3 h-7 rounded-full flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                                                                    isAudioEnabled 
                                                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                                                                    : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
                                                                }`}
                                                            >
                                                                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "animate-pulse" : ""}`} />
                                                                {isAudioEnabled ? "Voice ON" : "Voice OFF"}
                                                            </button>
                                                        </div>
                                                        <p className="text-white font-black text-2xl leading-relaxed tracking-tight italic min-h-[4rem] flex items-center justify-center">
                                                            {currentLesson ? (
                                                                isIdle ? (
                                                                    finalizedSentence || "Listening for sign language..."
                                                                ) : (
                                                                    activeSentence.length > 0 
                                                                        ? formatSignSentence(activeSentence)
                                                                        : (finalizedSentence || "Listening...")
                                                                )
                                                            ) : "Please select a course to start learning."}
                                                        </p>


                                                    </div>
                                                </div>
                                            )}

                                            {showSignOverlay && currentLesson && (
                                                <div className="absolute right-6 top-6 w-1/4 aspect-square bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 overflow-hidden shadow-2xl ring-4 ring-black/20 group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <canvas ref={canvasRef} className="hidden" />
                                                        <BrainCircuit className="w-12 h-12 text-white/40 animate-pulse" />
                                                    </div>
                                                    <div className="absolute bottom-4 left-0 right-0 text-center">
                                                        <Badge variant="outline" className="text-[8px] bg-blue-600/80 backdrop-blur-sm border-none text-white uppercase tracking-widest px-3 py-1 font-black">AI Interpreter Live</Badge>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                        <div className="p-8 bg-white flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50">
                                            <div className="flex gap-4">
                                                <Button 
                                                    variant={showCaptions ? "default" : "outline"} 
                                                    className={`gap-3 rounded-full px-8 h-14 font-black transition-all ${showCaptions ? "bg-blue-600 shadow-xl shadow-blue-100" : "hover:bg-blue-50"}`} 
                                                    onClick={() => setShowCaptions(!showCaptions)}
                                                >
                                                    <Languages className="w-5 h-5" /> {showCaptions ? "Captions On" : "Captions Off"}
                                                </Button>
                                                <Button 
                                                    variant={showSignOverlay ? "default" : "outline"} 
                                                    className={`gap-3 rounded-full px-8 h-14 font-black transition-all ${showSignOverlay ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "hover:bg-slate-50"}`} 
                                                    onClick={() => setShowSignOverlay(!showSignOverlay)}
                                                >
                                                    <Video className="w-5 h-5" /> {showSignOverlay ? "AI Display On" : "AI Display Off"}
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Button 
                                                    variant="secondary" 
                                                    className="gap-3 rounded-full h-14 px-8 bg-amber-50 text-amber-700 hover:bg-amber-100 border-none font-black shadow-lg shadow-amber-900/5" 
                                                    onClick={() => setAskingDoubt(true)}
                                                >
                                                    <HelpCircle className="w-5 h-5" /> Doubt Solver
                                                </Button>
                                                {lessons.length > 1 && (
                                                    <Button 
                                                        variant="ghost" 
                                                        className="rounded-full h-14 w-14 p-0 hover:bg-slate-100"
                                                        onClick={() => setActiveLessonIndex((prev) => (prev + 1) % lessons.length)}
                                                    >
                                                        <ArrowRight className="w-6 h-6" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* AI Interpretation Section */}
                                    {showCaptions && currentLesson?.transcript && (
                                        <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10 overflow-hidden relative group hover:shadow-2xl transition-all duration-500 mt-8 mb-4">
                                            <div className="absolute top-0 left-0 w-3 h-full bg-blue-600 group-hover:bg-purple-600 transition-colors"></div>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transform group-hover:rotate-6 transition-transform">
                                                        <Languages className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">AI Interpretation</h3>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">Lesson Context Transcript</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-50 text-green-600 border-none font-black px-5 py-2 rounded-full uppercase text-[10px] tracking-widest shadow-sm">Verified by AI Model</Badge>
                                            </div>
                                            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                                <p className="text-2xl leading-relaxed text-slate-700 font-bold italic tracking-tight">
                                                    <span className="text-4xl text-blue-300 font-serif leading-none mr-2">“</span>
                                                    {currentLesson.transcript}
                                                    <span className="text-4xl text-blue-300 font-serif leading-none ml-2">”</span>
                                                </p>
                                            </div>
                                        </Card>
                                    )}


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
                                    <Card className="h-full border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> Visual Notes</CardTitle>
                                            <CardDescription>Simplified content for quick review.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                                                    <span className="font-bold">Gravity Concept</span>
                                                </div>
                                                <div className="bg-slate-50 p-6 rounded-xl flex flex-col items-center gap-3 border border-slate-100">
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-4xl">🌎</span>
                                                        <span className="text-xl text-slate-300">⬅</span>
                                                        <span className="text-4xl shrink-0">🍏</span>
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

                    {activeTab === "messages" && (
                        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight">Teacher Chat</h2>
                                    <p className="text-slate-500 font-medium">Ask questions and get help from your instructors.</p>
                                </div>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 h-auto font-bold shadow-lg transform hover:scale-105 transition-all"
                                    onClick={() => setAskingDoubt(true)}
                                >
                                    <Plus className="w-5 h-5 mr-2" /> New Question
                                </Button>
                            </div>

                            {doubts.length === 0 ? (
                                <Card className="p-20 text-center border-dashed border-2 bg-slate-50/50 rounded-[3rem]">
                                    <MessageSquare className="w-20 h-20 mx-auto text-slate-200 mb-6" />
                                    <h3 className="text-2xl font-black text-slate-400">No messages yet</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Questions you ask your teacher will appear here along with their responses.</p>
                                    <Button variant="ghost" className="mt-6 text-blue-600 font-bold" onClick={() => setAskingDoubt(true)}>Start a conversation</Button>
                                </Card>
                            ) : (
                                <div className="grid gap-6">
                                    {doubts.map(doubt => (
                                        <Card key={doubt.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white group">
                                            <div className="p-8 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-inner">
                                                            {user?.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight">Your Question</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(doubt.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={doubt.response ? "bg-green-100 text-green-700 hover:bg-green-200 border-none px-4 py-1.5 rounded-full font-bold" : "bg-orange-100 text-orange-700 hover:bg-orange-200 border-none px-4 py-1.5 rounded-full font-bold"}>
                                                        {doubt.response ? "Answered" : "Awaiting Response"}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50 group-hover:bg-slate-100/50 transition-colors">
                                                    <p className="text-lg font-medium text-slate-800 leading-relaxed italic">"{doubt.content}"</p>
                                                </div>

                                                {doubt.response && (
                                                    <div className="pt-6 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                                                                <Star className="w-5 h-5" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="font-black text-[10px] uppercase tracking-widest text-purple-600">Instructor's Response</p>
                                                                <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-purple-900 font-medium leading-relaxed">
                                                                    {doubt.response}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
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
