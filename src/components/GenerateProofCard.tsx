import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, TrendingUp, CheckCircle, Lock, AlertCircle, Calendar, FileText, Eye } from "lucide-react";
import { useProofCards } from "@/hooks/useProofCards";
import { useSkills, Skill } from "@/hooks/useSkills";
import { useActivities } from "@/hooks/useActivities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface GenerateProofCardProps {
  skill?: Skill;
  onGenerated?: () => void;
}

interface LockedResponse {
  status: "locked";
  requirements_met: {
    multiple_days: boolean;
    multiple_sessions: boolean;
    observed_evidence: boolean;
    growth_signal: boolean;
    consistency: boolean;
  };
  missing_requirements: string[];
  current_progress: {
    days_count: number;
    sessions_count: number;
    has_observed_evidence: boolean;
  };
  what_would_unlock: string;
  encouragement: string;
}

interface UnlockedResponse {
  status: "unlocked";
  evidence_summary: string;
  growth_trend: string;
  confidence_score: number;
  confidence_level: string;
  explanation: string;
  time_span: string;
  session_count: number;
  observed_growth_trends: string[];
  limitations: string;
}

type ProofCardResponse = LockedResponse | UnlockedResponse;

/**
 * Validate that a response is a properly unlocked card
 * Safe default: treat malformed responses as locked
 */
function isValidUnlockedResponse(response: any): response is UnlockedResponse {
  return (
    response?.status === "unlocked" &&
    typeof response?.evidence_summary === "string" &&
    response.evidence_summary.length > 0 &&
    typeof response?.confidence_score === "number" &&
    response.confidence_score > 0
  );
}

