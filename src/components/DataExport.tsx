import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileJson, FileText, Loader2, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface ExportOptions {
  profile: boolean;
  skills: boolean;
  activities: boolean;
  proofCards: boolean;
  learningSignals: boolean;
}

export function DataExport() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    profile: true,
    skills: true,
    activities: true,
    proofCards: true,
    learningSignals: true,
  });

  const handleExport = async (format: "json" | "readable") => {
    if (!user) return;

    setIsExporting(true);
    try {
      const exportData: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        format_version: "1.0",
        data_ownership_notice: "This data belongs to you. PROOF stores it on your behalf and you may export or delete it at any time.",
      };

      // Fetch all selected data
      if (options.profile) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        exportData.profile = data;
      }

      if (options.skills) {
        const { data } = await supabase
          .from("skills")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        exportData.skills = data;
      }

      if (options.activities) {
        const { data } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        // Separate learning signals if requested separately
        if (options.learningSignals) {
          exportData.activities = data;
        } else {
          // Remove learning signals from activities
          exportData.activities = data?.map(a => {
            const { learning_signals, ...rest } = a;
            return rest;
          });
        }
      }

      if (options.proofCards) {
        const { data } = await supabase
          .from("proof_cards")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        exportData.proof_cards = data;
      }

      // Generate export
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(exportData, null, 2);
        filename = `proof-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
      } else {
        content = generateReadableExport(exportData);
        filename = `proof-export-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = "text/plain";
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Your data has been exported to ${filename}`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateReadableExport = (data: Record<string, unknown>): string => {
    let output = "═══════════════════════════════════════════════════════════════\n";
    output += "                    PROOF DATA EXPORT\n";
    output += "═══════════════════════════════════════════════════════════════\n\n";
    output += `Exported: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
    output += "This data belongs to you. PROOF stores it on your behalf.\n\n";

    if (data.profile) {
      const profile = data.profile as Record<string, unknown>;
      output += "───────────────────────────────────────────────────────────────\n";
      output += "PROFILE\n";
      output += "───────────────────────────────────────────────────────────────\n";
      output += `Name: ${profile.display_name || "Not set"}\n`;
      output += `Email: ${profile.email || "Not set"}\n`;
      output += `University: ${profile.university || "Not set"}\n`;
      output += `Major: ${profile.major || "Not set"}\n`;
      output += `Year: ${profile.year_of_study || "Not set"}\n\n`;
    }

    if (data.skills && Array.isArray(data.skills)) {
      output += "───────────────────────────────────────────────────────────────\n";
      output += `SKILLS (${data.skills.length} tracked)\n`;
      output += "───────────────────────────────────────────────────────────────\n";
      data.skills.forEach((skill: any) => {
        output += `• ${skill.name} (${skill.category})\n`;
        output += `  Level: ${skill.level} | Progress: ${skill.progress}%\n`;
        output += `  Practice Hours: ${skill.practice_hours || 0}\n\n`;
      });
    }

    if (data.activities && Array.isArray(data.activities)) {
      output += "───────────────────────────────────────────────────────────────\n";
      output += `ACTIVITIES (${data.activities.length} logged)\n`;
      output += "───────────────────────────────────────────────────────────────\n";
      data.activities.forEach((activity: any) => {
        output += `\n[${new Date(activity.created_at).toLocaleDateString()}] ${activity.title}\n`;
        output += `Type: ${activity.type} | Source: ${activity.evidence_source}\n`;
        if (activity.description) output += `Description: ${activity.description}\n`;
        if (activity.skills_practiced?.length) {
          output += `Skills: ${activity.skills_practiced.join(", ")}\n`;
        }
        if (activity.learning_signals) {
          output += `Learning Signals: ${JSON.stringify(activity.learning_signals)}\n`;
        }
      });
      output += "\n";
    }

    if (data.proof_cards && Array.isArray(data.proof_cards)) {
      output += "───────────────────────────────────────────────────────────────\n";
      output += `PROOF CARDS (${data.proof_cards.length} generated)\n`;
      output += "───────────────────────────────────────────────────────────────\n";
      data.proof_cards.forEach((card: any) => {
        output += `\n[${new Date(card.created_at).toLocaleDateString()}] ${card.skill_name}\n`;
        output += `Category: ${card.category}\n`;
        output += `Trend: ${card.growth_trend} | Confidence: ${Math.round(card.confidence_score * 100)}%\n`;
        output += `Evidence: ${card.evidence_summary}\n`;
        output += `Explanation: ${card.explanation}\n`;
        if (card.is_shared) {
          output += `Shared: Yes (Token: ${card.share_token})\n`;
        }
      });
    }

    output += "\n═══════════════════════════════════════════════════════════════\n";
    output += "                    END OF EXPORT\n";
    output += "═══════════════════════════════════════════════════════════════\n";

    return output;
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export My Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Export Your Data
          </DialogTitle>
          <DialogDescription>
            Your data belongs to you. Export everything PROOF has stored about your learning journey.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">What to include</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={options.profile} 
                  onCheckedChange={() => toggleOption("profile")}
                />
                <span className="text-sm">Profile information</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={options.skills} 
                  onCheckedChange={() => toggleOption("skills")}
                />
                <span className="text-sm">Skills and progress</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={options.activities} 
                  onCheckedChange={() => toggleOption("activities")}
                />
                <span className="text-sm">All activities</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={options.learningSignals} 
                  onCheckedChange={() => toggleOption("learningSignals")}
                />
                <span className="text-sm">Learning signals (edit cycles, runs, etc.)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={options.proofCards} 
                  onCheckedChange={() => toggleOption("proofCards")}
                />
                <span className="text-sm">Proof Cards</span>
              </label>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground">
              PROOF does not track keystrokes, screen content, clipboard history, or any information beyond what you explicitly provide.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => handleExport("readable")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Readable (.txt)
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4" />
              )}
              Full Data (.json)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
