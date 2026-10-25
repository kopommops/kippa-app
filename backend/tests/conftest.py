import os

# Ensure imports during test collection use a disposable test database, never a developer's .env database.
os.environ["DATABASE_URL"] = "sqlite:///./test_pelo_implementation.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-value-with-enough-entropy-123456789"
os.environ["GROQ_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient
from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_test_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
