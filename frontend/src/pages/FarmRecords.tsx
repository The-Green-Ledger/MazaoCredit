import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecordItem = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  notes?: string;
};

const keyForUser = (uid: string) => `farm_records_${uid}`;

const FarmRecords = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "expense" as "income" | "expense",
    category: "inputs",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id || localStorage.getItem("userId") || "demo";
      setUserId(uid);
      try {
        const { data, error } = await supabase
          .from('farm_records')
          .select('id,date,type,category,amount,notes')
          .eq('user_id', uid)
          .order('date', { ascending: false });
        if (!error && data) setRecords(data as any);
      } catch {}
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    try { localStorage.setItem(keyForUser(userId), JSON.stringify(records)); } catch {}
  }, [records, userId]);

  const totals = useMemo(() => {
    const income = records.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    const profit = income - expense;
    return { income, expense, profit };
  }, [records]);

  const addRecord = async () => {
    const amountNum = parseFloat(form.amount || "0");
    if (!amountNum || amountNum <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        user_id: userId,
        date: form.date,
        type: form.type,
        category: form.category,
        amount: amountNum,
        notes: form.notes || null,
      } as any;
      const { data, error } = await supabase
        .from('farm_records')
        .insert(payload)
        .select('id,date,type,category,amount,notes')
        .single();
      if (error) throw error;
      setRecords(prev => [data as any, ...prev]);
      setForm(f => ({ ...f, amount: "", notes: "" }));
      toast({ title: "Record added" });
    } catch (e: any) {
      toast({ title: "Failed to add record", description: e.message, variant: "destructive" });
    }
  };

  const removeRecord = async (id: string) => {
    try {
      await supabase.from('farm_records').delete().eq('id', id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farm Records</h1>
          <p className="text-muted-foreground">Track farm activities and finances. Summaries feed your credit readiness.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Record</CardTitle>
              <CardDescription>Income or expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e)=>setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v)=>setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v)=>setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inputs">Inputs</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e)=>setForm({ ...form, amount: e.target.value })} placeholder="e.g., 2500" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e)=>setForm({ ...form, notes: e.target.value })} placeholder="optional" />
              </div>
              <Button className="w-full" onClick={addRecord}>Add</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Totals from your records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">Income</div>
                    <div className="text-2xl font-bold text-green-600">${totals.income.toLocaleString()}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">Expenses</div>
                    <div className="text-2xl font-bold text-red-600">${totals.expense.toLocaleString()}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">Profit</div>
                    <div className="text-2xl font-bold">${totals.profit.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Records</CardTitle>
                <CardDescription>Recent entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {records.length === 0 && (
                    <div className="text-sm text-muted-foreground">No records yet.</div>
                  )}
                  {records.map(r => (
                    <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.type === "income" ? "Income" : "Expense"} · {r.category}</div>
                        <div className="text-xs text-muted-foreground">{r.date}{r.notes ? ` · ${r.notes}` : ""}</div>
                      </div>
                      <div className={r.type === "income" ? "text-green-600" : "text-red-600"}>${r.amount.toLocaleString()}</div>
                      <Button variant="ghost" size="sm" onClick={()=>removeRecord(r.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmRecords;


