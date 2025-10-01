from fastapi import HTTPException as FastAPIHTTPException

class HTTPException(FastAPIHTTPException):
    """Custom HTTP Exception that extends FastAPI's HTTPException"""
    pass