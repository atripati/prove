import { Eye, Code, FileText, Beaker, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Eye,
    title: "Passive Observation",
    description: "PROOF watches how you learn without interrupting your workflow. Edit code, write documents, solve problems—we observe the process, not the answers.",
    color: "bg-skill-blue/10 text-skill-blue",
  },
  {
    icon: Code,
    title: "Multi-Tool Integration",
    description: "Connect VS Code, Google Docs, Word, and more. PROOF works where you work, tracking evolution across all your learning activities.",
    color: "bg-skill-purple/10 text-skill-purple",
  },
  {
    icon: Beaker,
    title: "Growth Detection",
    description: "We analyze patterns over time: reduced debugging cycles, improved explanations, more independent problem-solving. Growth matters more than correctness.",
    color: "bg-skill-pink/10 text-skill-pink",
  },
  {
    icon: Shield,
    title: "Privacy-First Design",
    description: "You control your data. Explicit opt-in for everything. No hidden monitoring. Share only what you choose, when you choose.",
    color: "bg-skill-orange/10 text-skill-orange",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            How PROOF Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligent observation meets transparent analysis. 
            We help you understand and demonstrate your learning journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-card border border-border p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn("inline-flex p-3 rounded-xl mb-4", feature.color)}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Process flow */}
        <div className="mt-16 rounded-2xl bg-card border border-border p-8">
          <h3 className="font-display text-2xl font-semibold text-center mb-8">
            The PROOF Pipeline
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {[
              { step: "1", label: "Connect Tools", sublabel: "VS Code, Docs, etc." },
              { step: "2", label: "Learn Naturally", sublabel: "Work as you always do" },
              { step: "3", label: "Observe Patterns", sublabel: "AI analyzes growth" },
              { step: "4", label: "Generate Proof", sublabel: "Share when ready" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full gradient-growth flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
                    {item.step}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.sublabel}</span>
                </div>
                {index < 3 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
