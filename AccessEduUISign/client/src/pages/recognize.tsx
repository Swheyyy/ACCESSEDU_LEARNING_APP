import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PrivacyConsentModal } from "@/components/privacy-consent-modal";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Camera,
  Video,
  Image,
  Play,
  Pause,
  Save,
  Volume2,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileVideo,
  FileImage,
  Trash2,
  RefreshCw,
  Hand,
  Mic,
  Download,
} from "lucide-react";
import type { Translation, InputType } from "@shared/schema";

type RecognitionResult = {
  text: string;
  confidence: number;
  timestamp: Date;
  predictions?: Array<{ text: string, confidence: number }>;
  process_time?: number;
};

type InputMode = "webcam" | "video" | "image";

const ASL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function simulateRecognition(): RecognitionResult {
  const words = ["Hello", "Thank you", "Please", "Yes", "No", "Good", "Help", "Sorry", "Welcome", "Friend"];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const confidence = 75 + Math.random() * 25;
  return {
    text: randomWord,
    confidence: Math.round(confidence * 10) / 10,
    timestamp: new Date(),
  };
}

function simulateLetterRecognition(): RecognitionResult {
  const randomLetter = ASL_LETTERS[Math.floor(Math.random() * ASL_LETTERS.length)];
  const confidence = 80 + Math.random() * 20;
  return {
    text: randomLetter,
    confidence: Math.round(confidence * 10) / 10,
    timestamp: new Date(),
  };
}