export function GenerateProofCard({ skill, onGenerated }: GenerateProofCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(skill || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProofCardResponse | null>(null);
  
  const { skills } = useSkills();
  const { activities } = useActivities();
  const { createProofCard } = useProofCards();

  const getSkillActivities = (skillName: string) => {
    return activities.filter(a => 
      a.skills_practiced?.includes(skillName)
    ).slice(0, 20); // Get more activities for better analysis
  };

  const generateCard = async () => {
    if (!selectedSkill) {
      toast({
        title: "Select a skill",
        description: "Please select a skill to evaluate for a proof card.",
        variant: "destructive"
      });
      return;
    }

    const skillActivities = getSkillActivities(selectedSkill.name);
    
    if (skillActivities.length < 1) {
      toast({
        title: "No activities found",
        description: "Log activities for this skill to begin building evidence.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-learning", {
        body: {
          type: "generate_proof_card",
          content: {
            skill_name: selectedSkill.name,
            category: selectedSkill.category,
            activities: skillActivities.map(a => ({
              title: a.title,
              description: a.description,
              type: a.type,
              date: a.created_at,
              evidence_source: a.evidence_source,
              learning_signals: a.learning_signals,
              insights: a.insights
            })),
            time_period: "Last 30 days"
          }
        }
      });

      if (error) throw error;

      setResult(data as ProofCardResponse);
      
    } catch (error) {
      console.error("Evaluation error:", error);
      toast({
        title: "Evaluation failed",
        description: "Could not evaluate proof card eligibility. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCard = async () => {
    if (!result || result.status !== "unlocked" || !selectedSkill) return;

    const growthTrend = result.growth_trend as "stable" | "improving" | "strong_improvement";
    
    const card = await createProofCard({
      skill_id: selectedSkill.id,
      skill_name: selectedSkill.name,
      category: selectedSkill.category,
      evidence_summary: result.evidence_summary,
      growth_trend: growthTrend,
      confidence_score: result.confidence_score,
      explanation: result.explanation
    });

    if (card) {
      setOpen(false);
      setResult(null);
      setSelectedSkill(null);
      onGenerated?.();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "strong_improvement":
        return <TrendingUp className="w-4 h-4 text-skill-advanced" />;
      case "improving":
        return <TrendingUp className="w-4 h-4 text-skill-proficient" />;
      default:
        return <CheckCircle className="w-4 h-4 text-skill-developing" />;
    }
  };

  const getRequirementProgress = (locked: LockedResponse) => {
    const met = Object.values(locked.requirements_met).filter(Boolean).length;
    return (met / 5) * 100;
  };

  const renderRequirementStatus = (met: boolean, label: string, icon: React.ReactNode) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-skill-proficient' : 'text-muted-foreground'}`}>
      {met ? <CheckCircle className="w-4 h-4" /> : icon}
      <span className={met ? 'line-through opacity-60' : ''}>{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setResult(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Proof Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Proof Card Evaluation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!result ? (
            <>
              <p className="text-sm text-muted-foreground">
                Select a skill to evaluate. Proof Cards require substantial evidence across multiple days and sessions before they can be unlocked for sharing.
              </p>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => {
                    const activityCount = getSkillActivities(s.name).length;
                    return (
                      <Button
                        key={s.id}
                        type="button"
                        variant={selectedSkill?.id === s.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSkill(s)}
                        className="gap-2"
                      >
                        {s.name}
                        <span className="text-xs opacity-70">({activityCount})</span>
                      </Button>
                    );
                  })}
                </div>
                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add skills and log activities first.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={generateCard} disabled={!selectedSkill || isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Evaluate
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : result.status === "locked" || !isValidUnlockedResponse(result) ? (
            // LOCKED STATE - Show progress and requirements
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Lock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Proof Card Not Yet Available</h3>
                    <p className="text-sm text-muted-foreground">{selectedSkill?.name}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requirements Progress</span>
                    <span className="font-medium">{Object.values(result.requirements_met).filter(Boolean).length}/5</span>
                  </div>
                  <Progress value={getRequirementProgress(result)} className="h-2" />
                </div>

                {/* Requirements Checklist */}
                <div className="space-y-2 py-2">
                  {renderRequirementStatus(
                    result.requirements_met.multiple_days,
                    `3+ distinct days (${result.current_progress.days_count} logged)`,
                    <Calendar className="w-4 h-4" />
                  )}
                  {renderRequirementStatus(
                    result.requirements_met.multiple_sessions,
                    `3+ sessions (${result.current_progress.sessions_count} logged)`,
                    <FileText className="w-4 h-4" />
                  )}
                  {renderRequirementStatus(
                    result.requirements_met.observed_evidence,
                    "Observed process evidence",
                    <Eye className="w-4 h-4" />
                  )}
                  {renderRequirementStatus(
                    result.requirements_met.growth_signal,
                    "Observable growth trend",
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {renderRequirementStatus(
                    result.requirements_met.consistency,
                    "Consistent skill appearance",
                    <CheckCircle className="w-4 h-4" />
                  )}
                </div>

                {/* What's Missing */}
                {result.missing_requirements.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      What's needed:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 pl-6">
                      {result.missing_requirements.map((req, i) => (
                        <li key={i} className="list-disc">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Encouragement */}
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground italic">
                    {result.encouragement}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setResult(null)}>
                  Try Another Skill
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            // UNLOCKED STATE - Show proof card preview
            <div className="space-y-4">
              <div className="rounded-xl border border-skill-proficient/30 bg-skill-proficient/5 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-skill-proficient/10">
                      <CheckCircle className="w-5 h-5 text-skill-proficient" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Proof Card Unlocked</h3>
                      <p className="text-sm text-muted-foreground">{selectedSkill?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(result.growth_trend)}
                    <span className="text-sm font-medium capitalize">
                      {result.growth_trend?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Evidence Info */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{result.session_count} sessions</span>
                  <span>•</span>
                  <span>{result.time_span}</span>
                </div>
                
                {/* Evidence Summary */}
                <p className="text-sm">{result.evidence_summary}</p>

                {/* Growth Trends */}
                {result.observed_growth_trends && result.observed_growth_trends.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Observed Growth:</p>
                    <ul className="text-sm space-y-1">
                      {result.observed_growth_trends.map((trend, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-skill-proficient" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className="text-sm font-medium capitalize px-2 py-0.5 rounded bg-secondary">
                    {result.confidence_level}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-skill-proficient rounded-full" 
                      style={{ width: `${(result.confidence_score || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((result.confidence_score || 0) * 100)}%
                  </span>
                </div>

                {/* Limitations */}
                {result.limitations && (
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    <span className="font-medium">Note:</span> {result.limitations}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setResult(null)}>
                  Back
                </Button>
                <Button onClick={saveCard} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Save Proof Card
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
