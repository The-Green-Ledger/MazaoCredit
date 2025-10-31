import { Button } from "@/components/ui/button";
import { Sprout, TrendingUp, Shield, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-farmer.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/90 to-secondary/30" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <Leaf className="absolute top-1/4 right-20 w-20 h-20 text-primary/20 animate-bounce" style={{ animationDuration: '3s' }} />
        <Leaf className="absolute bottom-1/3 left-32 w-16 h-16 text-secondary/20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo & Badge */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-2xl shadow-glow">
              <Sprout className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mazao Credit
            </h1>
          </div>

          <p className="text-2xl md:text-3xl font-semibold text-foreground animate-fade-in">
            Shamba lako <span className="text-primary animate-pulse">banki yako</span>
          </p>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Credit scoring and finance tools tailored for smallholder farmers, leveraging yield data and weather insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in">
            <Button 
              size="lg" 
              className="text-lg px-8 shadow-elevated hover:shadow-glow transition-all"
              onClick={() => navigate('/dashboard')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 border-2 hover:bg-primary/5 transition-all"
              onClick={() => navigate('/marketplace')}
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
