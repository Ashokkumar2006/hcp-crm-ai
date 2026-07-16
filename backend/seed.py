"""
Run once after create_tables.py to populate test data:
    python seed.py
"""
import uuid
from passlib.hash import bcrypt
from app.db import SessionLocal
from app.models import User, HCP, Material, Sample

db = SessionLocal()

# Test rep user (password: "password123")
rep = User(
    id=str(uuid.uuid4()),
    name="Alex Rep",
    email="alex@repcorp.com",
    hashed_password=bcrypt.hash("password123"),
    role="rep",
)
db.add(rep)

hcps = [
    HCP(id=str(uuid.uuid4()), name="Dr. Smith", specialty="Oncology", hospital_or_clinic="City General Hospital", contact_info="dr.smith@citygeneral.com"),
    HCP(id=str(uuid.uuid4()), name="Dr. Sharma", specialty="Cardiology", hospital_or_clinic="Metro Heart Institute", contact_info="dr.sharma@metroheart.com"),
    HCP(id=str(uuid.uuid4()), name="Dr. Patel", specialty="Endocrinology", hospital_or_clinic="Sunrise Clinic", contact_info="dr.patel@sunriseclinic.com"),
]
db.add_all(hcps)

materials = [
    Material(id=str(uuid.uuid4()), name="Product X Efficacy Brochure", type="brochure"),
    Material(id=str(uuid.uuid4()), name="OncoBoost Phase III PDF", type="clinical_data"),
    Material(id=str(uuid.uuid4()), name="CardioPlus Dosage Guide", type="guide"),
]
db.add_all(materials)

samples = [
    Sample(id=str(uuid.uuid4()), name="Product X 10mg", product_line="Product X"),
    Sample(id=str(uuid.uuid4()), name="OncoBoost 50mg", product_line="OncoBoost"),
]
db.add_all(samples)

db.commit()
db.close()

print("Seed data inserted: 1 rep user, 3 HCPs, 3 materials, 2 samples.")
print("Test login -> email: alex@repcorp.com / password: password123")
