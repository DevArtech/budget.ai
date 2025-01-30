import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import styles from "./CardStyles.module.css";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import TransactionItem from "@/components/custom/TransactionItem/TransactionItem";
import { TransactionDialog } from "@/components/custom/TransactionDialog/TransactionDialog";
import { Transaction } from "@/types";

function TransactionsCard() {
    const navigate = useNavigate();
    const {
        transactions,
        addTransaction,
        deleteTransaction,
      } = useStore();

    const handleNewTransaction = async (transaction: {
        title: string;
        amount: number;
        date: string;
        category: string;
        isIncome: boolean;
        frequency?:
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
    
    const handleDelete = async (transaction: Transaction) => {
        await deleteTransaction(transaction.id, transaction.type);
        if (!localStorage.getItem("token")) {
          navigate("/login");
        }
      };

      
    return (
    <Card className={styles.spanTwoRows}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={styles.transactionsContainer}
            style={{ padding: transactions.length > 0 ? "1rem" : "0" }}
          >
            {transactions.map((transaction, index) => (
              <TransactionItem 
                key={index} 
                transaction={transaction} 
                onDelete={() => handleDelete(transaction)}
              />
            ))}
          </div>
          <div className="new-transaction">
            <TransactionDialog onSubmit={handleNewTransaction} />
          </div>
        </CardContent>
      </Card>
    );
}

export default TransactionsCard;