export default function RecognizePage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inputMode, setInputMode] = useState<InputMode>("webcam");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem("accessedu-camera-consent") === "true";
  });
  const [storeMedia, setStoreMedia] = useState(() => {
    return localStorage.getItem("accessedu-store-media") === "true";
  });

  const wsRef = useRef<WebSocket | null>(null);

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [sessionResults, setSessionResults] = useState<RecognitionResult[]>([]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
    };
  }, []);

  const startWebcam = useCallback(async () => {
    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);

        toast({
          title: "Camera Active",
          description: "Webcam is now streaming. Click 'Start Recognition' to begin.",
        });
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [hasConsent, toast]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsRecognizing(false);
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!isWebcamActive || !videoRef.current) return;

    setIsRecognizing(true);
    setSessionResults([]);

    // Initialize WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'recognition') {
          const result: RecognitionResult = {
            text: data.text,
            confidence: data.confidence,
            timestamp: new Date(data.timestamp),
            predictions: data.predictions,
            process_time: data.process_time
          };
          setCurrentResult(result);
          setSessionResults(prev => {
            // Only add if different from last or significant confidence
            if (prev.length > 0 && prev[0].text === result.text && result.confidence < 90) {
              return prev;
            }
            return [result, ...prev].slice(0, 20);
          });
        }
      } catch (e) {
        console.error("Failed to parse recognition result:", e);
      }
    };

    ws.onopen = () => {
      console.log("Recognition WebSocket connected");

      // Start frame capture loop
      const canvas = document.createElement("canvas");
      canvas.width = 224; // Match model input size
      canvas.height = 224;
      const ctx = canvas.getContext("2d");

      recognitionIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && videoRef.current && ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL("image/jpeg", 0.7);
          ws.send(JSON.stringify({
            type: 'frame',
            image: imageData
          }));
        }
      }, 500); // Process 2 frames per second for stability
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      toast({
        title: "Recognition Error",
        description: "Communication with AI server failed.",
        variant: "destructive",
      });
    };

    toast({
      title: "Recognition Started",
      description: "Real-time AI analysis is now active.",
    });
  }, [isWebcamActive, toast]);

  const pauseRecognition = useCallback(() => {
    setIsRecognizing(false);
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const handleConsent = useCallback((shouldStoreMedia: boolean) => {
    setHasConsent(true);
    setStoreMedia(shouldStoreMedia);
    localStorage.setItem("accessedu-camera-consent", "true");
    localStorage.setItem("accessedu-store-media", shouldStoreMedia.toString());
    setShowConsentModal(false);
    startWebcam();
  }, [startWebcam]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if ((inputMode === "video" && !isVideo) || (inputMode === "image" && !isImage)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a ${inputMode === "video" ? "video" : "image"} file.`,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploadedPreview(URL.createObjectURL(file));
    setCurrentResult(null);
  }, [inputMode, toast]);

  const processUploadedFile = useCallback(async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setSessionResults([]);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      const base64Data = await base64Promise;

      const res = await apiRequest("POST", "/api/recognize", {
        image: base64Data,
        type: inputMode
      });
      const data = await res.json();

      const result: RecognitionResult = {
        text: data.text,
        confidence: data.confidence,
        timestamp: new Date(),
        predictions: data.predictions,
        process_time: data.process_time
      };

      setCurrentResult(result);
      setSessionResults([result]);

      toast({
        title: "Analysis Complete",
        description: `Recognized: "${result.text}" with ${result.confidence}% confidence.`,
      });
    } catch (error) {
      console.error("Recognition error:", error);
      toast({
        title: "Processing Failed",
        description: "The AI server could not process this file. Please try another.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, inputMode, toast]);

  const clearUpload = useCallback(() => {
    setUploadedFile(null);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
    }
    setUploadedPreview(null);
    setCurrentResult(null);
    setSessionResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedPreview]);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "TTS Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [toast]);

  const saveMutation = useMutation({
    mutationFn: async (result: RecognitionResult) => {
      return await apiRequest("POST", "/api/translations", {
        userId: user?.id || null,
        text: result.text,
        confidence: result.confidence,
        inputType: inputMode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Translation Saved",
        description: `"${currentResult?.text}" has been saved to your history.`,
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save translation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveTranslation = useCallback(async () => {
    if (!currentResult) return;
    saveMutation.mutate(currentResult);
  }, [currentResult, saveMutation]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 75) return "text-yellow-500";
    return "text-orange-500";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 75) return "bg-yellow-500";
    return "bg-orange-500";
  };

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please select a user type to continue.</p>
            <Link href="/auth">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6" role="main">
      <PrivacyConsentModal
        open={showConsentModal}
        onConsent={handleConsent}
        onCancel={() => setShowConsentModal(false)}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
          {/* Left Sidebar - Input Mode & History */}
          <aside className="space-y-6" role="complementary" aria-label="Input modes and saved translations">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Input Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Tabs value={inputMode} onValueChange={(v) => {
                  setInputMode(v as InputMode);
                  stopWebcam();
                  clearUpload();
                }}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="webcam" className="gap-1" data-testid="tab-webcam">
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Webcam</span>
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-1" data-testid="tab-video">
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Video</span>
                    </TabsTrigger>
                    <TabsTrigger value="image" className="gap-1" data-testid="tab-image">
                      <Image className="w-4 h-4" />
                      <span className="hidden sm:inline">Image</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  Session Results
                  {sessionResults.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {sessionResults.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {sessionResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hand className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No results yet</p>
                      <p className="text-xs">Start recognition to see results</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessionResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                          onClick={() => {
                            setCurrentResult(result);
                            speakText(result.text);
                          }}
                          data-testid={`result-item-${index}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{result.text}</span>
                            <Badge variant="outline" className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                              {result.confidence}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Video/Image Display */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted flex items-center justify-center">
                  {inputMode === "webcam" && (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isWebcamActive ? "block" : "hidden"}`}
                        data-testid="video-webcam"
                      />
                      {!isWebcamActive && (
                        <div className="text-center space-y-4 p-8">
                          <div className="w-20 h-20 mx-auto rounded-full bg-muted-foreground/10 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Camera Not Active</p>
                            <p className="text-sm text-muted-foreground">
                              Click the button below to start your webcam
                            </p>
                          </div>
                          <Button onClick={startWebcam} className="gap-2" data-testid="button-start-webcam">
                            <Camera className="w-4 h-4" />
                            Start Webcam
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {(inputMode === "video" || inputMode === "image") && (
                    <>
                      {!uploadedPreview ? (
                        <label
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors p-8"
                          data-testid="dropzone"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={inputMode === "video" ? "video/*" : "image/*"}
                            onChange={handleFileUpload}
                            className="hidden"
                            data-testid="input-file"
                          />
                          <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                            {inputMode === "video" ? (
                              <FileVideo className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <FileImage className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium">
                            Drop your {inputMode} here or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {inputMode === "video" ? "MP4, WebM, MOV supported" : "JPG, PNG supported"}
                          </p>
                        </label>
                      ) : (
                        <div className="relative w-full h-full">
                          {inputMode === "video" ? (
                            <video
                              src={uploadedPreview}
                              controls
                              className="w-full h-full object-contain"
                              data-testid="video-preview"
                            />
                          ) : (
                            <img
                              src={uploadedPreview}
                              alt="Uploaded sign language image"
                              className="w-full h-full object-contain"
                              data-testid="image-preview"
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={clearUpload}
                            data-testid="button-clear-upload"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Recognized Text Overlay */}
                  {currentResult && isWebcamActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-4"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white text-2xl md:text-3xl font-bold" data-testid="text-recognized">
                            {currentResult.text}
                          </p>
                          <p className="text-white/70 text-sm">
                            Recognized at {currentResult.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={`${getConfidenceBg(currentResult.confidence)} text-white border-none`}
                            data-testid="badge-confidence"
                          >
                            {currentResult.confidence}%
                          </Badge>

                          {/* Alternative Matches */}
                          {(currentResult as any).predictions && (currentResult as any).predictions.length > 1 && (
                            <div className="flex gap-2 mt-1 flex-wrap pb-1">
                              {(currentResult as any).predictions.slice(1, 5).map((p: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-[12px] px-2 py-0.5 text-white/80 border-white/40 whitespace-nowrap bg-black/40 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setCurrentResult(prev => prev ? { ...prev, text: p.text, confidence: Math.round(p.confidence * 100) } : prev)}>
                                  {p.text} ({Math.round(p.confidence * 100)}%)
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confidence Indicator */}
                  {currentResult && isWebcamActive && (
                    <div className="absolute top-4 right-4" aria-hidden="true">
                      <div className="relative w-16 h-16">
                        <svg className="transform -rotate-90 w-16 h-16">
                          <circle
                            className="text-white/20"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="32"
                            cy="32"
                          />
                          <circle
                            className={getConfidenceColor(currentResult.confidence).replace("text-", "stroke-")}
                            strokeWidth="4"
                            strokeDasharray={`${currentResult.confidence * 1.76} 176`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="32"
                            cy="32"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                          {Math.round(currentResult.confidence)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                        <p className="font-medium">Processing {inputMode}...</p>
                        <p className="text-sm text-muted-foreground">
                          Analyzing signs with AI Bridge (Python)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result Display for uploaded files */}
            {currentResult && !isWebcamActive && (
              <Card data-testid="card-result">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Top Guess</p>
                        <p className="text-3xl font-bold" data-testid="text-result">
                          {currentResult.text}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <Badge
                            className={`${getConfidenceBg(currentResult.confidence)} text-white border-none`}
                          >
                            {currentResult.confidence}%
                          </Badge>
                        </div>
                        <Progress
                          value={currentResult.confidence}
                          className="w-32 h-2"
                        />
                      </div>
                    </div>

                    {currentResult.predictions && currentResult.predictions.length > 1 && (
                      <div className="pt-4 border-t">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Other Possible Matches</p>
                        <div className="space-y-2">
                          {currentResult.predictions.slice(1, 5).map((pred, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/30 hover:bg-primary/10 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                              onClick={() => setCurrentResult(prev => prev ? { ...prev, text: pred.text, confidence: Math.round(pred.confidence * 100) } : prev)}
                            >
                              <span className="font-medium text-primary">{pred.text}</span>
                              <span className="text-muted-foreground font-mono bg-background px-2 py-1 rounded text-xs">{Math.round(pred.confidence * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Controls */}
          <aside className="space-y-6" role="complementary" aria-label="Controls and settings">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inputMode === "webcam" ? (
                  <>
                    {!isWebcamActive ? (
                      <Button
                        className="w-full gap-2"
                        onClick={startWebcam}
                        data-testid="button-control-start-webcam"
                      >
                        <Camera className="w-4 h-4" />
                        Start Webcam
                      </Button>
                    ) : (
                      <>
                        {!isRecognizing ? (
                          <Button
                            className="w-full gap-2"
                            onClick={startRecognition}
                            data-testid="button-start-recognition"
                          >
                            <Play className="w-4 h-4" />
                            Start Recognition
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            className="w-full gap-2"
                            onClick={pauseRecognition}
                            data-testid="button-pause-recognition"
                          >
                            <Pause className="w-4 h-4" />
                            Pause Recognition
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={stopWebcam}
                          data-testid="button-stop-webcam"
                        >
                          <X className="w-4 h-4" />
                          Stop Webcam
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full gap-2"
                      disabled={!uploadedFile || isProcessing}
                      onClick={processUploadedFile}
                      data-testid="button-process"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isProcessing ? "Processing..." : "Process " + (inputMode === "video" ? "Video" : "Image")}
                    </Button>
                    {uploadedFile && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={clearUpload}
                        data-testid="button-clear"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Upload
                      </Button>
                    )}
                  </>
                )}

                <div className="pt-3 border-t space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={!currentResult || isSpeaking}
                    onClick={() => currentResult && speakText(currentResult.text)}
                    data-testid="button-listen"
                  >
                    {isSpeaking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    {isSpeaking ? "Speaking..." : "Listen"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={!currentResult || saveMutation.isPending}
                    onClick={saveTranslation}
                    data-testid="button-save"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saveMutation.isPending ? "Saving..." : "Save Translation"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isRecognizing ? "default" : "secondary"}>
                    {inputMode === "webcam"
                      ? isRecognizing
                        ? "Active"
                        : isWebcamActive
                          ? "Ready"
                          : "Inactive"
                      : isProcessing
                        ? "Processing"
                        : uploadedFile
                          ? "File Loaded"
                          : "Waiting"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Translations</span>
                  <span className="font-mono text-sm">{sessionResults.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Input Mode</span>
                  <span className="text-sm capitalize">{inputMode}</span>
                </div>
                {currentResult && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Confidence</span>
                    <span className={`font-mono text-sm ${getConfidenceColor(currentResult.confidence)}`}>
                      {currentResult.confidence}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/history">
                  <Button variant="ghost" className="w-full justify-start gap-2" data-testid="link-history">
                    <Download className="w-4 h-4" />
                    View History
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSessionResults([]);
                    setCurrentResult(null);
                  }}
                  disabled={sessionResults.length === 0}
                  data-testid="button-clear-session"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Session
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Target Vocabulary</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Letters</h4>
                      <div className="flex flex-wrap gap-1">
                        {["A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "R", "S", "T", "U", "V", "W", "Y"].map(l => (
                          <Badge key={l} variant="outline" className="text-[10px] px-1.5 py-0">{l}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Common Words</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Hello</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Thank You</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Yes / No</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Drink</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Eat</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Computer</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Book</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" /> Work</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
