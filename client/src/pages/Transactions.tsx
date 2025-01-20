import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionDialog } from "@/components/custom/TransactionDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import HouseIcon from "@mui/icons-material/House";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import DeleteIcon from "@mui/icons-material/Delete";
import WorkIcon from "@mui/icons-material/Work";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: number;
  title: string;
  date: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  account_id: number;
  backgroundColor?: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
}

function TransactionItem({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="transaction-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-row items-center gap-4">
        {transaction.category === "Housing" && (
          <HouseIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Food" && (
          <FastfoodIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Transportation" && (
          <DirectionsBusIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Utilities" && (
          <WaterDropIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Entertainment" && (
          <TheaterComedyIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Work" && (
          <WorkIcon sx={{ color: transaction.backgroundColor }} />
        )}
        <div className="flex flex-col">
          <p className="text-lg font-bold">{transaction.title}</p>
          <p className="text-sm text-gray-500">{transaction.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p
          className="text-lg font-bold"
          style={{
            color: transaction.type === "income" ? "#22c55e" : "#ef4444",
          }}
        >
          {transaction.type === "income" ? "+" : "-"}${transaction.amount}
        </p>
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className="delete-button h-8 w-8 p-0"
            onClick={onDelete}
          >
            <DeleteIcon color="error" fontSize="large" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const categories = {
    Housing: "#FF6B6B",
    Food: "#4ECDC4",
    Transportation: "#45B7D1",
    Utilities: "#96CEB4",
    Entertainment: "#FFEEAD",
    Work: "#D4A5A5",
  };

  const fetchTransactions = async () => {
    try {
      let url = "http://localhost:8000/transactions";
      if (selectedAccount !== "all") {
        url = `http://localhost:8000/accounts/${selectedAccount}/transactions`;
      }
      const response = await fetch(url);
      const data = await response.json();
      const transactionsWithColors = data.map((t: Transaction) => ({
        ...t,
        backgroundColor:
          categories[t.category as keyof typeof categories] || "#8884d8",
      }));
      setTransactions(transactionsWithColors);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("http://localhost:8000/accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedAccount]);

  const handleNewTransaction = async (transaction: {
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
  }) => {
    try {
      const response = await fetch(
        `http://localhost:8000/${transaction.isIncome ? "income" : "expenses"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      const endpoint = transaction.type === "income" ? "income" : "expenses";
      const response = await fetch(
        `http://localhost:8000/${endpoint}/${transaction.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{ marginTop: "10vh" }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label>Filter by Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TransactionDialog onSubmit={handleNewTransaction} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500">No transactions found</p>
            ) : (
              transactions.map((transaction) => (
                <TransactionItem
                  key={`${transaction.id}-${transaction.type}`}
                  transaction={transaction}
                  onDelete={() => handleDeleteTransaction(transaction)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
