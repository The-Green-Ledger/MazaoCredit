import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Download, Upload } from "lucide-react";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

const FarmRegistration = () => {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
  
  const [formData, setFormData] = useState({
    farmerName: "",
    phoneNumber: "",
    county: "",
    subcounty: "",
    ward: "",
    village: "",
    farmSize: "",
    cropType: "",
    soilType: "",
    waterSource: "",
  });

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialize map
    const newMap = L.map(mapRef.current).setView([-1.2921, 36.8219], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(newMap);

    // Initialize FeatureGroup for drawn items
    const items = new L.FeatureGroup();
    newMap.addLayer(items);

    // Initialize Draw Control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: items,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        polyline: false,
        circle: false,
        rectangle: {
          shapeOptions: {
            color: '#16a34a'
          }
        },
        marker: {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        },
        circlemarker: false,
      },
    });
    newMap.addControl(drawControl);

    // Handle draw events
    newMap.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      items.addLayer(layer);
      
      // Calculate area if polygon
      if (event.layerType === 'polygon') {
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const hectares = (area / 10000).toFixed(2);
        setFormData(prev => ({ ...prev, farmSize: hectares }));
        
        toast({
          title: "Farm Boundary Drawn",
          description: `Area: ${hectares} hectares`,
        });
      }
    });

    setMap(newMap);
    setDrawnItems(items);

    return () => {
      newMap.remove();
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExportGeoJSON = () => {
    if (!drawnItems || drawnItems.getLayers().length === 0) {
      toast({
        title: "No Boundary Drawn",
        description: "Please draw your farm boundary first",
        variant: "destructive",
      });
      return;
    }

    const geojson = drawnItems.toGeoJSON();
    const dataStr = JSON.stringify(geojson, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `farm_${formData.farmerName || 'boundary'}.geojson`;
    link.click();
    
    toast({
      title: "GeoJSON Exported",
      description: "Farm boundary data downloaded successfully",
    });
  };

  const handleSubmit = () => {
    if (!formData.farmerName || !formData.phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in farmer name and phone number",
        variant: "destructive",
      });
      return;
    }

    if (!drawnItems || drawnItems.getLayers().length === 0) {
      toast({
        title: "No Boundary Drawn",
        description: "Please draw your farm boundary on the map",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Farm Registered",
      description: "Your farm has been successfully registered!",
    });

    console.log("Farm Data:", formData);
    console.log("GeoJSON:", drawnItems.toGeoJSON());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Farm Registration</h1>
          <p className="text-muted-foreground">Register your farm and define boundaries using the interactive map</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Farm Details
              </CardTitle>
              <CardDescription>Enter your farm information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="farmerName">Farmer Name *</Label>
                <Input
                  id="farmerName"
                  value={formData.farmerName}
                  onChange={(e) => handleInputChange("farmerName", e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+254700000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => handleInputChange("county", e.target.value)}
                    placeholder="Nairobi"
                  />
                </div>
                <div>
                  <Label htmlFor="subcounty">Sub-County</Label>
                  <Input
                    id="subcounty"
                    value={formData.subcounty}
                    onChange={(e) => handleInputChange("subcounty", e.target.value)}
                    placeholder="Westlands"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Input
                    id="ward"
                    value={formData.ward}
                    onChange={(e) => handleInputChange("ward", e.target.value)}
                    placeholder="Kitisuru"
                  />
                </div>
                <div>
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => handleInputChange("village", e.target.value)}
                    placeholder="Runda"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="farmSize">Farm Size (hectares)</Label>
                <Input
                  id="farmSize"
                  type="number"
                  value={formData.farmSize}
                  onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  placeholder="Auto-calculated from map"
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="cropType">Primary Crop</Label>
                <Select value={formData.cropType} onValueChange={(value) => handleInputChange("cropType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="beans">Beans</SelectItem>
                    <SelectItem value="tomatoes">Tomatoes</SelectItem>
                    <SelectItem value="cabbage">Cabbage</SelectItem>
                    <SelectItem value="potatoes">Potatoes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="soilType">Soil Type</Label>
                <Select value={formData.soilType} onValueChange={(value) => handleInputChange("soilType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="loam">Loam</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                    <SelectItem value="silt">Silt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="waterSource">Water Source</Label>
                <Select value={formData.waterSource} onValueChange={(value) => handleInputChange("waterSource", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select water source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rainfall">Rainfall</SelectItem>
                    <SelectItem value="borehole">Borehole</SelectItem>
                    <SelectItem value="river">River</SelectItem>
                    <SelectItem value="irrigation">Irrigation System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExportGeoJSON} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Draw Farm Boundary</CardTitle>
              <CardDescription>
                Use the drawing tools to mark your farm boundaries on the map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={mapRef} className="w-full h-[600px] rounded-lg border" />
              <p className="text-sm text-muted-foreground mt-4">
                💡 Use the polygon tool to draw your farm boundary. Click points to create the shape, then click the first point again to complete.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FarmRegistration;