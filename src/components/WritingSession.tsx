import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RotateCcw, Clock, X, Save, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface WritingSignals {
  revision_count: number;
  word_count_changes: number[];
  session_duration_seconds: number;
  final_word_count: number;
  auto_save_count: number;
  time_between_revisions_avg_seconds: number | null;
}

interface WritingSessionProps {
  onFinish: (data: {
    content: string;
    signals: WritingSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => void;
  onCancel: () => void;
}

export function WritingSession({ onFinish, onCancel }: WritingSessionProps) {
  const [content, setContent] = useState("");
  const [sessionStartTime] = useState(Date.now());
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Learning signals tracking
  const [revisionCount, setRevisionCount] = useState(0);
  const [wordCountChanges, setWordCountChanges] = useState<number[]>([]);
  const [autoSaveCount, setAutoSaveCount] = useState(0);
  const [revisionTimestamps, setRevisionTimestamps] = useState<number[]>([]);
  
  const lastContentRef = useRef(content);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Count words in text
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Auto-save functionality (simulated - stores locally)
  const autoSave = useCallback(() => {
    if (content !== lastSavedContent && content.trim()) {
      setIsSaving(true);
      // Simulate save delay
      setTimeout(() => {
        setLastSavedContent(content);
        setAutoSaveCount(prev => prev + 1);
        setIsSaving(false);
      }, 300);
    }
  }, [content, lastSavedContent]);

  // Track revisions (meaningful changes, not keystrokes)
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Debounce revision counting - count after user pauses
    if (revisionTimeoutRef.current) {
      clearTimeout(revisionTimeoutRef.current);
    }
    
    revisionTimeoutRef.current = setTimeout(() => {
      const oldWordCount = countWords(lastContentRef.current);
      const newWordCount = countWords(newContent);
      
      // Only count as revision if meaningful change (more than 5 words difference or significant edit)
      const wordDiff = Math.abs(newWordCount - oldWordCount);
      if (wordDiff >= 5 || (lastContentRef.current.length > 50 && Math.abs(newContent.length - lastContentRef.current.length) > 20)) {
        setRevisionCount(prev => prev + 1);
        setRevisionTimestamps(prev => [...prev, Date.now()]);
        setWordCountChanges(prev => [...prev, newWordCount]);
        lastContentRef.current = newContent;
      }
    }, 2000);

    // Auto-save after 3 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(autoSave, 3000);
  }, [autoSave]);

  const resetContent = () => {
    setContent("");
    setRevisionCount(prev => prev + 1);
    setWordCountChanges(prev => [...prev, 0]);
    setRevisionTimestamps(prev => [...prev, Date.now()]);
    lastContentRef.current = "";
    toast({
      title: "Content cleared",
      description: "Your writing has been reset.",
    });
  };

  const calculateSignals = (): WritingSignals => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    // Calculate average time between revisions
    let avgTimeBetweenRevisions: number | null = null;
    if (revisionTimestamps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < revisionTimestamps.length; i++) {
        intervals.push((revisionTimestamps[i] - revisionTimestamps[i - 1]) / 1000);
      }
      avgTimeBetweenRevisions = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }

    return {
      revision_count: revisionCount,
      word_count_changes: wordCountChanges,
      session_duration_seconds: sessionDuration,
      final_word_count: countWords(content),
      auto_save_count: autoSaveCount,
      time_between_revisions_avg_seconds: avgTimeBetweenRevisions,
    };
  };

  const handleFinish = () => {
    const signals = calculateSignals();
    const wordCount = countWords(content);
    
    // Generate suggested title and description
    const suggestedTitle = `Writing session`;
    const suggestedDescription = `Written ${wordCount} word${wordCount !== 1 ? 's' : ''} with ${revisionCount} revision${revisionCount !== 1 ? 's' : ''} over ${Math.floor(signals.session_duration_seconds / 60)} minute${Math.floor(signals.session_duration_seconds / 60) !== 1 ? 's' : ''}.`;

    onFinish({
      content,
      signals,
      suggestedTitle,
      suggestedDescription,
    });
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (revisionTimeoutRef.current) clearTimeout(revisionTimeoutRef.current);
    };
  }, []);

  // Update timer display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const currentWordCount = countWords(content);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display font-semibold">PROOF Writing Space</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{currentWordCount} words</span>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-primary">
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleFinish}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Finish & Log
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Writing area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Document</CardTitle>
              <Button variant="outline" size="sm" onClick={resetContent}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="h-full w-full resize-none text-base leading-relaxed rounded-none border-0 border-t focus-visible:ring-0 p-6"
                placeholder="Start writing your paper, lab report, or explanation here...

This is a focused writing space designed to help you develop your thoughts without distractions. Your work is automatically saved as you write.

Tips:
• Take your time to organize your thoughts
• Don't worry about perfection on the first draft
• Revisions are a natural part of the writing process"
              />
            </CardContent>
          </Card>
        </div>

        {/* Progress panel */}
        <div className="w-80 flex flex-col gap-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Words written</span>
                <span className="font-medium">{currentWordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revisions</span>
                <span className="font-medium">{revisionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-saves</span>
                <span className="font-medium">{autoSaveCount}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                Only learning-relevant signals are tracked. No keystrokes or clipboard history.
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>• <strong>Structure first:</strong> Outline your main points before diving into details.</p>
              <p>• <strong>Write freely:</strong> Get your ideas down first, edit later.</p>
              <p>• <strong>Take breaks:</strong> Step away periodically to maintain perspective.</p>
              <p>• <strong>Revise actively:</strong> Each revision strengthens your argument.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
