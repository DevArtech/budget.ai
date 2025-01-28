from fastapi import APIRouter, Depends
from typing import Annotated

from server.src.models import User, Goal
from server.src.databridge.base_databridge import BaseDatabridge
from server.src.services.authentication_service import AuthenticationService

router = APIRouter(prefix="/goals", tags=["goals"])
auth_service = AuthenticationService()

@router.get("/")
def get_goals(current_user: Annotated[User, Depends(auth_service.get_current_active_user)]):
    db = BaseDatabridge.get_instance()
    goals = db.query("SELECT * FROM goals WHERE user_id = ?", (current_user.id,)).to_dict(orient="records")
    return goals

@router.post("/")
def create_goal(goal: Goal, current_user: Annotated[User, Depends(auth_service.get_current_active_user)]):
    db = BaseDatabridge.get_instance()
    db.execute("INSERT INTO goals (user_id, name, description, amount, date, completed, progress) VALUES (?, ?, ?, ?, ?, ?, ?)", (current_user.id, goal.name, goal.description, goal.amount, goal.date, int(goal.completed), goal.progress))
    return {"message": "Goal created successfully"}

@router.put("/{goal_id}")
def update_goal(goal_id: int, goal: Goal, current_user: Annotated[User, Depends(auth_service.get_current_active_user)]):
    db = BaseDatabridge.get_instance()
    db.execute("UPDATE goals SET name = ?, description = ?, amount = ?, date = ?, completed = ?, progress = ? WHERE id = ?", (goal.name, goal.description, goal.amount, goal.date, int(goal.completed), goal.progress, goal_id))
    return {"message": "Goal updated successfully"}

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, current_user: Annotated[User, Depends(auth_service.get_current_active_user)]):
    db = BaseDatabridge.get_instance()
    db.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
