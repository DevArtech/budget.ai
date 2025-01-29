import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DayCheckboxProps } from "@/types";

function DayCheckbox({ value, selected, onChange }: DayCheckboxProps) {
    const [isSelected, setIsSelected] = useState(selected || false);
  
    const handleClick = () => {
      const newSelected = !isSelected;
      setIsSelected(newSelected);
      onChange(value, newSelected);
    };
  
    return (
      <Button
        style={{
          backgroundColor: isSelected ? "#4ade80" : "#eff0f3",
          color: isSelected ? "white" : "black",
        }}
        onClick={handleClick}
      >
        {value}
      </Button>
    );
  }

export default DayCheckbox;
