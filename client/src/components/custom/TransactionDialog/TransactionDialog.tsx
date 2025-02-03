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
import styles from "./TransactionDialog.module.css";
import { TransactionDialogProps } from "@/types";
import { useStore } from "@/store/useStore";

export function TransactionDialog({ onSubmit }: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [recurrence, setRecurrence] = useState<string>();
  const [selectedAccount, setSelectedAccount] = useState<string>();

  const { accounts, fetchAccounts } = useStore();

  useEffect(() => {
    // Fetch accounts when dialog opens
    if (open) {
      fetchAccounts();
    }
  }, [open, fetchAccounts]);

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
        <Button className={styles.newTransactionButton}>New Transaction</Button>
      </DialogTrigger>
      <DialogContent className={styles.transactionDialog}>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.checkboxContainer}>
            <div className={styles.checkboxWrapper}>
              <Checkbox
                id="income-mode"
                checked={isIncome}
                onCheckedChange={(checked) => {
                  setIsIncome(checked as boolean);
                  if (checked) {
                    setRecurrence(undefined);
                  }
                }}
                className={styles.incomeCheckbox}
                disabled={recurrence !== undefined && recurrence !== "unset"}
              />
              <Label htmlFor="income-mode">Income</Label>
            </div>
            <div className={styles.selectContainer}>
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
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.formLabel}>
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.formLabel}>
              Amount
            </label>
            <div className={styles.amountInputWrapper}>
              <span className={styles.currencySymbol}>$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={styles.amountInput}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="date" className={styles.formLabel}>
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="account" className={styles.formLabel}>
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
          <div className={styles.formGroup}>
            <label htmlFor="category" className={styles.formLabel}>
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
            className={styles.submitButton}
            disabled={!title.trim() || !amount || !category || !selectedAccount}
          >
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
