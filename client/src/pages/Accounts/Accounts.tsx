import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeleteIcon from "@mui/icons-material/Delete";
import styles from "./Accounts.module.css";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";
import { AccountDialog } from "@/components/custom/AccountDialog/AccountDialog";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import CustomTooltip from "@/components/custom/CustomTooltip/CustomTooltip";

export default function Accounts() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { accounts, isLoading, fetchAccounts, addAccount, deleteAccount } =
    useStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadAccounts = async () => {
      await fetchAccounts();
      if (!localStorage.getItem("token")) {
        navigate("/login");
      }
    };
    loadAccounts();
  }, [fetchAccounts, navigate]);

  const handleAccountCreated = async (account: {
    name: string;
    type: string;
    balance: number;
  }) => {
    await addAccount(account);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading accounts...
      </div>
    );
  }

  return (
    <div
      className="container mx-auto p-6 flex justify-center items-center"
      style={{ marginTop: "7vh", maxWidth: "100vw", width: "100vw" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {accounts.length > 0 &&
          accounts.map((account) => (
            <Card
              key={account.id}
              className="hover:shadow-lg transition-shadow relative group"
              style={{ padding: "0.75rem" }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="z-[100] absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteAccount(account.id)}
              >
                <DeleteIcon color="error" />
              </Button>
              <div
                className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}
              >
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
                <div
                  className={`${isMobile ? "w-full" : "w-[300px]"} ${
                    isMobile ? "h-[200px]" : "h-[175px]"
                  }`}
                >
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
                              _,
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
        {accounts.length === 0 && (
          <h2 className="flex items-center justify-center h-full col-span-full text-black text-2xl min-h-[50vh]">
            You don't seem to have any accounts...
          </h2>
        )}
      </div>
      <AccountDialog onAccountCreated={handleAccountCreated} />
    </div>
  );
}
