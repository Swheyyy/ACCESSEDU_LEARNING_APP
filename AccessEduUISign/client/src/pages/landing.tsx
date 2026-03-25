import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hand,
  Video,
  Image,
  Camera,
  Volume2,
  Shield,
  Accessibility,
  Clock,
  Brain,
  Upload,
  Mic,
  Play,
  ChevronRight,
  Star,
  Users,
  Zap,
  Globe,
  Heart,
  GraduationCap,
  Eye,
  UserCircle,
  LayoutTemplate,
  MessageSquare,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Inclusive Learning",
    description: "Personalized learning paths designed specifically for DHH students and instructors.",
  },
  {
    icon: LayoutTemplate,
    title: "Course Management",
    description: "Manage your lessons, track enrollments, and review student progress in one place.",
  },
  {
    icon: MessageSquare,
    title: "Teacher-Student Chat",
    description: "Direct communication line with AI-assisted doubt solving for better understanding.",
  },
  {
    icon: Volume2,
    title: "Integrated TTS",
    description: "Hear content spoken aloud with natural voice synthesis for better multimodal learning.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays secure with consent-based storage and state-of-the-art encryption.",
  },
  {
    icon: Accessibility,
    title: "Accessibility Built-in",
    description: "WCAG 2.1 compliant with font scaling, high contrast, and screen reader support.",
  },
];

const stats = [
  { value: "50K+", label: "Translations Processed" },
  { value: "95%", label: "Recognition Accuracy" },
  { value: "10+", label: "Sign Languages Supported" },
];

export default function LandingPage() {
  return (
    <main className="flex-1" role="main">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center py-16 md:py-24" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="px-4 py-1.5 text-sm" data-testid="badge-hero">
                  <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
                  AI-Powered Translation
                </Badge>
                <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Break Communication{" "}
                  <span className="text-primary">Barriers</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Real-time bidirectional sign language translation. Webcam, video, or image—AccessEdu makes communication accessible for everyone.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 h-auto rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] transition-all font-bold" data-testid="button-hero-get-started">
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 h-auto rounded-full border-2 hover:bg-slate-50 transition-all font-bold" data-testid="button-hero-sign-in">
                    Sign In
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="gap-2 w-full sm:w-auto px-8 py-6 h-auto rounded-full hover:bg-slate-50 transition-all font-bold" data-testid="button-hero-demo">
                  <Video className="w-4 h-4" aria-hidden="true" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"].map((bg, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${bg} border-2 border-background flex items-center justify-center text-white text-xs font-medium`}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">10,000+</span> learners already using AccessEdu
                </p>
              </div>
            </div>

            <div className="relative" aria-hidden="true">
              <div className="aspect-square max-w-lg mx-auto lg:max-w-none bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 rounded-3xl p-8 lg:p-12">
                <div className="w-full h-full bg-card rounded-2xl shadow-lg flex items-center justify-center border">
                  <div className="text-center space-y-6 p-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                      <Star className="w-12 h-12 text-primary fill-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold">Hello!</p>
                      <p className="text-sm text-muted-foreground">Sign recognized with 98% confidence</p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Badge>ASL</Badge>
                      <Badge variant="outline">Real-time</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-lg border hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Audio Ready</p>
                    <p className="text-xs text-muted-foreground">Click to listen</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card rounded-xl p-4 shadow-lg border hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Webcam Active</p>
                    <p className="text-xs text-muted-foreground">Processing frames</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-semibold">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for accessibility, accuracy, and ease of use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>






      {/* Footer */}
      <footer className="py-12 md:py-16 border-t bg-muted/20" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <Star className="w-4 h-4 fill-white" aria-hidden="true" />
                </div>
                <span className="font-semibold">AccessEdu</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Breaking communication barriers with AI-powered sign language translation.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/student-dashboard" className="hover:text-foreground transition-colors">Learning Dashboard</Link></li>
                <li><Link href="/teacher-dashboard" className="hover:text-foreground transition-colors">Teacher Workspace</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Course Catalog</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Accessibility Statement</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AccessEdu. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Accessibility className="w-3 h-3 mr-1" aria-hidden="true" />
                WCAG 2.1 AA
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
