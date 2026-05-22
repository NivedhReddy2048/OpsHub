"""
core/exceptions.py

Global exception handler to standardize API error responses.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework.response import Response

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardize exception responses.
    Format:
    {
        "success": False,
        "message": "Human readable error message",
        "errors": { ... field errors or details ... }
    }
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If it's an unexpected error
    if response is None:
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return Response(
            {
                "success": False,
                "message": "An internal server error occurred.",
                "errors": {"detail": str(exc)},
            },
            status=500
        )

    # Standardize DRF exceptions
    if isinstance(exc, APIException):
        data = response.data
        message = "A validation or permission error occurred."

        # Attempt to pull a single top-level string message if available
        if isinstance(data, dict) and "detail" in data:
            message = str(data.pop("detail"))
        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], str):
            message = str(data[0])
            data = {"non_field_errors": data}

        response.data = {
            "success": False,
            "message": message,
            "errors": data if data else {}
        }

    return response
