import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta

from server.src.models import UserInDB, TokenData, NewUser
from server.src.settings import settings
from server.src.databridge.base_databridge import BaseDatabridge

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class AuthenticationService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.db = BaseDatabridge.get_instance()
        self.SECRET_KEY = settings.jwt_secret_key
        self.ALGORITHM = settings.jwt_algorithm
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def get_user(self, username: str) -> UserInDB | None:
        user = self.db.query(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).to_dict(orient="records")
        if user:
            user[0]["disabled"] = bool(user[0]["disabled"])
            return UserInDB(**user[0])

    def create_user(self, user: NewUser):
        hashed_password = self.get_password_hash(user.password)
        existing_username = self.db.query(
            "SELECT username FROM users WHERE username = ?", (user.username,)
        ).to_dict(orient="records")
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
            )

        existing_email = self.db.query(
            "SELECT email FROM users WHERE email = ?", (user.email,)
        ).to_dict(orient="records")
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            )
        self.db.execute(
            "INSERT INTO users (username, full_name, email, disabled, hashed_password) VALUES (?, ?, ?, ?, ?)",
            (user.username, user.full_name, user.email, False, hashed_password),
        )
        return self.authenticate_user(user.username, user.password)

    def authenticate_user(self, username: str, password: str) -> bool:
        user = self.get_user(username)
        if not user:
            return False
        if not self.verify_password(password, user.hashed_password):
            return False
        return user

    def create_access_token(
        self, data: dict, expires_delta: timedelta | None = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(
                token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
            token_data = TokenData(username=username)
        except InvalidTokenError:
            raise credentials_exception
        user = (
            BaseDatabridge.get_instance()
            .query("SELECT * FROM users WHERE username = ?", (token_data.username,))
            .to_dict(orient="records")
        )
        if not user or user is None:
            raise credentials_exception
        return UserInDB(**user[0])

    @staticmethod
    async def get_current_active_user(
        current_user: Annotated[UserInDB, Depends(get_current_user)]
    ):
        current_user = await current_user
        if current_user.disabled:
            raise HTTPException(status_code=400, detail="Inactive user")
        return current_user
