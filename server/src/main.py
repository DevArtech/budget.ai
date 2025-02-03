from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

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
primary = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files
app.mount("/assets", StaticFiles(directory="./client/dist/assets"), name="assets")

# Add API prefix to all routers
primary.include_router(auth_router)
primary.include_router(plaid_router)
primary.include_router(transactions_router)
primary.include_router(expenses_router)
primary.include_router(income_router)
primary.include_router(accounts_router)
primary.include_router(spend_router)
primary.include_router(assistant_router)
primary.include_router(goals_router)

app.include_router(primary)

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Serve the index.html for any path that doesn't match an API route
    if not full_path.startswith("api/"):
        return FileResponse("./client/dist/index.html")
