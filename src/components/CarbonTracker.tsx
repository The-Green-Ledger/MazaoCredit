import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leaf, TrendingDown, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CarbonTracker = () => {
  const carbonScore = 11.7;
  const industryAverage = 18.5;
  const reduction = Math.round(((industryAverage - carbonScore) / industryAverage) * 100);

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sustainability Dashboard
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track your carbon footprint and appeal to premium eco-conscious buyers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Carbon Score */}
            <Card className="lg:col-span-2 shadow-elevated border-l-4 border-l-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Leaf className="w-6 h-6 text-secondary" />
                  Your Carbon Score
                </CardTitle>
                <CardDescription>
                  CO₂e emissions per 100kg of produce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-6xl font-bold text-secondary mb-2">
                    {carbonScore}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    kg CO₂e / 100kg produce
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        vs Industry Average ({industryAverage} kg)
                      </span>
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                        {reduction}% Better
                      </Badge>
                    </div>
                    <Progress 
                      value={(carbonScore / industryAverage) * 100} 
                      className="h-3 [&>div]:bg-secondary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Transport</p>
                      <p className="text-2xl font-bold text-foreground">4.2 kg</p>
                      <p className="text-xs text-secondary mt-1">36% of total</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Fertilizer</p>
                      <p className="text-2xl font-bold text-foreground">5.8 kg</p>
                      <p className="text-xs text-accent mt-1">50% of total</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Energy</p>
                      <p className="text-2xl font-bold text-foreground">1.7 kg</p>
                      <p className="text-xs text-primary mt-1">14% of total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights & Achievements */}
            <div className="space-y-6">
              <Card className="shadow-soft bg-gradient-primary text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Eco Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-white/90">
                      You're in the top <span className="font-bold text-xl">15%</span> of sustainable farmers!
                    </p>
                    <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                      <p className="text-xs font-semibold mb-1">Premium Buyer Interest</p>
                      <p className="text-sm text-white/90">
                        3 eco-conscious buyers viewing your listings
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingDown className="w-5 h-5 text-secondary" />
                    Reduction Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Switch to Bio-Fertilizer
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reduce emissions by ~30%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Local Transport
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Save ~15% on carbon score
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CarbonTracker;
