import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Mail } from "lucide-react";

interface ContactDialogProps {
  farmerName: string;
  produceName: string;
  type: "call" | "chat";
}

const ContactDialog = ({ farmerName, produceName, type }: ContactDialogProps) => {
  const phoneNumber = "+254 700 123 456"; // Mock number
  const email = `${farmerName.toLowerCase().replace(" ", ".")}@farmer.com`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={type === "call" ? "default" : "outline"} className="flex-1" size="sm">
          {type === "call" ? (
            <>
              <Phone className="w-3 h-3 mr-1" />
              Call
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact {farmerName}</DialogTitle>
          <DialogDescription>
            Regarding: {produceName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <div className="p-2 rounded-full bg-primary/10">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Phone Call</p>
              <p className="text-sm text-muted-foreground">{phoneNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <div className="p-2 rounded-full bg-secondary/10">
              <MessageSquare className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Send a message</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <div className="p-2 rounded-full bg-accent/10">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Email</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
