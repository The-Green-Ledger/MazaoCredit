import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface ListProduceDialogProps {
  trigger?: React.ReactNode;
}

const ListProduceDialog = ({ trigger }: ListProduceDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      quantity: formData.get("quantity"),
      price: formData.get("price"),
      description: formData.get("description"),
    };

    // In a real app, this would save to Supabase
    console.log("New produce listing:", data);
    
    toast({
      title: "Success!",
      description: "Your produce has been listed.",
    });
    
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
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              List Produce
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ListProduceDialog;
