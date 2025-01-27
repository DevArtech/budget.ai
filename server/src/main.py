from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.src.routers.auth import router as auth_router
from server.src.routers.expenses import router as expenses_router
from server.src.routers.income import router as income_router
from server.src.routers.transactions import router as transactions_router
from server.src.routers.accounts import router as accounts_router
from server.src.routers.spend import router as spend_router
from server.src.routers.assistant import router as assistant_router
from server.src.routers.plaid import router as plaid_router
from server.src.routers.goals import router as goals_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(plaid_router)
app.include_router(transactions_router)
app.include_router(expenses_router)
app.include_router(income_router)
app.include_router(accounts_router)
app.include_router(spend_router)
app.include_router(assistant_router)
app.include_router(goals_router)
