import { Transaction } from "@/types";
import HouseIcon from "@mui/icons-material/House";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import DeleteIcon from "@mui/icons-material/Delete";
import WorkIcon from "@mui/icons-material/Work";
import HandymanIcon from "@mui/icons-material/Handyman";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import FlightIcon from "@mui/icons-material/Flight";
import CategoryIcon from "@mui/icons-material/Category";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./TransactionItem.module.css";

function TransactionItem({
  transaction,
  onDelete,
  style,
}: {
  transaction: Transaction;
  onDelete: () => void;
  style?: React.CSSProperties;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={style}
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.flexRow}>
        {transaction.category === "Housing" && (
          <HouseIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {(transaction.category === "Food" || 
          transaction.category === "Food and Drink") && (
          <FastfoodIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Transportation" && (
          <DirectionsBusIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Utilities" && (
          <WaterDropIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {(transaction.category === "Entertainment" || 
          transaction.category === "Recreation") && (
          <TheaterComedyIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Work" && (
          <WorkIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Service" && (
          <HandymanIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Shops" && (
          <StorefrontIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Transfer" && (
          <SyncAltIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Travel" && (
          <FlightIcon sx={{ color: transaction.backgroundColor }} />
        )}
        {transaction.category === "Other" && (
          <CategoryIcon sx={{ color: transaction.backgroundColor }} />
        )}
        <div className={styles.flexCol}>
          <p className={styles.titleText}>
            {transaction.title}
          </p>
          <p className={styles.dateText}>{transaction.date}</p>
        </div>
      </div>
      <div className={styles.amountContainer}>
        <p
          className={styles.amountText}
          style={{
            color: transaction.type === "income" ? "#22c55e" : "#ef4444",
          }}
        >
          {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
        </p>
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className={styles.deleteButton}
            onClick={onDelete}
          >
            <DeleteIcon color="error" fontSize="large" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default TransactionItem;
