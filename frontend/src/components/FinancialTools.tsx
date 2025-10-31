import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FinancialTools = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [interestRate, setInterestRate] = useState<number | null>(null);
  const [recommendedLoanAmount, setRecommendedLoanAmount] = useState<number | null>(null);

  useEffect(() => {
    // Try load last known analysis to display if exists
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'https://mazao-credit-backend.onrender.com'}/api/auth/credit-analysis/${uid}`);
        const json = await resp.json();
        if (json.success && json.data?.creditAnalysis) {
          const ca = json.data.creditAnalysis;
          setScore(typeof ca.creditScore === 'number' ? ca.creditScore : null);
          setInterestRate(typeof ca.interestRate === 'number' ? ca.interestRate : null);
          setRecommendedLoanAmount(typeof ca.recommendedLoanAmount === 'number' ? ca.recommendedLoanAmount : null);
        }
      } catch {}
    })();
  }, []);

  const submitToAI = async () => {
    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        toast({ title: 'Please sign in first', variant: 'destructive' });
        return;
      }

      const farmerData = {
        farmData: { farmSize: parseFloat(landSize || '0'), farmType: 'unknown', yearsExperience: 0 },
        financialData: {},
        locationData: { region: location || 'Unknown', country: 'Kenya' },
        historicalData: {},
        productionData: {},
        profile: { name }
      } as any;

      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'https://mazao-credit-backend.onrender.com'}/api/auth/credit-analysis/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData)
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.message || 'AI analysis failed');

      const ca = json.data.creditAnalysis;
      setScore(ca.creditScore ?? null);
      setInterestRate(ca.interestRate ?? null);
      setRecommendedLoanAmount(ca.recommendedLoanAmount ?? null);

      toast({ title: 'AI score computed', description: `Score: ${Math.round(ca.creditScore)}` });
    } catch (e: any) {
      toast({ title: 'Failed to compute score', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Financial Tools</CardTitle>
              <CardDescription>Enter minimal details to get your AI credit score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <UILabel htmlFor="farmer-name">Name</UILabel>
                  <Input id="farmer-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <UILabel htmlFor="farmer-location">Location (County/Region)</UILabel>
                  <Input id="farmer-location" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Nakuru" />
                </div>
                <div>
                  <UILabel htmlFor="land-size">Land Size (hectares)</UILabel>
                  <Input id="land-size" type="number" value={landSize} onChange={(e)=>setLandSize(e.target.value)} placeholder="e.g., 2.5" />
                </div>
              </div>

              <Button onClick={submitToAI} disabled={submitting || !landSize} className="w-full">
                {submitting ? 'Processing with AI...' : 'Get AI Credit Score'}
              </Button>

              {score !== null && (
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Your AI Credit Score</div>
                      <div className="text-3xl font-bold">{Math.round(score)}</div>
                    </div>
                    <div className="text-right text-sm">
                      {interestRate !== null && <div>Rate: {interestRate}%</div>}
                      {recommendedLoanAmount !== null && <div>Loan: ${recommendedLoanAmount.toLocaleString()}</div>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">The score has been logged on the server during processing for audit.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FinancialTools;
