import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionDialog } from "@/components/custom/TransactionDialog/TransactionDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Settings2 } from "lucide-react";
import { format } from "date-fns";
import "./Transactions.module.css";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Transaction } from "@/types";
import TransactionItem from "@/components/custom/TransactionItem/TransactionItem";

type TransactionView = "recent" | "past" | "pending";

export default function Transactions() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedView, setSelectedView] = useState<TransactionView>(
    window.innerWidth <= 768 ? "past" : "recent"
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const {
    transactions,
    accounts,
    selectedAccountId,
    isLoading,
    accountsLoaded,
    transactionsLoaded,
    fetchAccounts,
    fetchAccountTransactions,
    addTransaction,
    deleteTransaction,
    setSelectedAccountId,
  } = useStore();

  useEffect(() => {
    const loadInitialData = async () => {
      // Only fetch accounts if not already loaded
      if (!accountsLoaded) {
        await fetchAccounts();
      }
      // Only fetch transactions if not already loaded
      if (!transactionsLoaded) {
        await fetchAccountTransactions("all");
      }
    };
    loadInitialData();
  }, [accountsLoaded, transactionsLoaded]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Update selectedView when switching between mobile and desktop
      if (mobile && selectedView === "recent") {
        setSelectedView("past");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedView]);

  const categorizeTransactions = (transactions: Transaction[]) => {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // Filter transactions by search query
    const searchFiltered = transactions.filter((t) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        t.date.includes(query)
      );
    });

    // Filter transactions by date range if set
    const filteredTransactions = searchFiltered.filter((t) => {
      if (!dateRange.from && !dateRange.to) return true;
      const transactionDate = new Date(t.date);
      const isAfterFrom = !dateRange.from || transactionDate >= dateRange.from;
      const isBeforeTo = !dateRange.to || transactionDate <= dateRange.to;
      return isAfterFrom && isBeforeTo;
    });

    return {
      recent: filteredTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate <= now && transactionDate >= threeDaysAgo;
      }),
      past: filteredTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate < threeDaysAgo;
      }),
      pending: filteredTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate > now;
      }),
    };
  };

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
    await addTransaction(transaction);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    await deleteTransaction(transaction.id, transaction.type);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading transactions...
      </div>
    );
  }

  const FilterDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-20 right-4 z-50 rounded-full bg-[#2130cf] border-none"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        style={{ backgroundColor: "black" }}
        className="md:scale-100 scale-[0.9] origin-center"
      >
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Filter by Account</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger>
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

          <div className="flex flex-col gap-2">
            <Label>Date Range</Label>
            <div className="flex flex-col gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-black"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, "MM/dd/yyyy")
                    ) : (
                      <span>From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, from: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-black"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, "MM/dd/yyyy")
                    ) : (
                      <span>To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                className="bg-black"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div
      className="p-4 w-[100vw] flex flex-col items-center"
      style={{ marginTop: "10vh" }}
    >
      {isMobile ? (
        <>
          <div className="w-full mb-4 px-4">
            <input
              type="text"
              placeholder="Search by title, amount, date, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background bg-white text-black"
            />
          </div>

          <div className="w-full mb-4 px-4">
            <Select
              value={selectedView}
              onValueChange={(value: TransactionView) => setSelectedView(value)}
            >
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent Transactions</SelectItem>
                <SelectItem value="past">Past Transactions</SelectItem>
                <SelectItem value="pending">Pending Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FilterDialog />
          <TransactionDialog onSubmit={handleNewTransaction} />

          <Card className="w-full mt-4">
            <CardHeader>
              <CardTitle>
                {selectedView === "recent" && "Recent Transactions"}
                {selectedView === "past" && "Past Transactions"}
                {selectedView === "pending" && "Pending Transactions"}
              </CardTitle>
              {selectedView === "recent" && (
                <p className="text-sm text-gray-500">Last 3 days</p>
              )}
              {selectedView === "past" && (
                <p className="text-sm text-gray-500">Older than 3 days</p>
              )}
              {selectedView === "pending" && (
                <p className="text-sm text-gray-500">Future dates</p>
              )}
            </CardHeader>
            <CardContent className="h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No transactions found
                  </p>
                ) : (
                  categorizeTransactions(transactions)[selectedView].map(
                    (transaction) => (
                      <TransactionItem
                        key={`${transaction.id}-${transaction.type}`}
                        transaction={transaction}
                        onDelete={() => handleDeleteTransaction(transaction)}
                      />
                    )
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Desktop view - existing code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Search Transactions</Label>
                  <input
                    type="text"
                    placeholder="Search by title, amount, date, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[300px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Filter by Account</Label>
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id.toString()}
                        >
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[150px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "MM/dd/yyyy")
                          ) : (
                            <span>From date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, from: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[150px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "MM/dd/yyyy")
                          ) : (
                            <span>To date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, to: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDateRange({ from: undefined, to: undefined })
                      }
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <TransactionDialog onSubmit={handleNewTransaction} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="w-[25vw]">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <p className="text-sm text-gray-500">Last 3 days</p>
              </CardHeader>
              <CardContent className="h-[55vh] overflow-y-auto">
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No transactions found
                    </p>
                  ) : (
                    categorizeTransactions(transactions).recent.map(
                      (transaction) => (
                        <TransactionItem
                          key={`${transaction.id}-${transaction.type}`}
                          transaction={transaction}
                          onDelete={() => handleDeleteTransaction(transaction)}
                        />
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="w-[25vw]">
              <CardHeader>
                <CardTitle>Past Transactions</CardTitle>
                <p className="text-sm text-gray-500">Older than 3 days</p>
              </CardHeader>
              <CardContent className="h-[55vh] overflow-y-auto">
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No transactions found
                    </p>
                  ) : (
                    categorizeTransactions(transactions).past.map(
                      (transaction) => (
                        <TransactionItem
                          key={`${transaction.id}-${transaction.type}`}
                          transaction={transaction}
                          onDelete={() => handleDeleteTransaction(transaction)}
                        />
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="w-[25vw]">
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <p className="text-sm text-gray-500">Future dates</p>
              </CardHeader>
              <CardContent className="h-[55vh] overflow-y-auto">
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No transactions found
                    </p>
                  ) : (
                    categorizeTransactions(transactions).pending.map(
                      (transaction) => (
                        <TransactionItem
                          key={`${transaction.id}-${transaction.type}`}
                          transaction={transaction}
                          onDelete={() => handleDeleteTransaction(transaction)}
                        />
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
