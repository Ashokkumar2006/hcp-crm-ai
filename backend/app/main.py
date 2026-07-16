from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HCP CRM - AI Interaction Logging API")

# Allow the local React dev server (and later your deployed frontend URL) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server default
        "http://localhost:3000",   # CRA default, just in case
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


from app.routers import hcps, catalog, interactions, agent, auth

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(hcps.router, prefix="/hcps", tags=["hcps"])
app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
app.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])
