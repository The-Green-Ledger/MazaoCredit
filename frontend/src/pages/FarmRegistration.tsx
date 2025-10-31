import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Download, Upload, ArrowLeft, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Leaflet imports
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

const FarmRegistration = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [isCalculatingCredit, setIsCalculatingCredit] = useState(false);
  
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
    // Additional fields for credit assessment
    assetsValue: "",
    existingDebt: "",
    financialReadiness: "",
    irrigationSystem: "",
    equipment: "",
    marketAccess: "",
    previousLoans: "",
    insurance: "",
  });

  // Get user data from navigation state
  const { userId, farmerData } = location.state || {};

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
        marker: false,
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

  const calculateCreditScore = async () => {
    if (!userId) {
      toast({
        title: "User Not Found",
        description: "Please complete the initial registration first",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingCredit(true);

    try {
      const creditData = {
        farmData: {
          farmSize: parseFloat(formData.farmSize || "0"),
          farmType: formData.cropType,
          yearsExperience: farmerData?.farmData?.yearsExperience || 0,
          mainCrops: [formData.cropType].filter(Boolean),
          irrigationSystem: formData.irrigationSystem,
          equipment: formData.equipment,
        },
        financialData: {
          annualRevenue: farmerData?.financialData?.annualRevenue || 0,
          assetsValue: parseFloat(formData.assetsValue || "0"),
          existingDebt: parseFloat(formData.existingDebt || "0"),
          financialReadiness: parseInt(formData.financialReadiness || "5"),
        },
        locationData: {
          region: formData.county,
          country: "Kenya",
          marketAccess: formData.marketAccess,
        }
      };

      const response = await fetch(`http://localhost:5000/api/auth/credit-analysis/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creditData),
      });

      const result = await response.json();

      if (result.success) {
        setCreditScore(result.data.creditAnalysis.creditScore);
        try {
          localStorage.setItem('userId', String(userId));
          localStorage.setItem('creditAnalysis', JSON.stringify(result.data.creditAnalysis));
        } catch {}
        toast({
          title: "Credit Assessment Complete",
          description: `Your credit score: ${result.data.creditAnalysis.creditScore}/100`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Credit Assessment Failed",
        description: error.message,
      });
    } finally {
      setIsCalculatingCredit(false);
    }
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

  const handleSubmit = async () => {
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

    try {
      // Update farmer profile with additional data
      if (userId) {
        const updateData = {
          farmData: {
            ...farmerData?.farmData,
            farmSize: parseFloat(formData.farmSize),
            soilType: formData.soilType,
            waterSource: formData.waterSource,
            irrigationSystem: formData.irrigationSystem,
            equipment: formData.equipment,
            location: {
              county: formData.county,
              subcounty: formData.subcounty,
              ward: formData.ward,
              village: formData.village,
            }
          },
          financialData: {
            ...farmerData?.financialData,
            assetsValue: parseFloat(formData.assetsValue || "0"),
            existingDebt: parseFloat(formData.existingDebt || "0"),
          }
        };

        const response = await fetch(`http://localhost:5000/api/auth/profile/farmer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            ...updateData
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }
      }

      toast({
        title: "Farm Registered Successfully!",
        description: creditScore 
          ? `Your credit score: ${creditScore}/100 - You may be eligible for financing!`
          : "Farm details saved successfully",
      });

      navigate('/dashboard');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Farm Registration</h1>
          <p className="text-muted-foreground">
            Provide detailed information for credit assessment and financing opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Farm Information */}
            <Card>
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
              </CardContent>
            </Card>

            {/* Financial Information for Credit Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Financial Information
                </CardTitle>
                <CardDescription>For credit assessment and loan eligibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="assetsValue">Assets Value (USD)</Label>
                  <Input
                    id="assetsValue"
                    type="number"
                    value={formData.assetsValue}
                    onChange={(e) => handleInputChange("assetsValue", e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>

                <div>
                  <Label htmlFor="existingDebt">Existing Debt (USD)</Label>
                  <Input
                    id="existingDebt"
                    type="number"
                    value={formData.existingDebt}
                    onChange={(e) => handleInputChange("existingDebt", e.target.value)}
                    placeholder="e.g., 0"
                  />
                </div>

                <div>
                  <Label htmlFor="financialReadiness">Financial Readiness (1-10)</Label>
                  <Input
                    id="financialReadiness"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.financialReadiness}
                    onChange={(e) => handleInputChange("financialReadiness", e.target.value)}
                    placeholder="How ready are you for financing?"
                  />
                </div>

                <div>
                  <Label htmlFor="irrigationSystem">Irrigation System</Label>
                  <Select value={formData.irrigationSystem} onValueChange={(value) => handleInputChange("irrigationSystem", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select irrigation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler System</SelectItem>
                      <SelectItem value="flood">Flood Irrigation</SelectItem>
                      <SelectItem value="none">No Irrigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="marketAccess">Market Access</Label>
                  <Select value={formData.marketAccess} onValueChange={(value) => handleInputChange("marketAccess", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {creditScore && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-semibold text-green-800">Credit Score: {creditScore}/100</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {creditScore >= 80 ? "Excellent - High loan eligibility" :
                       creditScore >= 60 ? "Good - Moderate loan eligibility" :
                       creditScore >= 40 ? "Fair - Limited loan eligibility" :
                       "Poor - May need improvement"}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={calculateCreditScore} 
                  disabled={isCalculatingCredit || !formData.farmSize}
                  className="w-full"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculatingCredit ? "Calculating..." : "Calculate Credit Score"}
                </Button>
              </CardContent>
            </Card>
          </div>

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
              
              <div className="flex gap-2 mt-4">
                <Button onClick={handleExportGeoJSON} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Boundary
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={!creditScore}>
                  <Upload className="w-4 h-4 mr-2" />
                  Complete Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FarmRegistration;