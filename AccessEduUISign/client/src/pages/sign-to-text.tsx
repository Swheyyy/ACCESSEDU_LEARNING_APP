import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  Upload, Play, Pause, RotateCcw, Copy, Download,
  Loader2, Check, AlertCircle, Video, FileText,
  Sparkles, Volume2, BookOpen
} from "lucide-react";

export default function SignToTextPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any | null>(null);
  const [transcription, setTranscription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const signToTextMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const token = localStorage.getItem("accessedu_token");

      const res = await fetch("/api/video/sign-to-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          videoBuffer: base64Data,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Processing failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setProcessResult(data);
      setTranscription(data.transcription);
      console.log("[v0] Sign-to-Text processing complete:", data);
      toast({
        title: "Processing Complete",
        description: `Extracted ${data.frameCount} frames. Transcription ready.`
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Processing Error",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid Format",
        description: "Please select a video file (MP4, WebM, etc.)",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setProcessResult(null);
    setTranscription("");
  };

  const handleProcess = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    signToTextMutation.mutate(uploadedFile);
    setIsProcessing(false);
  };

  const handleCopyTranscription = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      toast({ title: "Copied", description: "Transcription copied to clipboard" });
    }
  };

  const handleDownloadTranscription = () => {
    if (transcription) {
      const element = document.createElement("a");
      const file = new Blob([transcription], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = "transcription.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setProcessResult(null);
    setTranscription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="text-center">Please authenticate to use this feature.</p>
            <Button className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-white">
              <FileText className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sign-to-Text Converter</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload a sign language video and get an instant transcription. AI-powered accuracy with frame-by-frame analysis.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload and Preview Section */}
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-6 border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Video className="w-6 h-6 text-blue-600" />
                Video Input
              </CardTitle>
              <CardDescription>Upload your sign language video</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!videoPreview ? (
                <label className="block border-4 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 transition-colors group">
                  <div className="space-y-3">
                    <Upload className="w-16 h-16 mx-auto text-slate-300 group-hover:text-blue-400 transition-colors" />
                    <div>
                      <p className="font-black text-slate-700">Click to upload video</p>
                      <p className="text-sm text-slate-500 mt-1">or drag and drop (MP4, WebM, etc.)</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      src={videoPreview}
                      className="w-full h-64 object-cover"
                      controls
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl space-y-2">
                    <p className="text-sm font-bold text-slate-700">
                      File: {uploadedFile?.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      Size: {(uploadedFile?.size || 0) / 1024 / 1024 > 0 
                        ? `${((uploadedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleProcess}
                      disabled={signToTextMutation.isPending || isProcessing}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl"
                    >
                      {signToTextMutation.isPending || isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Process Video
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="px-6 py-6 border-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-6 border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                Transcription
              </CardTitle>
              <CardDescription>AI-generated text from sign language</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!processResult ? (
                <div className="text-center py-12 space-y-3">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-slate-500">Upload and process a video to see transcription</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Processing Metadata */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-blue-600">{processResult.frameCount}</p>
                      <p className="text-xs text-slate-600 font-bold mt-1">Frames</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-purple-600">{processResult.fps}</p>
                      <p className="text-xs text-slate-600 font-bold mt-1">FPS</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-center">
                      <p className="text-2xl font-black text-emerald-600">{processResult.estimatedDuration}s</p>
                      <p className="text-xs text-slate-600 font-bold mt-1">Duration</p>
                    </div>
                  </div>

                  {/* Confidence Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-700">Recognition Confidence</p>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none">
                        {(processResult.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={processResult.confidence * 100} className="h-2" />
                  </div>

                  {/* Transcription Text */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-6 rounded-2xl min-h-32 border border-slate-100">
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {transcription || "No transcription available"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {transcription && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleCopyTranscription}
                        variant="outline"
                        className="flex-1 border-2 font-bold py-6 rounded-xl"
                      >
                        <Copy className="w-5 h-5 mr-2" />
                        Copy
                      </Button>
                      <Button
                        onClick={handleDownloadTranscription}
                        variant="outline"
                        className="flex-1 border-2 font-bold py-6 rounded-xl"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}

                  {/* Text-to-Speech */}
                  <Button
                    onClick={() => {
                      if ("speechSynthesis" in window) {
                        const utterance = new SpeechSynthesisUtterance(transcription);
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl"
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Read Aloud
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
