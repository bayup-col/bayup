from fastapi import FastAPI

app = FastAPI(title="BaseCommerce API")

@app.get("/")
def read_root():
    return {"message": "BaseCommerce API is running"}
