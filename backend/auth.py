import os
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db 
from models import User
from schemas import RegisterIn, LoginIn, UserOut, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])

# 傳統 JWT 配置（保留作為後備）
SECRET_KEY = os.getenv("SECRET_KEY", "change_me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# 初始化 Firebase Admin SDK
def init_firebase():
    """確保 Firebase 已初始化"""
    try:
        # 檢查是否已初始化
        firebase_admin.get_app()
        return True
    except ValueError:
        # 尚未初始化，進行初始化
        pass
    
    try:
        import json
        import base64
        
        # 方法1: 嘗試 Base64 編碼的環境變數
        firebase_cred_b64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
        if firebase_cred_b64:
            try:
                decoded = base64.b64decode(firebase_cred_b64).decode('utf-8')
                cred_dict = json.loads(decoded)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK 已初始化（使用 Base64 環境變數）")
                return True
            except Exception as e:
                print(f"❌ Base64 解碼失敗: {e}")
        
        # 方法2: 嘗試 JSON 環境變數
        firebase_cred_json = os.getenv("FIREBASE_CREDENTIALS")
        if firebase_cred_json:
            try:
                cred_dict = json.loads(firebase_cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK 已初始化（使用 JSON 環境變數）")
                return True
            except json.JSONDecodeError as je:
                print(f"❌ JSON 解析失敗: {je}")
        
        # 方法3: 嘗試從檔案讀取（本地開發）
        firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if firebase_cred_path and os.path.exists(firebase_cred_path):
            cred = credentials.Certificate(firebase_cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK 已初始化（使用服務帳號檔案）")
            return True
        
        print("⚠️  未找到 Firebase 憑證")
        return False
    except Exception as e:
        print(f"⚠️  Firebase Admin SDK 初始化失敗: {e}")
        return False

# 嘗試初始化
init_firebase()

pwd = CryptContext(schemes=["argon2"], deprecated="auto")
print("Hash scheme:", pwd.schemes())

# 使用 HTTPBearer 替代 OAuth2PasswordBearer（更適合 Firebase JWT）
security = HTTPBearer()

def create_token(sub: int) -> str:
    """建立傳統 JWT token（保留作為後備）"""
    payload = {
        "sub": str(sub),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_MIN),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_firebase_token(token: str) -> dict:
    """驗證 Firebase ID Token"""
    # 確保 Firebase 已初始化
    if not init_firebase():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase 未正確設定"
        )
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase token 驗證失敗: {str(e)}"
        )

def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """驗證使用者身份（支援 Firebase JWT 和傳統 JWT）"""
    token = credentials.credentials
    
    # 首先嘗試 Firebase JWT 驗證
    try:
        firebase_token = verify_firebase_token(token)
        firebase_uid = firebase_token.get("uid")
        email = firebase_token.get("email")
        name = firebase_token.get("name") or email.split("@")[0] if email else "User"
        
        if not firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase token 無效"
            )
        
        # 查找或建立使用者
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            # 如果使用者不存在，建立新使用者
            if email:
                # 檢查是否已有相同 email 的使用者
                existing_user = db.query(User).filter(User.email == email).first()
                if existing_user:
                    # 更新現有使用者的 firebase_uid
                    existing_user.firebase_uid = firebase_uid
                    user = existing_user
                else:
                    # 建立新使用者
                    user = User(
                        name=name,
                        email=email,
                        firebase_uid=firebase_uid,
                        password=None
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Firebase token 缺少 email 資訊"
                )
        
        return user
        
    except HTTPException:
        raise
    except Exception as firebase_error:
        print(f"🔍 Firebase 驗證錯誤: {firebase_error}")
        # 如果 Firebase 驗證失敗，嘗試傳統 JWT 驗證（後備）
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            uid = data.get("sub")
            if uid is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="未授權"
                )
            user = db.get(User, int(uid))
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="未授權"
                )
            return user
        except (JWTError, ValueError, TypeError) as jwt_error:
            print(f"🔍 JWT 驗證錯誤: {jwt_error}")
            # 返回 Firebase 錯誤（因為這是主要驗證方式）
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"驗證失敗: {str(firebase_error)}"
            )

# Routes
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    """註冊使用者（支援 Firebase 和傳統方式）"""
    # 檢查 email 是否已存在
    existing_user = db.query(User).filter(User.email == body.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email 已註冊")
    
    # Firebase 註冊（有 firebase_uid）
    if body.firebase_uid:
        # 檢查 firebase_uid 是否已存在
        if db.query(User).filter(User.firebase_uid == body.firebase_uid).first():
            raise HTTPException(status_code=400, detail="Firebase UID 已註冊")
        user = User(
            name=body.name,
            email=body.email,
            firebase_uid=body.firebase_uid,
            password=None
        )
    else:
        # 傳統註冊（需要密碼）
        if not body.password:
            raise HTTPException(status_code=400, detail="密碼為必填")
        if len(body.password) > 72:
            raise HTTPException(status_code=400, detail="密碼太長")
        user = User(
            name=body.name,
            email=body.email,
            password=pwd.hash(body.password),
            firebase_uid=None
        )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    """傳統登入方式（保留作為後備）"""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")
    if not pwd.verify(body.password, user.password):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")
    return TokenOut(access_token=create_token(user.id))

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    """取得目前使用者資訊"""
    return user
