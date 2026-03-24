import { useState, useEffect, useRef } from "react";
import { Loader2, Play, CircleSlash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignAvatarProps {
    text: string;
    trigger: boolean;
}

export function SignAvatar({ text, trigger }: SignAvatarProps) {
    const { toast } = useToast();
    const [wordMap, setWordMap] = useState<Record<string, string>>({});
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load the word-video mapping on mount
    useEffect(() => {
        fetch("/api/sign-map")
            .then(res => res.json())
            .then(data => {
                setWordMap(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load sign map:", err);
                setIsLoading(false);
            });
    }, []);

    // Handle text change and trigger
    useEffect(() => {
        if (!trigger || !text || isLoading) return;

        // Clear existing playlist when a new translation starts
        setPlaylist([]);
        setCurrentIndex(0);

        const words = text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~(?)]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 0);

        const newPlaylist: string[] = [];
        const missingWords: string[] = [];

        if (words.length === 0) {
            setIsPlaying(false);
            return;
        }

        words.forEach(word => {
            if (wordMap[word]) {
                newPlaylist.push(wordMap[word]);
            } else {
                // Fallback to fingerspelling (signing letter by letter)
                const letters = word.split("");
                let foundLetters = false;
                letters.forEach(letter => {
                    if (wordMap[letter]) {
                        newPlaylist.push(wordMap[letter]);
                        foundLetters = true;
                    }
                });

                if (!foundLetters) {
                    missingWords.push(word);
                }
            }
        });

        if (newPlaylist.length > 0) {
            setPlaylist(newPlaylist);
            setIsPlaying(true);

            if (missingWords.length > 0) {
                toast({
                    title: "Word(s) Partially Recognized",
                    description: `Could not find full signs for "${missingWords.join(", ")}". Breaking them into letters.`,
                    variant: "default"
                });
            }
        } else {
            toast({
                title: "Translation Error",
                description: "Sorry, neither the words nor their letters are available in the current dictionary.",
                variant: "destructive"
            });
            setIsPlaying(false);
            setPlaylist([]);
        }
    }, [trigger, isLoading, text, wordMap]);

    // Removed automatic speech synthesis (TTS) as per user request

    const handleVideoEnd = () => {
        if (currentIndex < playlist.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsPlaying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading ASL Dictionary...</p>
            </div>
        );
    }

    if (!isPlaying && playlist.length === 0) {
        return (
            <div className="text-center space-y-2 p-6">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Sign sequence will play here
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
            {playlist[currentIndex] ? (
                <video
                    key={playlist[currentIndex]}
                    ref={videoRef}
                    src={`/videos/${playlist[currentIndex]}.mp4`}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                    className="h-full w-auto object-contain"
                />
            ) : (
                <div className="text-center space-y-2">
                    <CircleSlash2 className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Video missing</p>
                </div>
            )}

            {/* Overlay Info */}
            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-[10px] text-white backdrop-blur-sm">
                Word {currentIndex + 1} of {playlist.length}
            </div>
        </div>
    );
}
