from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict

app = FastAPI(
    title="Legato API Gateway",
    description="API Gateway for Legato Platform Microservices",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from environment
SERVICE_URLS = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "user": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "content": os.getenv("CONTENT_SERVICE_URL", "http://content-service:8003"),
    "ip": os.getenv("IP_SERVICE_URL", "http://ip-service:8004"),
    "payment": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8005"),
    "ai": os.getenv("AI_SERVICE_URL", "http://ai-service:8006"),
    "analytics": os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8007"),
    "community": os.getenv("COMMUNITY_SERVICE_URL", "http://community-service:8008"),
}

@app.get("/")
async def root():
    return {"message": "Legato API Gateway", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Gateway health check endpoint"""
    service_health = {}
    
    async with httpx.AsyncClient() as client:
        for service_name, service_url in SERVICE_URLS.items():
            try:
                response = await client.get(f"{service_url}/health", timeout=5.0)
                service_health[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds()
                }
            except Exception as e:
                service_health[service_name] = {
                    "status": "unreachable",
                    "error": str(e)
                }
    
    all_healthy = all(service["status"] == "healthy" for service in service_health.values())
    
    return {
        "gateway_status": "healthy",
        "services": service_health,
        "overall_status": "healthy" if all_healthy else "degraded"
    }

async def proxy_request(service_name: str, path: str, request: Request):
    """Proxy requests to appropriate microservice"""
    if service_name not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    service_url = SERVICE_URLS[service_name]
    target_url = f"{service_url}{path}"
    
    # Forward headers (excluding host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    async with httpx.AsyncClient() as client:
        try:
            if request.method == "GET":
                response = await client.get(target_url, headers=headers, params=request.query_params)
            elif request.method == "POST":
                body = await request.body()
                response = await client.post(target_url, headers=headers, content=body)
            elif request.method == "PUT":
                body = await request.body()
                response = await client.put(target_url, headers=headers, content=body)
            elif request.method == "DELETE":
                response = await client.delete(target_url, headers=headers)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")
            
            return response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gateway error: {str(e)}")

# Route definitions for each service
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_proxy(path: str, request: Request):
    return await proxy_request("auth", f"/{path}", request)

@app.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def user_proxy(path: str, request: Request):
    return await proxy_request("user", f"/{path}", request)

@app.api_route("/content/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def content_proxy(path: str, request: Request):
    return await proxy_request("content", f"/{path}", request)

@app.api_route("/ip/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def ip_proxy(path: str, request: Request):
    return await proxy_request("ip", f"/{path}", request)

@app.api_route("/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def payment_proxy(path: str, request: Request):
    return await proxy_request("payment", f"/{path}", request)

@app.api_route("/ai/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def ai_proxy(path: str, request: Request):
    return await proxy_request("ai", f"/{path}", request)

@app.api_route("/analytics/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def analytics_proxy(path: str, request: Request):
    return await proxy_request("analytics", f"/{path}", request)

@app.api_route("/community/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def community_proxy(path: str, request: Request):
    return await proxy_request("community", f"/{path}", request)