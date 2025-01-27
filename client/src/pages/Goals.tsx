import React, { useState, ChangeEvent, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import styles from './Goals.module.css';

interface Goal {
  id?: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: Date;
}

const mockGoals: Goal[] = [
  {
    id: 1,
    title: "New Car Down Payment",
    description: "Saving for a down payment on a Tesla Model 3",
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: new Date('2024-12-31')
  },
  {
    id: 2,
    title: "Emergency Fund",
    description: "Building a 6-month emergency fund for unexpected expenses",
    targetAmount: 15000,
    currentAmount: 8750,
    deadline: new Date('2024-09-30')
  },
  {
    id: 3,
    title: "Dream Vacation",
    description: "Trip to Japan during cherry blossom season",
    targetAmount: 5000,
    currentAmount: 1200,
    deadline: new Date('2025-03-15')
  },
  {
    id: 4,
    title: "Home Renovation",
    description: "Kitchen remodeling project",
    targetAmount: 25000,
    currentAmount: 12000,
    deadline: new Date('2025-06-30')
  }
];

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [newGoal, setNewGoal] = useState<Goal>({
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: new Date(),
  });

//   useEffect(() => {
//     fetchGoals();
//   }, []);

//   const fetchGoals = async () => {
//     try {
//       const response = await fetch('/api/goals');
//       if (response.ok) {
//         const data = await response.json();
//         setGoals(data);
//       }
//     } catch (error) {
//       console.error('Error fetching goals:', error);
//     }
//     };

    const handleCreateGoal = () => {
        const createdGoal = {
          ...newGoal,
          id: goals.length + 1,
          currentAmount: 0,
        };
    }

//   const handleCreateGoal = async () => {
//     try {
//       const response = await fetch('/api/goals', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(newGoal),
//       });

//       if (response.ok) {
//         const createdGoal = await response.json();
//     setGoals([...goals, createdGoal]);
//     setNewGoal({
//       title: '',
//       description: '',
//       targetAmount: 0,
//       currentAmount: 0,
//       deadline: new Date(),
//     });
//       }
//     } catch (error) {
//       console.error('Error creating goal:', error);
//     }
//   };

  const calculateProgress = (currentAmount: number = 0, targetAmount: number) => {
    return (currentAmount / targetAmount) * 100;
  };

  return (
    <div className="container py-8">
      <div className={styles.header}>
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
              <DialogDescription>
                Set up a new savings goal with a target amount and deadline.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Deadline</Label>
                <Calendar
                  mode="single"
                  selected={newGoal.deadline}
                  onSelect={(date) => date && setNewGoal({ ...newGoal, deadline: date })}
                  className="rounded-md border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {goals.map((goal) => (
          <Card key={goal.id} className={styles.goalCard}>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">{goal.title}</h2>
              <p className="text-muted-foreground mb-4">{goal.description}</p>
              <Progress 
                value={calculateProgress(goal.currentAmount, goal.targetAmount)} 
                className="mb-2"
              />
              <p className="text-sm text-muted-foreground mb-1">
                ${goal.currentAmount?.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Deadline: {new Date(goal.deadline).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Goals; 