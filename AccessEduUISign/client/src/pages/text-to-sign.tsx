import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, Volume2, MoveRight, Mic } from "lucide-react";
import { SignAvatar } from "@/components/sign-avatar";

export default function TextToSignPage() {
    const { toast } = useToast();
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast({
                title: "Not Supported",
                description: "Voice recognition is not supported in this browser.",
                variant: "destructive",
            });
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            setIsListening(false);

            // Automatically trigger translation after a short delay
            setTimeout(() => {
                handleTranslateFromText(transcript);
            }, 500);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            toast({
                title: "Voice Error",
                description: "Could not recognize speech. Please try again.",
                variant: "destructive",
            });
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleTranslate = async () => {
        handleTranslateFromText(inputText);
    };

    const handleTranslateFromText = (text: string) => {
        if (!text.trim()) {
            toast({
                title: "Empty Input",
                description: "Please enter or speak some text to translate.",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);
        setShouldPlay(false);

        // Allow UI to reset
        setTimeout(() => {
            setIsProcessing(false);
            setShouldPlay(true);
        }, 800);
    };

    return (
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Text/Voice to Visual output</h1>
                    <p className="text-muted-foreground">
                        Enter text or use your voice to generate a sign language video.
                    </p>
                </div>

                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
                    {/* Input Section */}
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Input Source</CardTitle>
                            <CardDescription>Type text or click the mic to speak</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Textarea
                                    placeholder="Hello, how are you today?"
                                    className="min-h-[200px] text-lg resize-none pr-12"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <Button
                                    size="icon"
                                    variant={isListening ? "destructive" : "secondary"}
                                    className={`absolute bottom-4 right-4 rounded-full ${isListening ? 'animate-pulse' : ''}`}
                                    onClick={startListening}
                                    disabled={isProcessing}
                                >
                                    {isListening ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Mic className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInputText("")}
                                    disabled={!inputText || isProcessing}
                                >
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Section (Desktop) */}
                    <div className="hidden md:flex flex-col items-center justify-center h-full pt-20 space-y-2">
                        <Button
                            size="lg"
                            className="rounded-full w-12 h-12 p-0"
                            onClick={handleTranslate}
                            disabled={!inputText || isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <MoveRight className="w-6 h-6" />
                            )}
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium">Convert</span>
                    </div>

                    {/* Action Section (Mobile) */}
                    <div className="md:hidden flex justify-center">
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleTranslate}
                            disabled={!inputText || isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 mr-2" />
                            )}
                            Generate Video
                        </Button>
                    </div>

                    {/* Output Section */}
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Visual Output</CardTitle>
                                <CardDescription>Watch the generated sign language video</CardDescription>
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                    if ('speechSynthesis' in window && inputText) {
                                        window.speechSynthesis.cancel();
                                        const utterance = new SpeechSynthesisUtterance(inputText);
                                        utterance.rate = 0.9;
                                        window.speechSynthesis.speak(utterance);
                                    }
                                }}
                                disabled={!inputText}
                                title="Play Output Audio"
                            >
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                                {isProcessing && (
                                    <div className="absolute inset-0 z-10 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                                        <p className="text-sm text-muted-foreground">Preparing gestures...</p>
                                    </div>
                                )}
                                <SignAvatar text={inputText} trigger={shouldPlay} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
