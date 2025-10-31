import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Users, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MapContainer, Marker, Popup, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const PartnerDashboard = () => {
  // Microfinance
  const [farmers, setFarmers] = useState<any[]>([]);
  // Insurance
  const [insuredFarms, setInsuredFarms] = useState<any[]>([]);
  // Logistics
  const [produceListings, setProduceListings] = useState<any[]>([]);
  const [logisticsView, setLogisticsView] = useState<'list'|'map'>('list');
  const [sortMode, setSortMode] = useState('Default');
  const [distanceFilter, setDistanceFilter] = useState('All');
  const baseLoc = [-1.3, 36.8];

  useEffect(() => {
    // Microfinance: load farmers and their financial readiness
    supabase.from("farmer_profiles").select("id, name, financial_readiness").then(res => {
      setFarmers(res.data || []);
    });
    // Insurance: load insured farms/policies (stub: just list current farms for now)
    supabase.from("farmer_profiles").select("id, name, region, is_insured").then(res => {
      setInsuredFarms(res.data || []);
    });
    // Logistics: load produce listings marked as pending or requiring transport
    supabase.from("produce_listings").select("id, name, quantity_kg, location, status, lat, lng").in("status", ["verified", "pending_review"]).then(res => {
      setProduceListings(res.data || []);
    });
  }, []);

  // Compute distance for table/map
  let produceWithDist = produceListings.map((p,i) => {
    const plat = p.lat ?? (-1.29 + i * .02);
    const plng = p.lng ?? (36.82 + i * .03);
    const dist = haversine(baseLoc[0], baseLoc[1], plat, plng);
    return { ...p, lat: plat, lng: plng, dist: Math.round(dist*10)/10 };
  });
  if(distanceFilter !== 'All') {
    const km = parseInt(distanceFilter.replace(/\D/g, ''));
    produceWithDist = produceWithDist.filter(p => p.dist <= km);
  }
  if(sortMode === 'Distance (nearest)') {
    produceWithDist = produceWithDist.slice().sort((a,b)=>a.dist-b.dist);
  }
  const nearest = produceWithDist.reduce((acc,cur)=>cur.dist<(acc?.dist??1e6)?cur:acc,null);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="shadow-elevated border border-border">
          <CardHeader>
            <CardTitle>Partner Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="microfinance" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="microfinance">Microfinance</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="logistics">Logistics</TabsTrigger>
              </TabsList>
              <TabsContent value="microfinance">
                <h3 className="font-bold mb-4">Farmer Financial Readiness</h3>
                <table className="w-full text-sm mb-8">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Financial Readiness</th>
                      <th className="flex items-center gap-1">Guarantors
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="w-3 h-3 text-muted" /></TooltipTrigger>
                            <TooltipContent>
                              Number of people vouching for this farmer; lenders use this to assess social trust and credit risk.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmers.length === 0 ? (
                      <tr><td colSpan={4}>No farmers found.</td></tr>
                    ) : (
                      farmers.map(f => {
                        // Demo: random or fixed mock strength per farmer
                        const count = f.guarantors ?? Math.floor(Math.random()*3+2); // 2-4
                        let color = 'bg-red-100 text-red-800';
                        if (count >= 4) color = 'bg-green-100 text-green-800';
                        else if (count === 3) color = 'bg-yellow-100 text-yellow-800';
                        return (
                          <tr key={f.id} className="border-b border-border">
                            <td>{f.name}</td>
                            <td>{f.id}</td>
                            <td>{f.financial_readiness ?? '-'}</td>
                            <td><Badge className={`flex items-center gap-1 ${color}`}><Users className="w-3 h-3" /> {count}</Badge></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </TabsContent>
              <TabsContent value="insurance">
                <h3 className="font-bold mb-4">Insured Farms</h3>
                <table className="w-full text-sm mb-8">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Region</th>
                      <th>Insured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuredFarms.length === 0 ? (
                      <tr><td colSpan={4}>No insured farms.</td></tr>
                    ) : (
                      insuredFarms.map(f => (
                        <tr key={f.id} className="border-b border-border">
                          <td>{f.name}</td>
                          <td>{f.id}</td>
                          <td>{f.region}</td>
                          <td>{f.is_insured ? "Yes" : "No"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TabsContent>
              <TabsContent value="logistics">
                <h3 className="font-bold mb-4">Produce Needing Pickup</h3>
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
                {logisticsView==='map' ? (
                  <div className="mb-8 w-full h-[350px] rounded shadow-soft overflow-hidden">
                    <MapContainer center={baseLoc} zoom={8} style={{height:350, width:"100%"}}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM contributors" />
                      {/* Base location marker */}
                      <Marker position={baseLoc}><Popup>Dispatch Base</Popup></Marker>
                      {/* Draw lines & markers */}
                      {produceWithDist.map((p,i) => (
                        <Marker key={p.id} position={[p.lat, p.lng]}>
                          <Popup>
                            <div>
                              <div className="font-bold">{p.name}</div>
                              <div className="text-xs">Qty: {p.quantity_kg}</div>
                              <div className="text-xs">Loc: {p.location ?? 'Unknown'}</div>
                              <div className="text-xs">{p.dist} km from base</div>
                              <div className={`px-2 py-1 rounded mt-1 text-xs ${p.status === 'verified' ? 'bg-green-200' : 'bg-yellow-100'}`}>{p.status}</div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      {/* Highlight route to nearest */}
                      {nearest ? <Polyline positions={[baseLoc,[nearest.lat,nearest.lng]]} color="red" /> : null}
                    </MapContainer>
                  </div>
                ) : (
                  <table className="w-full text-sm mb-8">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Quantity (kg)</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Distance (km)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produceWithDist.length === 0 ? (
                        <tr><td colSpan={6}>No active produce listings.</td></tr>
                      ) : (
                        produceWithDist.map((p,i) => (
                          <tr key={p.id} className="border-b border-border">
                            <td>{p.name}</td>
                            <td>{p.id}</td>
                            <td>{p.quantity_kg}</td>
                            <td>{p.location ?? '-'}</td>
                            <td>{p.status}</td>
                            <td>{p.dist} km from base</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PartnerDashboard;
