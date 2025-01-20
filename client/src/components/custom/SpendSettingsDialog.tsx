import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SettingsIcon } from "lucide-react";

interface SpendSettingsDialogProps {
  warningPosition: number;
  onWarningPositionChange: (position: number) => void;
}

export function SpendSettingsDialog({
  warningPosition,
  onWarningPositionChange,
}: SpendSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(warningPosition);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onWarningPositionChange(position);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          style={{ backgroundColor: "transparent" }}
        >
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "400px",
          backgroundColor: "black",
          top: "45%",
        }}
      >
        <DialogHeader>
          <DialogTitle>Spend Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warning-position">Spend Warning Percent (%)</Label>
            <Input
              id="warning-position"
              type="number"
              min="0"
              max="100"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              required
            />
            <p className="text-sm text-gray-500">
              The percentage of the budget used that will warn against any
              further spending.
            </p>
          </div>
          <Button type="submit" className="w-full">
            Save Settings
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
