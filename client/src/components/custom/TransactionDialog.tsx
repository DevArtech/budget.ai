import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
}

interface TransactionDialogProps {
  onSubmit: (transaction: {
    title: string;
    amount: number;
    date: string;
    category: string;
    isIncome: boolean;
    account_id: number;
    recurrence?:
      | "daily"
      | "weekly"
      | "bi-weekly"
      | "monthly"
      | "quarterly"
      | "annually";
  }) => void;
}

export function TransactionDialog({ onSubmit }: TransactionDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [recurrence, setRecurrence] = useState<string>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>();

  useEffect(() => {
    // Fetch accounts when dialog opens
    if (open) {
      const fetchAccounts = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("http://localhost:8000/accounts", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          if (!response.ok) {
            throw new Error("Failed to fetch accounts");
          }

          const data = await response.json();
          setAccounts(data);
        } catch (error) {
          console.error("Error fetching accounts:", error);
        }
      };

      fetchAccounts();
    }
  }, [open, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim() || !amount || !category || !selectedAccount) {
      return;
    }

    onSubmit({
      title,
      amount: parseFloat(amount),
      date,
      category,
      isIncome,
      account_id: parseInt(selectedAccount),
      recurrence: recurrence as
        | "daily"
        | "weekly"
        | "bi-weekly"
        | "monthly"
        | "quarterly"
        | "annually"
        | undefined,
    });
    setOpen(false);
    // Reset form
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("");
    setIsIncome(false);
    setRecurrence(undefined);
    setSelectedAccount(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          style={{ width: "100%", height: "100%" }}
          className="mt-4 new-transaction-button"
        >
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent
        className="transaction-dialog"
        style={{
          width: "600px",
          backgroundColor: "black",
        }}
      >
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="income-mode"
                checked={isIncome}
                onCheckedChange={(checked) => {
                  setIsIncome(checked as boolean);
                  if (checked) {
                    setRecurrence(undefined);
                  }
                }}
                className="income-checkbox"
                style={{ backgroundColor: "#111111" }}
                disabled={recurrence !== undefined && recurrence !== "unset"}
              />
              <Label htmlFor="income-mode">Income</Label>
            </div>
            <div className="flex-1">
              <Select
                value={recurrence}
                onValueChange={(value) => {
                  setRecurrence(value === "unset" ? undefined : value);
                  if (value !== "unset") {
                    setIsIncome(false);
                  }
                }}
                disabled={isIncome}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not recurring</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ paddingLeft: "1.25rem" }}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="account" className="text-sm font-medium">
              Account
            </label>
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name} (${account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!title.trim() || !amount || !category || !selectedAccount}
          >
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
