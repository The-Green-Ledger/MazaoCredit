import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  id: string;
  name: string;
  farmer_id: string;
  status: string;
  ai_classification?: { flags?: string[] } | null;
  plausibility_flags?: string[] | null;
  trust_score?: number;
}

const statusColors: Record<string, string> = {
  verified: "bg-primary/10 text-primary",
  pending_review: "bg-accent/10 text-accent",
  flagged: "bg-destructive/10 text-destructive",
  suspended: "bg-muted/40 text-muted",
};

const AdminReview = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      // Replace mock with Supabase query when DB is ready
      /*
      const { data } = await supabase
        .from('produce_listings')
        .select('*')
        .in('status', ['pending_review','flagged']);
      setListings(data || []);
      */
      setListings([
        {
          id: "1",
          name: "Sweet Potatoes",
          farmer_id: "farmer_1",
          status: "pending_review",
          ai_classification: { flags: ["unrecognized_produce"] },
          plausibility_flags: ["out_of_season"],
          trust_score: 55,
        },
        {
          id: "2",
          name: "Cabbage",
          farmer_id: "farmer_2",
          status: "flagged",
          ai_classification: { flags: ["voice_text_mismatch"] },
          plausibility_flags: [],
          trust_score: 65,
        }
      ]);
      setLoading(false);
    };
    fetchPending();
  }, []);

  const handleAction = (id: string, newStatus: string) => {
    // TODO: Update in DB!
    setListings((prev) => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    // Show notification, send SMS, audit record, etc.
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-elevated border border-border">
          <CardHeader>
            <CardTitle>Admin Manual Listing Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Produce</th>
                    <th className="text-left">Farmer ID</th>
                    <th>Status</th>
                    <th>AI Flags</th>
                    <th>Logic Flags</th>
                    <th>Trust</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="py-6 text-center">Loading...</td></tr>
                  ) : listings.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center">All clear! No listings pending review.</td></tr>
                  ) : (
                    listings.map(listing => (
                      <tr key={listing.id} className="border-b border-border">
                        <td>{listing.name}</td>
                        <td>{listing.farmer_id}</td>
                        <td><Badge className={statusColors[listing.status] || ''}>{listing.status}</Badge></td>
                        <td>{(listing.ai_classification?.flags || []).join(', ')}</td>
                        <td>{(listing.plausibility_flags || []).join(', ')}</td>
                        <td className="text-center font-bold">{listing.trust_score ?? '--'}</td>
                        <td className="flex gap-2">
                          <Button size="sm" variant="success" onClick={() => handleAction(listing.id, 'verified')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(listing.id, 'suspended')}>Suspend</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(listing.id, 'flagged')}>Escalate</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminReview;
