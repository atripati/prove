import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { GrowthChart } from "@/components/GrowthChart";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ProofCardEnhanced } from "@/components/ProofCardEnhanced";
import { SkillBadge } from "@/components/SkillBadge";
import { Button } from "@/components/ui/button";
import { ActivityLogger } from "@/components/ActivityLogger";
import { AddSkillDialog } from "@/components/AddSkillDialog";
import { GenerateProofCard } from "@/components/GenerateProofCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSkills } from "@/hooks/useSkills";
import { useActivities } from "@/hooks/useActivities";
import { useProofCards } from "@/hooks/useProofCards";
import { 
  TrendingUp, Clock, Code, Award, Settings, Bell, Loader2
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { skills, loading: skillsLoading, refetch: refetchSkills } = useSkills();
  const { activities, loading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { proofCards, loading: cardsLoading, toggleShare, refetch: refetchCards } = useProofCards();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = skillsLoading || activitiesLoading || cardsLoading;

  // Calculate stats
  const totalHours = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / 60;
  const growthScore = skills.length > 0 
    ? Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length)
    : 0;

  // Generate growth data from activities
  const growthData = generateGrowthData(activities);

  // Transform activities for feed
  const feedActivities = activities.slice(0, 5).map(a => ({
    id: a.id,
    type: a.type as "code" | "document" | "commit" | "review",
    title: a.title,
    description: a.description || "",
    timestamp: formatTimeAgo(a.created_at),
    skillsDetected: a.skills_practiced || []
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16">
        <header className="border-b border-border bg-card/50">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-semibold">
                  Welcome back, {profile?.display_name || "Student"}
                </h1>
                <p className="text-muted-foreground">Your learning journey at a glance</p>
              </div>
              <div className="flex items-center gap-3">
                <ActivityLogger onActivityAdded={() => { refetchActivities(); refetchSkills(); }} />
                <Button variant="outline" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Learning Hours" value={Math.round(totalHours).toString()} subtitle="Total tracked" icon={Clock} />
                <StatCard title="Skills Tracked" value={skills.length.toString()} subtitle="Active skills" icon={Code} />
                <StatCard title="Growth Score" value={growthScore.toString()} subtitle="Average progress" icon={TrendingUp} />
                <StatCard title="Proof Cards" value={proofCards.length.toString()} subtitle="Generated" icon={Award} />
              </div>

              {/* Skills section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold">Active Skills</h2>
                  <AddSkillDialog onSkillAdded={refetchSkills} />
                </div>
                <div className="flex flex-wrap gap-3">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <SkillBadge 
                        key={skill.id} 
                        name={skill.name} 
                        level={skill.level} 
                        progress={skill.progress / 100} 
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No skills tracked yet. Add your first skill!</p>
                  )}
                </div>
              </div>

              {/* Main grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <GrowthChart data={growthData} title="Overall Growth Trajectory" />
                </div>
                <ActivityFeed activities={feedActivities} />

                {/* Proof cards section */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold">Proof Cards</h2>
                    <GenerateProofCard onGenerated={refetchCards} />
                  </div>
                  {proofCards.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {proofCards.map((card) => (
                        <ProofCardEnhanced
                          key={card.id}
                          id={card.id}
                          skill={card.skill_name}
                          category={card.category}
                          evidence={card.evidence_summary}
                          trend={card.growth_trend === "strong_improvement" ? "strong" : card.growth_trend === "improving" ? "improving" : "stable"}
                          confidence={card.confidence_score}
                          explanation={card.explanation}
                          isShared={card.is_shared}
                          shareToken={card.share_token}
                          createdAt={card.created_at}
                          onToggleShare={toggleShare}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No proof cards yet. Log activities and generate your first card!</p>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function generateGrowthData(activities: any[]) {
  const weeks: { [key: string]: number } = {};
  
  activities.forEach(a => {
    const date = new Date(a.created_at);
    const weekNum = getWeekNumber(date);
    weeks[weekNum] = (weeks[weekNum] || 0) + 1;
  });

  const sortedWeeks = Object.entries(weeks).sort(([a], [b]) => parseInt(a) - parseInt(b)).slice(-8);
  
  if (sortedWeeks.length === 0) {
    return [{ date: "Week 1", score: 0 }];
  }

  let cumulative = 0;
  return sortedWeeks.map(([week, count], i) => {
    cumulative += count * 10;
    return { date: `Week ${i + 1}`, score: Math.min(cumulative, 100) };
  });
}

function getWeekNumber(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  return `${date.getFullYear()}-${Math.ceil((days + 1) / 7)}`;
}
