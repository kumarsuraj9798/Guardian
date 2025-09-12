from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Report(BaseModel):
    text: str | None = None
    audio: str | None = None
    image: str | None = None

@app.post("/classify")
def classify(report: Report):
    return {"service": "Ambulance"}  # mock response