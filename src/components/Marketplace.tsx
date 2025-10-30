import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Leaf } from "lucide-react";
import ContactDialog from "@/components/ContactDialog";
import marketplaceImage from "@/assets/marketplace-hero.jpg";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const allProduces = [
    {
      id: 1,
      name: "Organic Tomatoes",
      farmer: "Jane Mwangi",
      location: "Kiambu, 5 km away",
      quantity: "50 kg",
      price: "KES 80/kg",
      carbon: 12,
      rating: 4.8,
      status: "verified",
      certified: true,
      feedback: "positive"
    },
    {
      id: 2,
      name: "Fresh Spinach",
      farmer: "John Kamau",
      location: "Nairobi, 12 km away",
      quantity: "25 kg",
      price: "KES 65/kg",
      carbon: 8,
      rating: 4.9,
      status: "pending_review",
      certified: false,
      feedback: "flagged: demoted by buyers"
    },
    {
      id: 3,
      name: "Sweet Potatoes",
      farmer: "Mary Njeri",
      location: "Machakos, 18 km away",
      quantity: "120 kg",
      price: "KES 45/kg",
      carbon: 9,
      rating: 4.7,
      status: "flagged",
      certified: false,
      feedback: "pending admin review"
    },
  ];

  const [ecoFilter, setEcoFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sortMode, setSortMode] = useState('Default');
  const [distanceFilter, setDistanceFilter] = useState('All');

  // Filter produces based on search query and eco-premium filter
  const produces = allProduces
    .filter(produce =>
      produce.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      produce.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      produce.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(produce => ecoFilter ? produce.carbon < 10 : true);

  // Add review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(null);
  // Reviews state
  const [reviews, setReviews] = useState<Record<string, any[]>>({});
  const [demoted, setDemoted] = useState<Record<string, boolean>>({});

  // Add payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentListingId, setPaymentListingId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, string>>({}); // listing_id: status
  const inputPhoneRef = useRef<HTMLInputElement>(null);

  // Fetch reviews on mount
  useEffect(() => {
    // Replace with your Supabase review fetch call
    // Example: fetch all reviews for listed produce
    // supposing produces lists have unique 'id' or 'listing_id'
    const fetchReviews = async () => {
      // For demo, just set empty reviews object
      setReviews({});
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(null)
      );
    }
  }, [viewMode]);

  const handleOpenReview = (listingId: string | number) => {
    setSelectedListingId(listingId);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedListingId) return;
    setReviews((prev) => {
      const updated = {
        ...prev,
        [selectedListingId]: [
          ...((prev[selectedListingId] as any[] | undefined) ?? []),
          { rating, comment, buyer: "Current User", created_at: new Date().toISOString() }
        ]
      };
      // Calculate new average
      const ratings = updated[selectedListingId].map(r => r.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      setDemoted((d) => ({ ...d, [selectedListingId]: avg < 3.0 }));
      return updated;
    });
    setReviewDialogOpen(false);
    try {
      await fetch('/functions/v1/reviews-aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: selectedListingId })
      });
    } catch (e) {
      console.warn('reviews-aggregate call failed', e);
    }
  };

  const handleOpenPayment = (listingId: string | number) => {
    setPaymentListingId(listingId);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentListingId) return;
    const phone = inputPhoneRef.current?.value ?? '';
    // Normally call payment gateway API here
    // await supabase.from('produce_payments').insert(...)
    setPaymentStatus((prev) => ({ ...prev, [paymentListingId]: 'complete' }));
    setPaymentDialogOpen(false);
  };

  // Compute distances for visible produces
  const centeredUserLoc = userLocation || [ -1.286389, 36.817223 ]; // Default Nairobi
  let producesWithDist = produces.map(p => {
    const plat = p.lat ?? (-1.28);
    const plng = p.lng ?? (36.82);
    const dist = haversine(centeredUserLoc[0], centeredUserLoc[1], plat, plng);
    return { ...p, dist: Math.round(dist*10)/10 };
  });
  // Apply filter
  if (distanceFilter !== 'All') {
    const km = parseInt(distanceFilter.replace(/\D/g,''));
    producesWithDist = producesWithDist.filter(p => p.dist <= km);
  }
  // Apply sort
  if (sortMode === 'Distance (nearest)') {
    producesWithDist = producesWithDist.slice().sort((a,b)=>a.dist-b.dist);
  }
  const nearestDist = producesWithDist.length ? producesWithDist[0].dist : null;

  return (
    <section className="py-20 bg-background relative">
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-1/3 h-64 opacity-5"
        style={{ backgroundImage: `url(${marketplaceImage})`, backgroundSize: 'cover' }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Live Marketplace
            </h2>
            <p className="text-muted-foreground">
              Connect directly with local farmers and access fresh, sustainable produce
            </p>
          </div>

          {/* Market Price Feed */}
          <Card className="mb-8 shadow-soft bg-gradient-to-r from-info/5 to-primary/5 border-info/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-info rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-info">Live Market Prices</span>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Tomatoes:</span>
                  <span className="font-bold text-foreground ml-2">KES 75-85/kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Potatoes:</span>
                  <span className="font-bold text-foreground ml-2">KES 40-50/kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Spinach:</span>
                  <span className="font-bold text-foreground ml-2">KES 60-70/kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carrots:</span>
                  <span className="font-bold text-foreground ml-2">KES 55-65/kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="mb-6 flex items-center gap-4">
            <Switch
              id="eco-toggle"
              checked={ecoFilter}
              onCheckedChange={setEcoFilter}
            />
            <label htmlFor="eco-toggle" className="text-sm font-medium">
              Show only <span className="inline-flex items-center text-emerald-700 font-semibold">Eco-Premium<Leaf className="w-4 h-4 ml-1 text-emerald-500" /></span> produce (carbon &lt; 10 kg CO₂e/100kg)
            </label>
          </div>
          {ecoFilter && produces.length === 0 && (
            <div className="text-emerald-700 font-medium my-4">No Eco-Premium produce currently available — check back soon or adjust your filter!</div>
          )}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search for produce, farmers, or location..." 
                className="pl-10 h-12 shadow-soft"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex mb-2 gap-4 flex-wrap">
            <label className="text-xs">Sort by:
              <select className="ml-1 border rounded px-1 py-0.5 text-xs" value={sortMode} onChange={e=>setSortMode(e.target.value)}>
                <option>Default</option>
                <option>Distance (nearest)</option>
              </select>
            </label>
            <label className="text-xs">Filter:
              <select className="ml-1 border rounded px-1 py-0.5 text-xs" value={distanceFilter} onChange={e=>setDistanceFilter(e.target.value)}>
                <option>All</option>
                <option>Within 10 km</option>
                <option>Within 25 km</option>
                <option>Within 50 km</option>
              </select>
            </label>
          </div>

          {viewMode==='map' ? (
            <div className="mb-8 w-full h-[400px] rounded shadow-soft overflow-hidden">
              <MapContainer center={userLocation || [1.287, 36.826]} zoom={8} style={{width:'100%', height:400}}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OSM contributors"
                />
                {producesWithDist.map((produce, i) => {
                  // Demo: random-ish mocks if missing
                  const lat = produce.lat ?? ( -1.28 + i*0.02 );
                  const lng = produce.lng ?? (36.82 + i*0.03 );
                  return <Marker key={produce.id} position={[lat, lng]}>
                    <Popup>
                      <div>
                        <div className="font-bold">{produce.name}</div>
                        <div className="text-xs">{produce.price}</div>
                        <div className="text-xs">{produce.farmer}</div>
                        <div className="text-xs text-muted-foreground ml-2">{produce.dist} km away</div>
                        <Button size="xs" className="mt-2 w-full">Contact</Button>
                      </div>
                    </Popup>
                  </Marker>;
                })}
                {userLocation && <Marker position={userLocation}><Popup>You are here</Popup></Marker>}
              </MapContainer>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {producesWithDist.map((produce) => (
                <Card key={produce.id} className={`shadow-soft hover:shadow-elevated transition-all ${ecoFilter || produce.carbon < 10 ? "border-2 border-emerald-400" : ""} ${demoted[produce.id] ? "opacity-50 border-destructive/80" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl">{produce.name}</CardTitle>
                      {produce.status === "verified" && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Verified
                        </Badge>
                      )}
                      {produce.status === "pending_review" && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 animate-pulse">
                          Review Needed
                        </Badge>
                      )}
                      {produce.status === "flagged" && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 animate-bounce">
                          Flagged
                        </Badge>
                      )}
                      {produce.carbon < 10 && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                          Premium Eco <Leaf className="w-3 h-3 ml-1" />
                        </Badge>
                      )}
                      {demoted[produce.id] && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 animate-pulse">
                          Demoted by Reviews
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">by {produce.farmer}</span>
                        <span className="text-accent">★ {produce.rating}</span>
                        <span className="text-xs font-bold text-accent">{produce.feedback}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {produce.location}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">{produce.dist} km away</div>
                    </CardDescription>
                    {demoted[produce.id] && (
                      <p className="text-xs text-destructive font-semibold">This listing has been demoted due to low buyer ratings. Farmer has been notified.</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-t border-b border-border">
                      <div>
                        <span className="text-xs text-muted-foreground block">Available</span>
                        <span className="font-semibold text-foreground block">{produce.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Price</span>
                        <span className="font-bold text-lg text-primary block">{produce.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/20">
                      <Leaf className="w-4 h-4 text-secondary" />
                      <span className="text-xs text-muted-foreground">
                        Carbon: <span className="font-semibold text-foreground">{produce.carbon} kg CO₂e/100kg</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <ContactDialog 
                        farmerName={produce.farmer}
                        produceName={produce.name}
                        type="call"
                      />
                      <ContactDialog 
                        farmerName={produce.farmer}
                        produceName={produce.name}
                        type="chat"
                      />
                    </div>

                    {/* REVIEWS SECTION */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Reviews:</span>
                        <span className="flex items-center gap-1">
                          {reviews[produce.id]?.length
                            ? (
                               Array(Math.round(reviews[produce.id].reduce((acc, r) => acc + r.rating, 0) / reviews[produce.id].length)).fill(0).map((_, i) => <Star key={i} size={16} className="text-yellow-500 inline" />))
                            : (
                               <span className="text-xs text-muted">No reviews yet</span>
                            )}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {reviews[produce.id]?.length ? `(${reviews[produce.id].length} reviews)` : null}
                        </span>
                        <Dialog open={reviewDialogOpen && selectedListingId === produce.id} onOpenChange={setReviewDialogOpen}>
                          <DialogTrigger asChild disabled={paymentStatus[produce.id] !== 'complete'}>
                            <Button
                              variant="outline"
                              size="xs"
                              className="ml-4"
                              onClick={() => handleOpenReview(produce.id)}
                            >
                              Add Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add a Review</DialogTitle>
                            </DialogHeader>
                            <ReviewForm onSubmit={handleSubmitReview} />
                          </DialogContent>
                        </Dialog>
                      </div>
                      {reviews[produce.id]?.slice(-3).map((r, idx) => (
                        <div key={idx} className="mt-1 border-b border-muted py-1">
                          <span className="text-xs font-semibold">{r.buyer}</span>
                          <span className="mx-2 text-yellow-500">{'★'.repeat(r.rating)}</span>
                          <span className="text-xs text-muted-foreground">{r.comment}</span>
                          <span className="text-[10px] float-right">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  {produce.status === 'verified' && paymentStatus[produce.id] !== 'complete' && (
                    <div className="mb-3 flex flex-col items-start">
                      <Button
                        variant="success"
                        className="font-semibold"
                        onClick={() => handleOpenPayment(produce.id)}
                      >
                        Pay Now
                      </Button>
                      <Dialog open={paymentDialogOpen && paymentListingId === produce.id} onOpenChange={setPaymentDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pay for {produce.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mb-2">Total: <span className="font-mono">{produce.price}</span></div>
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              handleConfirmPayment();
                            }}
                          >
                            <input
                              ref={inputPhoneRef}
                              placeholder="Your Mobile Money Number"
                              className="block w-full border rounded px-2 py-1 mb-3"
                              required
                            />
                            <Button type="submit" className="w-full">Confirm Payment</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Marketplace;

function ReviewForm({ onSubmit }: { onSubmit: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, comment);
      }}
    >
      <div className="flex gap-1 mb-2">
        {[1,2,3,4,5].map(i => (
          <button type="button" key={i} onClick={() => setRating(i)}>
            <Star size={20} className={rating >= i ? "text-yellow-500" : "text-gray-300"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full border rounded px-2 py-1 mb-2"
        rows={3}
        placeholder="Optional comment"
      />
      <Button type="submit" disabled={rating === 0}>Submit Review</Button>
    </form>
  );
}
