import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, TrendingUp, CheckCircle } from "lucide-react";
import { useProofCards } from "@/hooks/useProofCards";
import { useSkills, Skill } from "@/hooks/useSkills";
import { useActivities } from "@/hooks/useActivities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GenerateProofCardProps {
  skill?: Skill;
  onGenerated?: () => void;
}

export function GenerateProofCard({ skill, onGenerated }: GenerateProofCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(skill || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  
  const { skills } = useSkills();
  const { activities } = useActivities();
  const { createProofCard } = useProofCards();

  const getSkillActivities = (skillName: string) => {
    return activities.filter(a => 
      a.skills_practiced?.includes(skillName)
    ).slice(0, 10);
  };

  const generateCard = async () => {
    if (!selectedSkill) {
      toast({
        title: "Select a skill",
        description: "Please select a skill to generate a proof card for.",
        variant: "destructive"
      });
      return;
    }

    const skillActivities = getSkillActivities(selectedSkill.name);
    
    if (skillActivities.length < 2) {
      toast({
        title: "Not enough evidence",
        description: "Log more activities for this skill to generate a proof card.",
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
              insights: a.insights
            })),
            time_period: "Last 30 days"
          }
        }
      });

      if (error) throw error;

      setPreview({
        skill_name: selectedSkill.name,
        category: selectedSkill.category,
        skill_id: selectedSkill.id,
        ...data
      });
      
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate proof card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCard = async () => {
    if (!preview) return;

    const card = await createProofCard({
      skill_id: preview.skill_id,
      skill_name: preview.skill_name,
      category: preview.category,
      evidence_summary: preview.evidence_summary,
      growth_trend: preview.growth_trend,
      confidence_score: preview.confidence_score,
      explanation: preview.explanation
    });

    if (card) {
      setOpen(false);
      setPreview(null);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Proof Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Generate Proof Card</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!preview ? (
            <>
              <p className="text-sm text-muted-foreground">
                Select a skill to generate a verifiable proof card based on your logged activities.
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Preview Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{preview.skill_name}</h3>
                    <p className="text-sm text-muted-foreground">{preview.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(preview.growth_trend)}
                    <span className="text-sm font-medium capitalize">
                      {preview.growth_trend?.replace("_", " ")}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm">{preview.evidence_summary}</p>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(preview.confidence_score || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((preview.confidence_score || 0) * 100)}%
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground border-t pt-3">
                  {preview.explanation}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Back
                </Button>
                <Button onClick={saveCard}>
                  Save Proof Card
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
