import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Shield, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label as UILabel } from "@/components/ui/label";

const FinancialTools = () => {
  const readinessScore = 78;
  const guarantors = 3;
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleExploreLoan = () => {
    toast({
      title: "Loan Matching",
      description: "Connecting you with microfinance institutions...",
    });
  };

  const handleSafetyGuidelines = () => {
    toast({
      title: "Safety Alert",
      description: "Opening weather safety guidelines...",
    });
  };

  const handleAddCoverage = () => {
    toast({
      title: "Insurance",
      description: "Adding pest epidemic coverage to your plan...",
    });
  };

  const [creditMethod, setCreditMethod] = useState<'input'|'cash'>('input');

  const handleFindMatch = () => {
    toast({
      title: "Finding Your Match",
      description: `Searching MFIs for ${creditMethod === 'input' ? 'input-on-credit' : 'cash'} offers...`,
    });
  };

  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [guarantorInput, setGuarantorInput] = useState("");
  const [currentGuarantors, setCurrentGuarantors] = useState(["Grace Kimani", "Otieno Oluoch", "Beatrice Chumba"]); // Demo names

  const handleInviteGuarantor = () => {
    setGuarantorDialogOpen(false);
    toast({ title: "Referral sent!", description: "Your network will grow once the new guarantor accepts.", variant: "success" });
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Financial Resilience Hub
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access microfinance, build your credit score, and protect your crops with parametric insurance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Readiness Score */}
            <Card className="shadow-elevated border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Financial Readiness Score
                </CardTitle>
                <CardDescription>
                  AI-powered score based on transaction history, climate data, and social collateral
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Your Score</span>
                    <span className="text-3xl font-bold text-primary">{readinessScore}/100</span>
                  </div>
                  <Progress value={readinessScore} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <span className="text-sm text-muted-foreground">Transaction History</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">Excellent</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <span className="text-sm text-muted-foreground">Climate Risk Assessment</span>
                    <Badge className="bg-accent/10 text-accent border-accent/20">Moderate</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <span className="text-sm text-muted-foreground">Social Collateral</span>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{currentGuarantors.length}/4 Guarantors</span>
                      <Dialog open={guarantorDialogOpen} onOpenChange={setGuarantorDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="xs" variant="default">Invite Guarantor</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite a Guarantor</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <input
                              className="w-full border rounded px-2 py-1"
                              placeholder="Phone or Email"
                              value={guarantorInput}
                              onChange={e => setGuarantorInput(e.target.value)}
                            />
                            <Button className="w-full" disabled={!guarantorInput} onClick={handleInviteGuarantor}>
                              Send Referral
                            </Button>
                            <div className="text-xs text-muted-foreground">More guarantors = higher Score & trust. Microfinance uses this when evaluating your loan risk.</div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                {/* Display current guarantor names below */}
                {currentGuarantors.map((g, idx) => (
                  <div key={idx} className="ml-8 text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" /> <span>{g}</span>
                  </div>
                ))}
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Credit Application Choice</div>
                  <RadioGroup value={creditMethod} onValueChange={(v)=>setCreditMethod(v as any)} className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="input" id="credit-input" />
                        <UILabel htmlFor="credit-input">Input on credit</UILabel>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Seeds/fertilizer/inputs financed.</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="credit-cash" />
                        <UILabel htmlFor="credit-cash">Cash</UILabel>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Direct cash disbursement.</div>
                    </div>
                  </RadioGroup>
                  <div className="text-xs text-muted-foreground">Selected: <span className="font-medium">{creditMethod === 'input' ? 'Input on credit' : 'Cash'}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Parametric Insurance */}
            <Card className="shadow-elevated border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Parametric Crop Insurance
                </CardTitle>
                <CardDescription>
                  Automatic payouts for hail damage and pest epidemic recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground">Active Coverage</h4>
                      <p className="text-sm text-muted-foreground">Hailstorm Protection Plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Coverage Amount</p>
                      <p className="text-lg font-bold text-foreground">KES 50,000</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Premium</p>
                      <p className="text-lg font-bold text-foreground">KES 800/mo</p>
                    </div>
                  </div>
                </div>

                {/* Risk Alert */}
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Weather Risk Alert</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Hailstorm forecast in your area within 48 hours. Consider protective measures.
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={handleSafetyGuidelines}
                      >
                        View Safety Guidelines
                      </Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleAddCoverage}>
                  Add Pest Epidemic Coverage
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Microfinance Matching Info */}
          <Card className="mt-6 shadow-soft bg-gradient-earth text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Need Capital for Growth?</h3>
                  <p className="text-white/90">
                    Get matched with vetted Microfinance Institutions based on your readiness score
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="whitespace-nowrap"
                  onClick={handleFindMatch}
                >
                  Find Your Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FinancialTools;
