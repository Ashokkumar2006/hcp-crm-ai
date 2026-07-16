"""
Run this once to create all tables in your Neon database:
    python create_tables.py
"""
from app.db import Base, engine
from app import models  # noqa: F401  (import so models register on Base.metadata)

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables created in Neon Postgres.")
