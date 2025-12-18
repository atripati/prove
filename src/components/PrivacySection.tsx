import { Shield, Lock, Eye, UserCheck, FileX, AlertCircle } from "lucide-react";

const principles = [
  {
    icon: Lock,
    title: "Students Own Their Data",
    description: "Your learning data belongs to you. Export it, delete it, or share it—the choice is always yours.",
  },
  {
    icon: Eye,
    title: "Process, Not Answers",
    description: "We analyze how you learn, not what you produce. The journey matters more than the destination.",
  },
  {
    icon: AlertCircle,
    title: "Probabilistic, Not Verdicts",
    description: "Our outputs are confidence scores and trends—guidance for human judgment, not automated decisions.",
  },
  {
    icon: UserCheck,
    title: "Explicit Opt-In",
    description: "Every integration requires your clear consent. No hidden monitoring, no surprise data collection.",
  },
  {
    icon: FileX,
    title: "No Raw Storage",
    description: "We don't store your actual work. Only learning-relevant patterns and growth signals are retained.",
  },
  {
    icon: Shield,
    title: "Explainable AI",
    description: "Every inference comes with a clear explanation of why—no black boxes, no mysterious scores.",
  },
];

export function PrivacySection() {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Privacy & Ethics
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Trust Through Transparency
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PROOF is built on principles that put students first. 
            We believe learning technology should support growth, not surveil it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className="rounded-xl bg-card border border-border p-6 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-2 rounded-lg bg-primary/10 inline-block mb-3">
                <principle.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{principle.title}</h3>
              <p className="text-sm text-muted-foreground">{principle.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
