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
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Real-time Recognition",
    description: "Instant sign language recognition from your webcam with sub-second latency.",
  },
  {
    icon: Upload,
    title: "Multi-Input Support",
    description: "Upload videos or images for batch processing and detailed analysis.",
  },
  {
    icon: Clock,
    title: "Progress Tracking",
    description: "Save translations and track your learning journey over time.",
  },
  {
    icon: Volume2,
    title: "Text-to-Speech",
    description: "Hear recognized text spoken aloud with natural voice synthesis.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays secure with consent-based storage and encryption.",
  },
  {
    icon: Accessibility,
    title: "Accessibility Built-in",
    description: "WCAG 2.1 compliant with font scaling, high contrast, and screen reader support.",
  },
];

const inputModes = [
  {
    icon: Camera,
    title: "Live Webcam Recognition",
    description: "Get real-time translations as you sign. Our AI processes each frame instantly, displaying recognized text with confidence scores.",
    features: ["Sub-100ms latency", "Continuous recognition", "Confidence indicators"],
    imagePosition: "left" as const,
  },
  {
    icon: Video,
    title: "Upload Videos",
    description: "Process pre-recorded sign language videos. View a timeline with recognized text at each timestamp and export full transcripts.",
    features: ["MP4, WebM, MOV support", "Timeline scrubber", "Transcript export"],
    imagePosition: "right" as const,
  },
  {
    icon: Image,
    title: "Static Image Analysis",
    description: "Upload images of sign language gestures for instant recognition. Perfect for learning individual letters and signs.",
    features: ["JPG, PNG support", "Instant analysis", "Detailed feedback"],
    imagePosition: "left" as const,
  },
];

const userTypes = [
  {
    icon: Hand,
    title: "Deaf & Hard of Hearing",
    description: "Communicate effortlessly with text output and visual feedback designed for your needs.",
  },
  {
    icon: Users,
    title: "Non-Signers",
    description: "Learn sign language or communicate with Deaf individuals through real-time translation.",
  },
  {
    icon: GraduationCap,
    title: "Teachers & Administrators",
    description: "Track student progress and facilitate inclusive learning environments.",
  },
  {
    icon: Eye,
    title: "Elderly & Visually Challenged",
    description: "Large text, high contrast, and audio output ensure accessibility for everyone.",
  },
];

const testimonials = [
  {
    quote: "AccessEdu has transformed how I communicate with my hearing colleagues. The real-time recognition is incredibly accurate.",
    name: "Sarah Chen",
    role: "Software Engineer",
    avatar: "SC",
  },
  {
    quote: "As a teacher of Deaf students, this tool helps me bridge the communication gap and track each student's progress.",
    name: "Michael Rodriguez",
    role: "Special Education Teacher",
    avatar: "MR",
  },
  {
    quote: "The video upload feature lets me review my signing and improve. It's like having a personal tutor available 24/7.",
    name: "Emily Thompson",
    role: "ASL Student",
    avatar: "ET",
  },
];

const stats = [
  { value: "50K+", label: "Translations Processed" },
  { value: "95%", label: "Recognition Accuracy" },
  { value: "10+", label: "Sign Languages Supported" },
];

const howItWorks = [
  {
    step: 1,
    icon: Hand,
    title: "Sign or Upload",
    description: "Use your webcam for real-time recognition, or upload a video/image file.",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Recognition",
    description: "Our TensorFlow.js model analyzes your input and identifies signs instantly.",
  },
  {
    step: 3,
    icon: Mic,
    title: "Get Results",
    description: "See recognized text with confidence scores and hear it spoken aloud.",
  },
  {
    step: 4,
    icon: Heart,
    title: "Save & Learn",
    description: "Save translations to your history and track your progress over time.",
  },
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
                  <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-hero-start">
                    <Play className="w-4 h-4" aria-hidden="true" />
                    Start Translating
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-hero-demo">
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
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Hand className="w-12 h-12 text-primary" />
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

      {/* Input Modes Showcase */}
      <section className="py-16 md:py-24" aria-labelledby="modes-heading">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 id="modes-heading" className="text-3xl md:text-4xl font-semibold">
              Three Ways to Translate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the input method that works best for your needs.
            </p>
          </div>
          <div className="space-y-24">
            {inputModes.map((mode, index) => (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  mode.imagePosition === "right" ? "lg:flex-row-reverse" : ""
                }`}
                data-testid={`section-mode-${index}`}
              >
                <div className={`space-y-6 ${mode.imagePosition === "right" ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <mode.icon className="w-7 h-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold">{mode.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{mode.description}</p>
                  <ul className="space-y-3">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="w-3 h-3 text-green-500" aria-hidden="true" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${mode.imagePosition === "right" ? "lg:order-2" : "lg:order-1"}`} aria-hidden="true">
                  <div className="aspect-video bg-gradient-to-br from-muted via-muted/50 to-accent/20 rounded-2xl flex items-center justify-center border">
                    <div className="text-center space-y-4 p-8">
                      <mode.icon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                      <p className="text-muted-foreground">{mode.title} Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="users-heading">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 id="users-heading" className="text-3xl md:text-4xl font-semibold">
              Built for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AccessEdu adapts to your unique needs and communication style.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((type, index) => (
              <Card key={index} className="hover-elevate text-center" data-testid={`card-usertype-${index}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <type.icon className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold">{type.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-semibold">
              Loved by Our Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users are saying about AccessEdu.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-testimonial-${index}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Stats Banner */}
          <div className="mt-16 bg-primary/5 rounded-2xl p-8 md:p-12 border">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-2" data-testid={`stat-${index}`}>
                  <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="how-heading">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 id="how-heading" className="text-3xl md:text-4xl font-semibold">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just four simple steps.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden lg:block" aria-hidden="true" />
            <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative" data-testid={`step-${index}`}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                        {step.step}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border flex items-center justify-center">
                        <step.icon className="w-4 h-4 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" aria-hidden="true" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center space-y-8">
          <h2 id="cta-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Ready to Break Communication Barriers?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users already experiencing seamless sign language translation. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-cta-start">
                <Play className="w-4 h-4" aria-hidden="true" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/recognize">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-cta-explore">
                <Globe className="w-4 h-4" aria-hidden="true" />
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-16 border-t bg-muted/20" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Hand className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-semibold">AccessEdu</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Breaking communication barriers with AI-powered sign language translation.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/recognize" className="hover:text-foreground transition-colors">Webcam Recognition</Link></li>
                <li><Link href="/recognize" className="hover:text-foreground transition-colors">Video Upload</Link></li>
                <li><Link href="/recognize" className="hover:text-foreground transition-colors">Image Analysis</Link></li>
                <li><Link href="/history" className="hover:text-foreground transition-colors">Translation History</Link></li>
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
