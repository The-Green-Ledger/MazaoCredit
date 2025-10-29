import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Leaf, Phone, MessageSquare } from "lucide-react";

const Marketplace = () => {
  const produces = [
    {
      id: 1,
      name: "Organic Tomatoes",
      farmer: "Jane Mwangi",
      location: "Kiambu, 5 km away",
      quantity: "50 kg",
      price: "KES 80/kg",
      carbon: 12,
      rating: 4.8,
      certified: true
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
      certified: true
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
      certified: false
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
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
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search for produce, farmers, or location..." 
                className="pl-10 h-12 shadow-soft"
              />
            </div>
          </div>

          {/* Produce Listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produces.map((produce) => (
              <Card key={produce.id} className="shadow-soft hover:shadow-elevated transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{produce.name}</CardTitle>
                    {produce.certified && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Organic
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">by {produce.farmer}</span>
                      <span className="text-accent">★ {produce.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {produce.location}
                    </div>
                  </CardDescription>
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
                    <Button className="flex-1" size="sm">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Marketplace;
