import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Mail } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 gradient-growth opacity-90" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          
          {/* Content */}
          <div className="relative z-10 p-12 md:p-16 text-center text-primary-foreground">
            <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
              Ready to Build Your Proof?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Join the pilot program and help shape the future of learning verification. 
              PROOF is free for students during the beta period.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="secondary" size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Join the Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="glass" size="lg" className="text-primary-foreground border-primary-foreground/20">
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-primary-foreground/20">
              <p className="text-sm opacity-70">
                PROOF is open source. Contribute on GitHub.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
