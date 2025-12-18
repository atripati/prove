import { ProofCard } from "./ProofCard";

const sampleProofCards = [
  {
    skill: "Recursion & Algorithmic Thinking",
    category: "Computer Science",
    evidence: "Demonstrated consistent improvement in recursive problem-solving over 6 weeks. Refactoring frequency increased 40%, with cleaner base cases and more elegant solutions.",
    trend: "strong" as const,
    confidence: 0.87,
    explanation: "Your tree traversal implementations show a clear pattern of growth—initial stack-based approaches evolved into clean recursive solutions with proper termination conditions.",
  },
  {
    skill: "Scientific Writing",
    category: "Research Methods",
    evidence: "Lab report structure improved significantly. Hypothesis-evidence alignment increased, with clearer methodology descriptions and more precise conclusions.",
    trend: "improving" as const,
    confidence: 0.73,
    explanation: "Revision patterns show you're spending more time on methodology sections and your conclusions now directly reference your data.",
  },
  {
    skill: "Debugging & Problem Diagnosis",
    category: "Software Engineering",
    evidence: "Average debugging time reduced by 35%. Error identification now happens earlier in the cycle, with more systematic isolation techniques.",
    trend: "improving" as const,
    confidence: 0.81,
    explanation: "You're using print statements less and breakpoints more effectively. Your commit messages show better understanding of root causes.",
  },
];

export function ProofCardsShowcase() {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
            PROOF CARDS
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Verifiable Evidence of Growth
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            When you're ready, generate PROOF Cards to share with professors, recruiters, 
            or anyone who needs to understand your capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleProofCards.map((card, index) => (
            <ProofCard
              key={card.skill}
              {...card}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            PROOF Cards are AI-generated summaries with probabilistic confidence scores. 
            They guide human judgment—they don't replace it.
          </p>
        </div>
      </div>
    </section>
  );
}
