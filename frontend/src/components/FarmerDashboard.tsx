import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, TrendingUp, AlertCircle, Leaf, AlertTriangle } from "lucide-react";
import ListProduceDialog from "@/components/ListProduceDialog";
import { useState } from "react";
import { mockTrustScore } from "@/lib/utils";
import { useEffect } from "react";

const FarmerDashboard = () => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const farmerId = "demo_farm123";
  const trust = mockTrustScore(farmerId);
  const [adminMode] = useState(true); // For demonstration.
  
  const listings = [
    { id: 1, name: "Organic Tomatoes", quantity: "50 kg", price: "KES 80/kg", status: "verified", carbon: 12, feedback: "positive" },
    { id: 2, name: "Sweet Potatoes", quantity: "120 kg", price: "KES 45/kg", status: "pending_review", carbon: 8, feedback: "demoted: buyer complaint" },
    { id: 3, name: "Green Beans", quantity: "30 kg", price: "KES 120/kg", status: "flagged", carbon: 15, feedback: "flagged for audit" },
  ];

  const handleEdit = (id: number) => {
    setEditingId(id);
    // In a real app, this would open a dialog with the listing data
    console.log("Edit listing:", id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-primary text-primary-foreground";
      case "pending": return "bg-accent text-accent-foreground";
      case "sold": return "bg-muted text-muted-foreground";
      default: return "bg-muted";
    }
  };

  const demotedListings = listings.filter(listing => (listing.feedback || '').toLowerCase().includes('demoted'));

  useEffect(() => {
    if (demotedListings.length > 0) {
      // if (toast) toast({ title: "Listing Demoted", description: "One or more listings were demoted by buyer reviews. See details below.", variant: "destructive" });
    }
  }, [demotedListings.length]);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Warning banner if demoted */}
          {demotedListings.length > 0 && (
            <div className="mb-8 p-4 bg-destructive/10 border-l-4 border-destructive flex items-center gap-4 rounded">
              <AlertTriangle className="text-destructive w-6 h-6" />
              <div>
                <div className="font-bold text-destructive">Some listings are demoted due to low buyer reviews.</div>
                <p className="text-sm text-destructive/80">Improve quality, respond to buyer feedback, and ask satisfied buyers to update their review to restore your visibility and sales!</p>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Your Produce Inventory
              </h2>
              <p className="text-muted-foreground">
                Manage listings, track sales, and optimize your carbon footprint
              </p>
            </div>
            <ListProduceDialog />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-soft border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardDescription>Total Listings</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-primary">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+3 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-l-4 border-l-accent">
              <CardHeader className="pb-3">
                <CardDescription>Monthly Revenue</CardDescription>
                <CardTitle className="text-3xl">KES 24,560</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-accent">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+18% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-l-4 border-l-secondary">
              <CardHeader className="pb-3">
                <CardDescription>Avg Carbon Score</CardDescription>
                <CardTitle className="text-3xl">11.7 kg</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-secondary">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>CO₂e per 100kg</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardDescription>Trust & Reputation</CardDescription>
                <CardTitle className="text-3xl">{trust}/100</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-primary">
                  {trust >= 80 ? "Excellent" : trust >= 65 ? "Good" : "Probation/Manual Review"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings Table */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div 
                    key={listing.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:shadow-soft transition-all ${
                      (listing.feedback || '').toLowerCase().includes('demoted')
                        ? 'bg-destructive/10 opacity-60 border-destructive'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 space-y-1 mb-3 md:mb-0">
                      <h3 className="font-semibold text-lg text-foreground">{listing.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Qty: {listing.quantity}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">{listing.price}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-secondary" />
                          {listing.carbon} kg CO₂e
                        </span>
                        <span>•</span>
                        <span className="text-xs font-bold text-accent">{listing.feedback}</span>
                        {(listing.feedback || '').toLowerCase().includes('demoted') && (
                          <span className="text-xs text-destructive ml-2 font-semibold">Demoted - See above</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(listing.status)}>
                        {listing.status}
                      </Badge>
                      {adminMode && (listing.status === "flagged" || listing.status === "pending_review" || trust < 65) && (
                        <Button variant="destructive" size="sm" onClick={() => alert(`Escalate/Audit listing #${listing.id}`)}>
                          Audit/Review
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(listing.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FarmerDashboard;
