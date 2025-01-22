import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "../../pages/Accounts.module.css";
import { useNavigate } from "react-router-dom";

interface AccountDialogProps {
  onAccountCreated: () => void;
}

export function AccountDialog({ onAccountCreated }: AccountDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [balance, setBalance] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/accounts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          type: type === "other" ? otherType : type,
          balance: parseFloat(balance),
          last_updated: new Date().toISOString().split("T")[0],
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      // Reset form and close dialog
      setName("");
      setType("");
      setOtherType("");
      setBalance("");
      setOpen(false);
      onAccountCreated();
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`${styles["new-account-button"]} fixed bottom-7 right-20`}
          size="lg"
        >
          New Account
        </Button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: "black" }}>
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Spending</SelectItem>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {type === "other" && (
              <div className="mt-2">
                <Input
                  placeholder="Specify account type"
                  value={otherType}
                  onChange={(e) => setOtherType(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Initial Balance</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                $
              </span>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                style={{ paddingLeft: "1.25rem" }}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
