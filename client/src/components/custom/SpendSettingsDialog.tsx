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
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SpendSettingsDialogProps {
  onWarningPositionChange: (position: number) => void;
  onSavingsPercentChange: (savingsPercent: number) => void;
}

export function SpendSettingsDialog({
  onWarningPositionChange,
  onSavingsPercentChange,
}: SpendSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(25);
  const [savingsPercent, setSavingsPercent] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserSettings = async () => {
      const token = localStorage.getItem("token");

        // Fetch user data to get spend warning position
        const userResponse = await fetch("http://localhost:8000/users/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        setPosition(userData.spend_warning);
        setSavingsPercent(userData.savings_percent);
    };

    fetchUserSettings();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:8000/users/me/update-spend-warning', null, {
        params: { spend_warning: position },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      await axios.put('http://localhost:8000/users/me/update-savings-percent', null, {
        params: { savings_percent: savingsPercent },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      onWarningPositionChange(position);
      onSavingsPercentChange(savingsPercent);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
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
          <div className="space-y-2">
            <Label htmlFor="savings-percent">Savings Percent (%)</Label>
            <Input
              id="savings-percent"
              type="number"
              min="0"
              max="100"
              value={savingsPercent}
              onChange={(e) => setSavingsPercent(Number(e.target.value))}
              required
            />
            <p className="text-sm text-gray-500">
              The percentage of money that will be saved each month and automatically deducted from your budget.
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
