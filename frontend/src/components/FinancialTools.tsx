import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label as UILabel } from "@/components/ui/label";

const FinancialTools = () => {
  const [readinessScore, setReadinessScore] = useState<number>(78);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [interestRate, setInterestRate] = useState<number | null>(null);
  const [recommendedLoanAmount, setRecommendedLoanAmount] = useState<number | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
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

  

  useEffect(() => {
    // Load latest credit analysis (from backend or localStorage)
    const primeUserId = async (): Promise<string | undefined> => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        try { if (!localStorage.getItem('userId')) localStorage.setItem('userId', uid); } catch {}
        return uid;
      }
      const local = localStorage.getItem('userId') || undefined;
      return local;
    };

    const loadFromBackend = async (): Promise<boolean> => {
      const uid = await primeUserId();
      if (!uid) return;
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/credit-analysis/${uid}`);
        const json = await resp.json();
        if (json.success && json.data?.creditAnalysis) {
          const ca = json.data.creditAnalysis;
          setCreditScore(ca.creditScore ?? null);
          setReadinessScore(ca.financialReadiness ?? (typeof ca.creditScore === 'number' ? Math.round(ca.creditScore) : 0));
          setStrengths(ca.strengths || []);
          setWeaknesses(ca.weaknesses || []);
          setInterestRate(ca.interestRate ?? null);
          setRecommendedLoanAmount(ca.recommendedLoanAmount ?? null);
          return true;
        }
      } catch {}
      return false;
    };

    const loadFromLocal = () => {
      try {
        const raw = localStorage.getItem('creditAnalysis');
        if (!raw) return;
        const ca = JSON.parse(raw);
        setCreditScore(ca.creditScore ?? null);
        setReadinessScore(ca.financialReadiness ?? (typeof ca.creditScore === 'number' ? Math.round(ca.creditScore) : 0));
        setStrengths(ca.strengths || []);
        setWeaknesses(ca.weaknesses || []);
        setInterestRate(ca.interestRate ?? null);
        setRecommendedLoanAmount(ca.recommendedLoanAmount ?? null);
      } catch {}
    };

    const requestFreshAnalysisAggregatingRecords = async () => {
      try {
        setLoadingAnalysis(true);
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || localStorage.getItem('userId');
        if (!uid) return;
        const { data } = await supabase
          .from('farm_records')
          .select('type,amount')
          .eq('user_id', uid);
        let inflows = 0, outflows = 0, inflowCount = 0;
        for (const r of (data || []) as any[]) {
          if (r.type === 'income') { inflows += Number(r.amount) || 0; inflowCount += 1; }
          if (r.type === 'expense') { outflows += Number(r.amount) || 0; }
        }
        const body = {
          farmData: { farmSize: 1, farmType: 'maize', yearsExperience: 1 },
          financialData: { annualRevenue: inflows, assetsValue: 0, existingDebt: 0, financialReadiness: 5 },
          locationData: { region: 'Unknown', country: 'Kenya' },
          mpesaData: { total_inflows: inflows, total_outflows: outflows, inflow_count: inflowCount }
        };
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/credit-analysis/${uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const json = await resp.json();
        if (json.success && json.data?.creditAnalysis) {
          const ca = json.data.creditAnalysis;
          setCreditScore(ca.creditScore ?? null);
          setReadinessScore(ca.financialReadiness ?? (typeof ca.creditScore === 'number' ? Math.round(ca.creditScore) : 0));
          setStrengths(ca.strengths || []);
          setWeaknesses(ca.weaknesses || []);
          setInterestRate(ca.interestRate ?? null);
          setRecommendedLoanAmount(ca.recommendedLoanAmount ?? null);
          try { localStorage.setItem('creditAnalysis', JSON.stringify(ca)); } catch {}
        }
      } finally {
        setLoadingAnalysis(false);
      }
    };

    (async () => {
      const ok = await loadFromBackend();
      if (!ok) {
        loadFromLocal();
        await requestFreshAnalysisAggregatingRecords();
      }
    })();
  }, []);

  const refreshAnalysis = async () => {
    try {
      setLoadingAnalysis(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || localStorage.getItem('userId');
      if (!uid) return;
      const { data } = await supabase
        .from('farm_records')
        .select('type,amount')
        .eq('user_id', uid);
      let inflows = 0, outflows = 0, inflowCount = 0;
      for (const r of (data || []) as any[]) {
        if (r.type === 'income') { inflows += Number(r.amount) || 0; inflowCount += 1; }
        if (r.type === 'expense') { outflows += Number(r.amount) || 0; }
      }
      const body = {
        farmData: { farmSize: 1, farmType: 'maize', yearsExperience: 1 },
        financialData: { annualRevenue: inflows, assetsValue: 0, existingDebt: 0, financialReadiness: 5 },
        locationData: { region: 'Unknown', country: 'Kenya' },
        mpesaData: { total_inflows: inflows, total_outflows: outflows, inflow_count: inflowCount }
      };
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/credit-analysis/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (json.success && json.data?.creditAnalysis) {
        const ca = json.data.creditAnalysis;
        setCreditScore(ca.creditScore ?? null);
        setReadinessScore(ca.financialReadiness ?? (typeof ca.creditScore === 'number' ? Math.round(ca.creditScore) : 0));
        setStrengths(ca.strengths || []);
        setWeaknesses(ca.weaknesses || []);
        setInterestRate(ca.interestRate ?? null);
        setRecommendedLoanAmount(ca.recommendedLoanAmount ?? null);
        try { localStorage.setItem('creditAnalysis', JSON.stringify(ca)); } catch {}
        toast({ title: 'Credit analysis updated' });
      }
    } catch (e: any) {
      toast({ title: 'Failed to update credit analysis', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingAnalysis(false);
    }
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
                  Financial Readiness
                </CardTitle>
                <CardDescription>
                  Derived from your AI credit analysis and records
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

                {/* Simplified: no guarantors or mock badges; values come from AI */}
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

                {creditScore !== null && (
                  <div className="p-4 rounded-lg bg-background border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold">AI Credit Score</div>
                        <div className="text-muted-foreground">Recommended loan and rate based on your data</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{creditScore}</div>
                        {interestRate !== null && (
                          <div className="text-xs text-muted-foreground">Rate: {interestRate}%</div>
                        )}
                      </div>
                    </div>
                    {(strengths.length > 0 || weaknesses.length > 0) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!!strengths.length && (
                          <div className="p-3 rounded border bg-green-50/40">
                            <div className="font-medium text-green-800">Why you qualify</div>
                            <ul className="list-disc ml-5 text-sm text-green-900 mt-1">
                              {strengths.slice(0, 5).map((s, i) => (<li key={i}>{s}</li>))}
                            </ul>
                          </div>
                        )}
                        {!!weaknesses.length && (
                          <div className="p-3 rounded border bg-amber-50/40">
                            <div className="font-medium text-amber-800">What to improve</div>
                            <ul className="list-disc ml-5 text-sm text-amber-900 mt-1">
                              {weaknesses.slice(0, 5).map((w, i) => (<li key={i}>{w}</li>))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {recommendedLoanAmount !== null && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium">Recommended Loan:</span> ${recommendedLoanAmount.toLocaleString()}
                      </div>
                    )}
                    {!!strengths.length && (
                      <div className="mt-3 text-sm">
                        <div className="font-medium">Strengths</div>
                        <ul className="list-disc ml-5 text-muted-foreground">
                          {strengths.slice(0, 3).map((s, i) => (<li key={i}>{s}</li>))}
                        </ul>
                      </div>
                    )}
                    {!!weaknesses.length && (
                      <div className="mt-3 text-sm">
                        <div className="font-medium">Areas to Improve</div>
                        <ul className="list-disc ml-5 text-muted-foreground">
                          {weaknesses.slice(0, 3).map((w, i) => (<li key={i}>{w}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
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
              <div className="mt-4 text-sm text-white/90">
                Need help with your credit assessment or loan options? <a href="mailto:support@sproutsell.africa" className="underline font-semibold">Contact Support</a>.
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={refreshAnalysis} disabled={loadingAnalysis}>
                  {loadingAnalysis ? 'Updating...' : 'Refresh Credit Analysis'}
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
