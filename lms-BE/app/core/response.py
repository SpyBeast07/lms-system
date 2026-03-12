from typing import Any, Dict, Optional

def success_response(data: Any = None, message: str = "Success", meta: Optional[Dict] = None) -> Dict:
    response = {
        "success": True,
        "message": message,
        "data": data or {},
    }
    if meta:
        response["meta"] = meta
    return response

def error_response(message: str, details: Any = None) -> Dict:
    response = {
        "success": False,
        "message": message,
        "data": {},
    }
    if details:
        response["meta"] = {"details": details}
    return response

def paginated_response(items: Any, total: int, page: int, size: int) -> Dict:
    return success_response(
        data=items,
        meta={
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if size > 0 else 0
        }
    )
