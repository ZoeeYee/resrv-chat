import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

_engine = None
_SessionLocal = None


def init_engine():
    global _engine, _SessionLocal
    if _engine is not None:
        return

    db_url = os.getenv("DATABASE_URL")
    
    # 如果沒有設置 DATABASE_URL，使用 SQLite 作為本地開發的默認選項
    if not db_url:
        # 使用 SQLite 作為本地開發數據庫
        db_url = "sqlite:///./resrv.db"
        print("⚠️  未設置 DATABASE_URL，使用 SQLite 數據庫: resrv.db")
        connect_args = {}
    else:
        # PostgreSQL 連接參數（只有 PostgreSQL 才需要 sslmode）
        if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
            connect_args = {"sslmode": "require"} if "sslmode=" not in db_url else {}
        else:
            # SQLite 或其他資料庫不需要 sslmode
            connect_args = {}

    _engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_engine():
    init_engine()
    return _engine


def get_db() -> Generator:
    if _SessionLocal is None:
        init_engine()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
