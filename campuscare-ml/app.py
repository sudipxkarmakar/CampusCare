from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ComplaintInput(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_complaint(input_data: ComplaintInput):
    return {
        "category": "Other",
        "priority": "Medium"
    }
