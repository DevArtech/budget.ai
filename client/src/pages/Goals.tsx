import React, { useState, ChangeEvent, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import styles from "./Goals.module.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { useStore } from "@/store/useStore";
import type { Goal } from "@/store/useStore";

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const [newGoal, setNewGoal] = useState<Omit<Goal, "id">>({
    name: "",
    description: "",
    amount: 0,
    progress: 0,
    deadline: new Date(),
    completed: false,
  });
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [progressUpdateGoal, setProgressUpdateGoal] = useState<Goal | null>(
    null
  );
  const [newGoalDialogOpen, setNewGoalDialogOpen] = useState(false);
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);

  const {
    goals,
    isLoading,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
  } = useStore();

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async () => {
    await addGoal(newGoal);
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setNewGoal({
      name: "",
      description: "",
      amount: 0,
      progress: 0,
      deadline: new Date(),
      completed: false,
    });
    setNewGoalDialogOpen(false);
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal?.id) return;
    await updateGoal(selectedGoal);
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setSelectedGoal(null);
    setEditGoalDialogOpen(false);
  };

  const handleProgressUpdate = async () => {
    if (!progressUpdateGoal?.id || progressUpdateGoal.progress === undefined)
      return;
    await updateGoalProgress(
      progressUpdateGoal.id,
      progressUpdateGoal.progress
    );
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setProgressUpdateGoal(null);
  };

  const calculateProgress = (savedAmount: number = 0, targetAmount: number) => {
    return (savedAmount / targetAmount) * 100;
  };

  const getDeadlineStatus = (deadline: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0); // Reset time to start of day

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: "text-red-500", text: "Past due" };
    }
    if (diffDays === 0) {
      return { color: "text-red-500", text: "Due today" };
    }
    if (diffDays <= 3) {
      return {
        color: "text-orange-500",
        text: `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
      };
    }
    return {
      color: "text-muted-foreground",
      text: deadlineDate.toLocaleDateString(),
    };
  };

  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading goals...
      </div>
    );
  }

  return (
    <div className="container py-8 pl-7 pr-8 pt-24 w-[100vw]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-[97vw]">
        {goals.map((goal) => (
          <div key={goal.id}>
            <Dialog
              open={editGoalDialogOpen}
              onOpenChange={(open) => {
                setEditGoalDialogOpen(open);
                if (open) {
                  setSelectedGoal(goal);
                } else {
                  setSelectedGoal(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Card
                  className={`${styles.goalCard} cursor-pointer hover:opacity-90 relative group`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="delete-button h-8 w-8 p-0 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!goal.id) return;
                      await deleteGoal(goal.id);
                      if (!localStorage.getItem("token")) {
                        navigate("/login");
                      }
                    }}
                  >
                    <DeleteIcon color="error" fontSize="large" />
                  </Button>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-2">{goal.name}</h2>
                    <p className="text-muted-foreground mb-4">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress
                        value={calculateProgress(
                          goal.progress || 0,
                          goal.amount
                        )}
                        className="flex-1"
                        style={
                          {
                            backgroundColor: "#f0f0f0",
                          } as React.CSSProperties
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgressUpdateGoal(goal);
                        }}
                      >
                        Update Progress
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      ${(goal.progress || 0).toLocaleString()} saved of $
                      {goal.amount.toLocaleString()}
                    </p>
                    <p
                      className={`text-sm ${
                        getDeadlineStatus(goal.deadline).color
                      }`}
                    >
                      Deadline: {getDeadlineStatus(goal.deadline).text}
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent style={{ background: "black" }}>
                <DialogHeader>
                  <DialogTitle>Edit Goal</DialogTitle>
                  <DialogDescription>
                    Update your savings goal details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={selectedGoal?.name || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSelectedGoal((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedGoal?.description || ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setSelectedGoal((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-amount">Amount</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      value={selectedGoal?.amount || 0}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSelectedGoal((prev) =>
                          prev
                            ? { ...prev, amount: Number(e.target.value) }
                            : null
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deadline</Label>
                    <Calendar
                      mode="single"
                      selected={selectedGoal?.deadline}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedGoal((prev) =>
                            prev ? { ...prev, deadline: date } : null
                          );
                        }
                      }}
                      className={`rounded-md border ${styles["calendar"]}`}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateGoal}>Update Goal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={progressUpdateGoal?.id === goal.id}
              onOpenChange={(open) => {
                if (!open) {
                  setProgressUpdateGoal(null);
                }
              }}
            >
              <DialogContent style={{ background: "black" }}>
                <DialogHeader>
                  <DialogTitle>Update Saved Amount</DialogTitle>
                  <DialogDescription>
                    Update how much you've saved towards this goal.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="progress">Amount Saved ($)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max={progressUpdateGoal?.amount}
                      value={progressUpdateGoal?.progress || 0}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProgressUpdateGoal((prev) =>
                          prev
                            ? {
                                ...prev,
                                progress: Number(e.target.value),
                              }
                            : null
                        )
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {progressUpdateGoal ? (
                        <>
                          {calculateProgress(
                            progressUpdateGoal.progress || 0,
                            progressUpdateGoal.amount
                          ).toFixed(1)}
                          % of goal
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleProgressUpdate}>
                    Update Saved Amount
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>

      <Dialog open={newGoalDialogOpen} onOpenChange={setNewGoalDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className={`${styles["new-goal-button"]} fixed bottom-7 right-20`}
            size="lg"
          >
            Create New Goal
          </Button>
        </DialogTrigger>
        <DialogContent style={{ background: "black" }}>
          <DialogHeader>
            <DialogTitle>Create New Savings Goal</DialogTitle>
            <DialogDescription>
              Set up a new savings goal with a target amount and deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newGoal.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewGoal({ ...newGoal, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setNewGoal({ ...newGoal, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newGoal.amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewGoal({
                    ...newGoal,
                    amount: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Calendar
                mode="single"
                selected={newGoal.deadline}
                onSelect={(date) => {
                  if (date) {
                    setNewGoal({ ...newGoal, deadline: date });
                  }
                }}
                className={`rounded-md border ${styles["calendar"]}`}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
