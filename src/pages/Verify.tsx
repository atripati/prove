import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, CheckCircle, AlertCircle, TrendingUp, Minus, 
  Calendar, FileText, Eye, Loader2, Search, ExternalLink,
  Lock, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedCard {
  id: string;
  skill_name: string;
  category: string;
  evidence_summary: string;
  growth_trend: string;
  confidence_score: number;
  explanation: string;
  created_at: string;
  is_shared: boolean;
}

export default function Verify() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  
  const [token, setToken] = useState(tokenFromUrl || "");
  const [card, setCard] = useState<VerifiedCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      verifyCard(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyCard = async (verifyToken: string) => {
    if (!verifyToken.trim()) {
      setError("Please enter a verification token");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: dbError } = await supabase
        .from("proof_cards")
        .select("id, skill_name, category, evidence_summary, growth_trend, confidence_score, explanation, created_at, is_shared")
        .eq("share_token", verifyToken.trim())
        .eq("is_shared", true)
        .single();

      if (dbError || !data) {
        setCard(null);
        setError("No valid Proof Card found for this token. The card may have been unshared or the token is incorrect.");
      } else {
        setCard(data as VerifiedCard);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("An error occurred while verifying. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCard(token);
  };

  const getTrendConfig = (trend: string) => {
    switch (trend) {
      case "strong_improvement":
        return { icon: TrendingUp, label: "Strong Improvement", color: "text-skill-advanced bg-skill-advanced/10" };
      case "improving":
        return { icon: TrendingUp, label: "Improving", color: "text-skill-proficient bg-skill-proficient/10" };
      default:
        return { icon: Minus, label: "Stable", color: "text-muted-foreground bg-muted" };
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.5) return "Developing";
    if (score >= 0.3) return "Emerging";
    return "Early Evidence";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold">PROOF Verification</h1>
              <p className="text-muted-foreground text-sm">Verify the authenticity of a Proof Card</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Enter Verification Token</CardTitle>
            <CardDescription>
              Paste the token shared with you to verify a student's Proof Card
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                className="flex-1 font-mono text-sm"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {searched && (
          <>
            {error ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-destructive">
                    <Lock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Verification Failed</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : card ? (
              <div className="space-y-6">
                {/* Verified Badge */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Verified Proof Card</p>
                    <p className="text-sm text-muted-foreground">
                      This Proof Card is authentic and was generated by PROOF's AI system based on observed learning evidence.
                    </p>
                  </div>
                </div>

                {/* Card Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">{card.category}</Badge>
                        <CardTitle className="text-xl font-display">{card.skill_name}</CardTitle>
                      </div>
                      {(() => {
                        const trend = getTrendConfig(card.growth_trend);
                        const TrendIcon = trend.icon;
                        return (
                          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium", trend.color)}>
                            <TrendIcon className="w-4 h-4" />
                            {trend.label}
                          </div>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Evidence Summary */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Evidence Summary
                      </h4>
                      <p className="text-muted-foreground">{card.evidence_summary}</p>
                    </div>

                    {/* Confidence */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        Confidence Level
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all" 
                            style={{ width: `${card.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {getConfidenceLabel(card.confidence_score)} ({Math.round(card.confidence_score * 100)}%)
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">AI Explanation</h4>
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-4">
                        "{card.explanation}"
                      </p>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                      <Calendar className="w-4 h-4" />
                      Generated on {new Date(card.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notes for Verifiers */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Important Notes for Verifiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>What this means:</strong> This Proof Card was generated based on observed learning behavior 
                      across multiple sessions over time, not a single test or assignment.
                    </p>
                    <p>
                      <strong>Confidence interpretation:</strong> PROOF uses conservative, probabilistic language. 
                      "Emerging" or "Developing" confidence reflects honest uncertainty, not weakness.
                    </p>
                    <p>
                      <strong>Evidence sources:</strong> PROOF distinguishes between directly observed learning 
                      (in-app coding/writing sessions) and student-submitted evidence. Higher confidence requires 
                      observed process evidence.
                    </p>
                    <p>
                      <strong>Not a grade:</strong> Proof Cards describe observed growth patterns, not competency 
                      levels or final evaluations. They complement, not replace, traditional assessment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </>
        )}

        {/* Information when no search yet */}
        {!searched && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">For Professors and Recruiters</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    When a student shares a Proof Card with you, they'll provide a verification token. 
                    Enter it above to verify the card's authenticity and view the evidence summary.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Authentic verification
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Process-based evidence
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Privacy-respecting
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>PROOF — Privacy-first proof of learning</p>
            <div className="flex items-center gap-4">
              <a href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                Learn more about PROOF
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
