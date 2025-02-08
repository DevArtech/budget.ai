import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import styles from "./CardStyles.module.css";
import { SpendSettingsDialog } from "@/components/custom/SpendSettingsDialog/SpendSettingsDialog";
import { useStore } from "@/store/useStore";
import DayCheckbox from "@/components/custom/DayCheckbox/DayCheckbox";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SpendCard() {
  const navigate = useNavigate();
  const [barData, setBarData] = useState<unknown[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [spendData, setSpendData] = useState([
    {
      name: "Safe-to-Spend",
      value: 0,
      fill: "#82ca9d",
    },
    {
      name: "Dummy",
      value: 0,
      fill: "#82ca9d",
    },
  ]);

  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Sun: true,
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
  });

  const {
    warningPosition,
    transactions,
    budgetAllotment,
    spendOverTime,
    updateWarningPosition,
    refreshBudgetData,
  } = useStore();

  const [containerWidth, setContainerWidth] = useState(window.innerWidth * 0.8);

  useEffect(() => {
    const modifiedData = spendData.map((item) => {
      if (item.name === "Safe-to-Spend" && item.value === 0) {
        return { ...item, value: 0.01 };
      }
      return item;
    });
    setBarData(modifiedData);
  }, [spendData]);

  const handleDaySelect = (day: string, isSelected: boolean) => {
    const dayMap: { [key: string]: string } = {
      M: "Mon",
      T: "Tue",
      W: "Wed",
      R: "Thu",
      F: "Fri",
    };

    let mappedDay;
    if (day === "S") {
      // Get all day buttons
      const buttons = document.querySelectorAll(".day-buttons button");
      // If this is the first button (index 0), it's Sunday
      const buttonIndex = Array.from(buttons).findIndex(
        (button) => button === document.activeElement
      );
      mappedDay = buttonIndex === 0 ? "Sun" : "Sat";
    } else {
      mappedDay = dayMap[day];
    }

    setSelectedDays((prev) => ({ ...prev, [mappedDay]: isSelected }));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setContainerWidth(window.innerWidth * 0.8);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const calculateSpendForSelectedDays = () => {
      const selectedDayCount =
        Object.values(selectedDays).filter(Boolean).length || 1;
      const dailyBudget = budgetAllotment / 7;
      const selectedDaysBudget = dailyBudget * selectedDayCount;

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const selectedDaysSpend = transactions
        .filter((transaction) => {
          if (transaction.type !== "expense") return false;

          const transactionDate = new Date(transaction.date);
          const dayOfWeek = transactionDate.getDay();
          const dayMap: { [key: number]: string } = {
            0: "Sun",
            1: "Mon",
            2: "Tue",
            3: "Wed",
            4: "Thu",
            5: "Fri",
            6: "Sat",
          };

          return (
            transactionDate >= startOfWeek &&
            transactionDate <= today &&
            selectedDays[dayMap[dayOfWeek]]
          );
        })
        .reduce((total, transaction) => total + transaction.amount, 0);

      const safeToSpend = Math.max(0, selectedDaysBudget - selectedDaysSpend);
      const spendPercentage =
        100 - (selectedDaysSpend / selectedDaysBudget) * 100;
      const isNearWarning = warningPosition >= spendPercentage;

      setSpendData([
        {
          name: "Safe-to-Spend",
          value: safeToSpend,
          fill: isNearWarning ? "#ffd700" : "#82ca9d",
        },
        {
          name: "Dummy",
          value: selectedDaysBudget,
          fill: isNearWarning ? "#ffd700" : "#82ca9d",
        },
      ]);
    };

    calculateSpendForSelectedDays();
  }, [
    selectedDays,
    budgetAllotment,
    transactions,
    warningPosition,
    spendOverTime,
  ]);

  useEffect(() => {
    const modifiedData = spendData.map((item) => {
      if (item.name === "Safe-to-Spend" && item.value === 0) {
        return { ...item, value: 0.01 };
      }
      return item;
    });
    setBarData(modifiedData);
  }, [spendData]);

  const handleWarningPositionChange = async (position: number) => {
    await updateWarningPosition(position);
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  const handleSavingsPercentChange = async () => {
    await refreshBudgetData();
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  };

  const getRadialPosition = (percentage: number) => {
    // Convert percentage (0-100) to angle between startAngle (-30) and endAngle (210)
    const startAngle = -20;
    const endAngle = 200;
    const angleInDegrees =
      startAngle + (percentage / 100) * (endAngle - startAngle);
    const angleInRadians = (angleInDegrees * Math.PI) / 180;

    // Calculate x and y coordinates on a circle
    const offset = 255;
    const x = -Math.cos(angleInRadians) * offset;
    const y = -Math.sin(angleInRadians) * offset;

    // Return transform CSS with coordinates clamped between -315 and 315
    return {
      transform: `translate(${Math.max(-315, Math.min(315, x))}%, ${Math.max(
        -315,
        Math.min(315, y)
      )}%) rotate(${90 + angleInDegrees}deg)`,
    };
  };

  return (
    <Card>
      <CardHeader className={styles.cardHeader}>
        <CardTitle
          className={styles.cardTitle}
          style={
            isMobile
              ? { width: "100%", textAlign: "center", paddingLeft: "12.5%" }
              : {}
          }
        >
          Spend
        </CardTitle>
        <SpendSettingsDialog
          onWarningPositionChange={handleWarningPositionChange}
          onSavingsPercentChange={handleSavingsPercentChange}
        />
      </CardHeader>
      <CardContent>
        <div className={styles.spendContainer}>
          <div className={styles.spendRelativeContainer}>
            <ResponsiveContainer
              width={isMobile ? containerWidth : 300}
              height={350}
            >
              <RadialBarChart
                innerRadius="90%"
                outerRadius="150%"
                data={barData}
                startAngle={210}
                endAngle={-30}
                style={{ position: "relative" }}
              >
                <RadialBar
                  className={styles.radialBar}
                  background
                  dataKey="value"
                  cornerRadius={30}
                  fill={spendData[0].fill}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={styles.warningIndicatorContainer}>
              <div className={styles.warningIndicatorInner}>
                <div
                  className={styles.warningLabel}
                  style={getRadialPosition(warningPosition)}
                >
                  <span className={styles.warningLine} />
                </div>
              </div>
            </div>
            <div className={styles.spendValueContainer}>
              <div
                className={styles.spendValue}
                style={{ color: spendData[0].fill }}
              >
                ${Math.floor(spendData[0].value).toString()}
                <sup className={styles.spendValueDecimal}>
                  {(spendData[0].value % 1).toFixed(2).substring(1)}
                </sup>
              </div>
              <div className={styles.spendName}>{spendData[0].name}</div>
              <div className={styles.spendDate}>Apr 28 - May 4</div>
            </div>
            <div className={styles.dayButtons}>
              <DayCheckbox
                value="S"
                selected={selectedDays.Sun}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="M"
                selected={selectedDays.Mon}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="T"
                selected={selectedDays.Tue}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="W"
                selected={selectedDays.Wed}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="R"
                selected={selectedDays.Thu}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="F"
                selected={selectedDays.Fri}
                onChange={handleDaySelect}
              />
              <DayCheckbox
                value="S"
                selected={selectedDays.Sat}
                onChange={handleDaySelect}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SpendCard;
