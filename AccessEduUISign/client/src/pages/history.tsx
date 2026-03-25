import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Camera,
  Video,
  Image,
  Volume2,
  Trash2,
  Download,
  Calendar,
  Filter,
  Hand,
  ArrowLeft,
  Play,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Translation } from "@shared/schema";

type InputType = "webcam" | "video" | "image";

const inputTypeIcons = {
  webcam: Camera,
  video: Video,
  image: Image,
};

const inputTypeLabels = {
  webcam: "Webcam",
  video: "Video",
  image: "Image",
};

export default function HistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<InputType | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { data: translations, isLoading } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/translations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Translation Deleted",
        description: "The translation has been removed from your history.",
      });
      setDeleteDialogOpen(false);
      setSelectedTranslation(null);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not delete translation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTranslations = translations?.filter((t) => {
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || t.inputType === filterType;
    return matchesSearch && matchesType;
  });

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleDelete = (translation: Translation) => {
    setSelectedTranslation(translation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTranslation) {
      deleteMutation.mutate(selectedTranslation.id);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 75) return "text-yellow-500";
    return "text-orange-500";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (confidence >= 75) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please select a user type to view history.</p>
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/recognize">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Translation History</h1>
              <p className="text-muted-foreground">
                View and manage your saved translations
              </p>
            </div>
          </div>
          <Link href="/recognize">
            <Button className="gap-2" data-testid="button-new-translation">
              <Play className="w-4 h-4" />
              New Translation
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search translations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as InputType | "all")}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="webcam">Webcam</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredTranslations && filteredTranslations.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredTranslations.map((translation) => {
                    const Icon = inputTypeIcons[translation.inputType];
                    return (
                      <div
                        key={translation.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                        data-testid={`translation-item-${translation.id}`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-lg truncate">{translation.text}</p>
                            <Badge variant="outline" className="text-xs">
                              {inputTypeLabels[translation.inputType]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className={`font-mono ${getConfidenceColor(translation.confidence)}`}>
                              {translation.confidence}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(translation.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => speakText(translation.text)}
                            disabled={isSpeaking}
                            data-testid={`button-speak-${translation.id}`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(translation)}
                            data-testid={`button-delete-${translation.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Hand className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || filterType !== "all"
                    ? "No results found"
                    : "No translations yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Start translating sign language to build your history."}
                </p>
                <Link href="/recognize">
                  <Button className="gap-2">
                    <Play className="w-4 h-4" />
                    Start Translating
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredTranslations && filteredTranslations.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredTranslations.length} of {translations?.length || 0} translations
            </p>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-export">
              <Download className="w-4 h-4" />
              Export History
            </Button>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Translation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTranslation?.text}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
