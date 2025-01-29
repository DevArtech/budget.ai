import { TooltipProps } from "recharts";
import styles from "./CustomTooltip.module.css";

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltipContainer}>
        <p className={styles.tooltipText}>
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

export default CustomTooltip;
