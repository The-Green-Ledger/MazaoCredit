import { Button } from "@/components/ui/button";
import { Sprout, TrendingUp, Shield, Leaf } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo & Badge */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-2xl shadow-glow">
              <Sprout className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sprout & Sell
            </h1>
          </div>

          <p className="text-2xl md:text-3xl font-semibold text-foreground">
            From Seed to Sale, on Any Device
          </p>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The unified AgriTech platform connecting small-scale farmers directly to markets 
            with critical financial, risk, and sustainability tools for maximum resilience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              className="text-lg px-8 shadow-elevated hover:shadow-glow transition-all"
              onClick={() => window.location.href = '/dashboard'}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 border-2 hover:bg-primary/5 transition-all"
              onClick={() => window.location.href = '/marketplace'}
            >
              Explore Marketplace
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 pt-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft border border-border">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Market Access</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft border border-border">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">Crop Insurance</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft border border-border">
              <Leaf className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">Carbon Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
