import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import styles from "./Accounts.module.css";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  XAxis,
} from "recharts";
import { AccountDialog } from "@/components/custom/AccountDialog";

interface Transaction {
  id: number;
  title: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  account_id: number;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
  transactions?: Transaction[];
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm">
        <p className="font-medium">
          {payload[0].payload.name}: $
          {payload[0].value?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("http://localhost:8000/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();

      // Fetch transactions for each account
      const accountsWithTransactions = await Promise.all(
        data.map(async (account: Account) => {
          const transactionsResponse = await fetch(
            `http://localhost:8000/accounts/${account.id}/transactions`
          );
          if (transactionsResponse.ok) {
            const transactions = await transactionsResponse.json();
            return { ...account, transactions };
          }
          return account;
        })
      );

      setAccounts(accountsWithTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading accounts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center justify-center h-full">
        {error}
      </div>
    );
  }

  return (
    <div
      className="container mx-auto p-6 flex justify-center items-center"
      style={{ marginTop: "7vh", maxWidth: "100vw", width: "100vw" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="hover:shadow-lg transition-shadow"
            style={{ padding: "0.75rem" }}
          >
            <div className="flex flex-row gap-4">
              <div className="flex flex-col flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <h2 className="text-2xl font-bold">{account.name}</h2>
                  <Badge className={styles["account-badge"]}>
                    {account.type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    $
                    {account.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-base text-gray-500 mt-4">
                    Last updated:{" "}
                    {new Date(account.last_updated).toLocaleDateString()}
                  </div>
                </CardContent>
              </div>
              <div className="w-[300px] h-[175px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      account.transactions
                        ?.sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                        )
                        .reduce(
                          (
                            acc: { name: string; value: number }[],
                            transaction,
                            index,
                            transactions
                          ) => {
                            const date = new Date(transaction.date);
                            const monthYear = date.toLocaleString("default", {
                              month: "short",
                              year: "numeric",
                            });

                            // Calculate balance at this point by starting with initial balance
                            // and applying all transactions up to and including this one
                            const currentBalance =
                              account.balance -
                              transactions
                                .filter((t) => new Date(t.date) > date)
                                .reduce(
                                  (sum, t) =>
                                    sum +
                                    (t.type === "income"
                                      ? t.amount
                                      : -t.amount),
                                  0
                                );

                            const existingEntry = acc.find(
                              (entry) => entry.name === monthYear
                            );

                            if (existingEntry) {
                              existingEntry.value = currentBalance;
                            } else {
                              acc.push({
                                name: monthYear,
                                value: currentBalance,
                              });
                            }
                            return acc;
                          },
                          []
                        ) || []
                    }
                  >
                    <CartesianGrid
                      vertical
                      strokeDasharray="3 3"
                      stroke="#b8babf"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="natural"
                      dataKey="value"
                      stroke="#2130cf"
                      dot={false}
                      activeDot={{ r: 4, fill: "#2130cf" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <AccountDialog onAccountCreated={fetchAccounts} />
    </div>
  );
}
