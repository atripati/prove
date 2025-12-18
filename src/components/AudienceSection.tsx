import { GraduationCap, Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const audiences = [
  {
    icon: GraduationCap,
    title: "For Students",
    description: "Build a verifiable portfolio of your learning journey. Understand your growth, identify areas for improvement, and share evidence of your skills when it matters.",
    benefits: [
      "Personal growth insights",
      "Skill development tracking",
      "Shareable proof cards",
      "Privacy-controlled sharing",
    ],
    color: "from-skill-blue to-skill-purple",
  },
  {
    icon: Users,
    title: "For Professors",
    description: "See evidence of authentic learning beyond test scores. Identify students who need support and those who are excelling. Reduce reliance on high-stakes assessments.",
    benefits: [
      "Authentic learning signals",
      "Early intervention insights",
      "Fair assessment support",
      "Reduced grading burden",
    ],
    color: "from-skill-purple to-skill-pink",
  },
  {
    icon: Briefcase,
    title: "For Recruiters",
    description: "Go beyond resumes and GPAs. Understand how candidates actually think, learn, and solve problems. See growth trajectories, not just final achievements.",
    benefits: [
      "Process over outcomes",
      "Growth trajectory analysis",
      "Skill verification",
      "Learning style insights",
    ],
    color: "from-skill-pink to-skill-orange",
  },
];

export function AudienceSection() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Built for Everyone in Education
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PROOF creates a trust layer between students, educators, and employers—
            making learning visible and verifiable.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div
              key={audience.title}
              className="rounded-2xl bg-card border border-border overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn("h-2 bg-gradient-to-r", audience.color)} />
              <div className="p-8">
                <div className="p-3 rounded-xl bg-secondary inline-block mb-4">
                  <audience.icon className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {audience.description}
                </p>
                <ul className="space-y-2">
                  {audience.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
