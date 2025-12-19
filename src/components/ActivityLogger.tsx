import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Code, FileText, GitCommit, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useActivities, Activity, LearningSignals } from "@/hooks/useActivities";
import { useSkills } from "@/hooks/useSkills";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CodingSpace } from "@/components/coding/CodingSpace";
import { WritingSpace } from "@/components/writing/WritingSpace";
import { CodingSignals } from "@/lib/signals/codingSignalExtractor";
import { WritingSignals } from "@/lib/signals/writingSignalExtractor";

const activityTypes = [
  { value: "code", label: "Code Work", icon: Code },
  { value: "document", label: "Document/Writing", icon: FileText },
  { value: "commit", label: "Git Commit", icon: GitCommit },
  { value: "review", label: "Self-Review", icon: CheckCircle },
  { value: "manual", label: "Other Activity", icon: Plus },
];

interface ActivityLoggerProps {
  onActivityAdded?: () => void;
}

type SessionMode = "none" | "code" | "writing" | "form";

interface SessionData {
  code?: string;
  content?: string;
  signals?: LearningSignals;
  suggestedTitle?: string;
  suggestedDescription?: string;
}

export function ActivityLogger({ onActivityAdded }: ActivityLoggerProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Activity["type"]>("code");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Learning space state
  const [sessionMode, setSessionMode] = useState<SessionMode>("none");
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [evidenceSource, setEvidenceSource] = useState<"submitted" | "observed_in_proof">("submitted");
  
  const { addActivity } = useActivities();
  const { skills } = useSkills();

  const handleTypeSelect = (selectedType: Activity["type"]) => {
    setType(selectedType);
    
    // Route to learning spaces for code and document types
    if (selectedType === "code") {
      setOpen(false);
      setSessionMode("code");
    } else if (selectedType === "document") {
      setOpen(false);
      setSessionMode("writing");
    }
  };

  const handleCodeSessionFinish = (data: {
    code: string;
    signals: CodingSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => {
    setSessionMode("form");
    setSessionData({
      code: data.code,
      signals: data.signals,
      suggestedTitle: data.suggestedTitle,
      suggestedDescription: data.suggestedDescription,
    });
    setTitle(data.suggestedTitle);
    setDescription(data.suggestedDescription);
    setContent(data.code);
    setEvidenceSource("observed_in_proof");
    setType("code");
    setOpen(true);
  };

  const handleWritingSessionFinish = (data: {
    content: string;
    signals: WritingSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => {
    setSessionMode("form");
    setSessionData({
      content: data.content,
      signals: data.signals,
      suggestedTitle: data.suggestedTitle,
      suggestedDescription: data.suggestedDescription,
    });
    setTitle(data.suggestedTitle);
    setDescription(data.suggestedDescription);
    setContent(data.content);
    setEvidenceSource("observed_in_proof");
    setType("document");
    setOpen(true);
  };

  const handleSessionCancel = () => {
    setSessionMode("none");
    setSessionData({});
    setEvidenceSource("submitted");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    // Read text content if it's a text file
    if (selectedFile.type.startsWith("text/") || 
        selectedFile.name.endsWith(".js") || 
        selectedFile.name.endsWith(".ts") ||
        selectedFile.name.endsWith(".py") ||
        selectedFile.name.endsWith(".java") ||
        selectedFile.name.endsWith(".md")) {
      const text = await selectedFile.text();
      setContent(text.slice(0, 5000)); // Limit content size
    }
    
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const analyzeWithAI = async () => {
    if (!title || (!content && !description)) {
      toast({
        title: "Missing content",
        description: "Please provide a title and some content to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-learning", {
        body: {
          type: "analyze_activity",
          content: {
            type,
            title,
            description,
            content: content.slice(0, 3000)
          },
          skills: skills.map(s => s.name)
        }
      });

      if (error) throw error;

      if (data.skills_detected) {
        setSelectedSkills(data.skills_detected);
      }
      if (data.insights) {
        setAiInsights(data.insights);
      }
      
      toast({
        title: "Analysis complete",
        description: "AI has analyzed your work and detected skills.",
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze with AI. You can still log manually.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your activity.",
        variant: "destructive"
      });
      return;
    }

    const activity = await addActivity({
      type,
      title,
      description: description || null,
      content: content || null,
      file_url: null,
      file_type: file?.type || null,
      skills_practiced: selectedSkills,
      duration_minutes: duration ? parseInt(duration) : null,
      insights: aiInsights,
      evidence_source: evidenceSource,
      learning_signals: sessionData.signals || null,
    });

    if (activity) {
      setOpen(false);
      resetForm();
      onActivityAdded?.();
    }
  };

  const resetForm = () => {
    setType("code");
    setTitle("");
    setDescription("");
    setContent("");
    setDuration("");
    setSelectedSkills([]);
    setAiInsights(null);
    setFile(null);
    setSessionMode("none");
    setSessionData({});
    setEvidenceSource("submitted");
  };

  // Render learning spaces
  if (sessionMode === "code") {
    return (
      <>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Activity
        </Button>
        <CodingSpace
          onFinish={handleCodeSessionFinish}
          onCancel={handleSessionCancel}
        />
      </>
    );
  }

  if (sessionMode === "writing") {
    return (
      <>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Activity
        </Button>
        <WritingSpace
          onFinish={handleWritingSessionFinish}
          onCancel={handleSessionCancel}
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen && sessionMode === "form") {
        // User closed the dialog after finishing a session, reset
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {sessionMode === "form" ? "Finish & Log Activity" : "Log Learning Activity"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Evidence Source Badge (shown when from learning space) */}
          {evidenceSource === "observed_in_proof" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Observed in PROOF — This activity was completed in a PROOF Learning Space
              </span>
            </div>
          )}

          {/* Activity Type - only show if not from learning space */}
          {sessionMode !== "form" && (
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <div className="flex flex-wrap gap-2">
                {activityTypes.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={type === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTypeSelect(value as Activity["type"])}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
              {(type === "code" || type === "document") && sessionMode === "none" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Selecting {type === "code" ? "Code Work" : "Document/Writing"} will open a dedicated learning space where PROOF can observe your process.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What did you work on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you did and what you learned..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {file ? file.name : "Choose File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".txt,.md,.js,.ts,.py,.java,.c,.cpp,.html,.css,.json,.xml"
              />
            </div>
          </div>

          {/* Content (for code/text) */}
          {(type === "code" || file || sessionMode === "form") && (
            <div className="space-y-2">
              <Label htmlFor="content">Code/Content (optional)</Label>
              <Textarea
                id="content"
                placeholder="Paste your code or relevant content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="How long did you spend?"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
            <Label>Skills Practiced</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Button
                  key={skill.id}
                  type="button"
                  variant={selectedSkills.includes(skill.name) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSkills(prev => 
                      prev.includes(skill.name) 
                        ? prev.filter(s => s !== skill.name)
                        : [...prev, skill.name]
                    );
                  }}
                >
                  {skill.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Learning Signals Display (if from learning space) */}
          {sessionData.signals && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div className="text-sm font-medium">Observed Learning Signals</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {sessionData.signals.edit_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edit cycles:</span>
                    <span>{sessionData.signals.edit_count}</span>
                  </div>
                )}
                {sessionData.signals.run_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code runs:</span>
                    <span>{sessionData.signals.run_count}</span>
                  </div>
                )}
                {sessionData.signals.error_correction_cycles !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error corrections:</span>
                    <span>{sessionData.signals.error_correction_cycles}</span>
                  </div>
                )}
                {sessionData.signals.revision_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revisions:</span>
                    <span>{sessionData.signals.revision_count}</span>
                  </div>
                )}
                {sessionData.signals.session_duration_seconds !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session time:</span>
                    <span>{Math.floor(sessionData.signals.session_duration_seconds / 60)}m</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Analysis
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze with AI"
                )}
              </Button>
            </div>
            {aiInsights && (
              <p className="text-sm text-muted-foreground">{aiInsights}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setOpen(false);
              if (sessionMode === "form") resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {sessionMode === "form" ? "Finish & Log Activity" : "Log Activity"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
