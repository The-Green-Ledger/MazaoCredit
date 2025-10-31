import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { mockAiCheckForListing } from "@/lib/utils";
import { useEffect } from "react";

let Map: any = null;
let Marker: any = null;
if (typeof window !== 'undefined') {
  (async () => {
    const rl = await import('react-leaflet');
    Map = rl.MapContainer;
    Marker = rl.Marker;
    await import('leaflet/dist/leaflet.css');
  })();
}

interface ListProduceDialogProps {
  trigger?: React.ReactNode;
}

const ListProduceDialog = ({ trigger }: ListProduceDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const getLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your device/browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => setGeoError("Location capture failed. Please enable GPS permissions. " + err.message)
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!position) {
      setGeoError("Please capture your farm location before listing.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = {
      farmer_id: "demo_farm123",
      name: formData.get("name") as string,
      quantity_kg: formData.get("quantity") as string,
      price: formData.get("price") as string,
      description: formData.get("description") as string,
      created_channel: "web",
      lat: position[0],
      lng: position[1],
      // Extend image/voice in future
    };
    let apiResult = null;
    try {
      const resp = await fetch("/api/produce-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      apiResult = await resp.json();
    } catch (e) {
      apiResult = null;
    }
    if (apiResult && (apiResult.ai_flags?.length > 0 || apiResult.plausibility_flags?.length > 0)) {
      toast({
        title: "⚠️ Listing Needs Review",
        description: `API: Issues detected: ${[...(apiResult.ai_flags || []), ...(apiResult.plausibility_flags || [])].join(", ")}. Status: ${apiResult.status}`,
        variant: "destructive",
      });
    } else if (apiResult && apiResult.status === "verified") {
      toast({
        title: "Listing Verified",
        description: `Your listing passed all checks!`,
      });
    } else {
      // fallback to local mock (if API fails or is not ready)
      const aiResult = mockAiCheckForListing({
        name: data.name,
        description: data.description,
      });
      if (aiResult.flags && aiResult.flags.length > 0) {
        toast({
          title: "⚠️ Local Verification Warning",
          description: `AI detected: ${aiResult.flags.join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Listing Tentatively Saved",
          description: `Offline check passed (API unreachable).`,
        });
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            List New Produce
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>List New Produce</DialogTitle>
          <DialogDescription>
            Add your produce to the marketplace. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Produce Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Organic Tomatoes"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                placeholder="e.g., 50 kg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per kg</Label>
              <Input
                id="price"
                name="price"
                placeholder="e.g., KES 80"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell buyers about your produce..."
              rows={3}
            />
          </div>
          <div>
            <Button type="button" onClick={getLocation} variant="outline">{position ? "Update Location" : "Get Farm Location"}</Button>
            {position && Map && Marker && (
              <div className="mt-2 rounded shadow-soft overflow-hidden w-full h-[180px]">
                <Map center={position} zoom={15} style={{ height: 180, width: "100%" }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false}>
                  <Marker position={position} />
                </Map>
                <div className="text-xs mt-1">Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}</div>
              </div>
            )}
            {geoError && <div className="text-xs text-destructive mt-2">{geoError}</div>}
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!position || !!geoError}>
              List Produce
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ListProduceDialog;
