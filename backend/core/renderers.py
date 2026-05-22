"""
core/renderers.py

Standardized JSON responses for all API endpoints.
Success format:
{
  "success": True,
  "message": "...",
  "data": { ... }
}
"""
from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Allow DRF spectacular to bypass the custom renderer
        view = renderer_context.get("view")
        if view and hasattr(view, "schema") and view.schema:
            from drf_spectacular.views import SpectacularAPIView
            if isinstance(view, SpectacularAPIView):
                return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get("response")
        status_code = response.status_code if response else 200

        # If it's already structured (e.g. from exception handler), pass it through
        if isinstance(data, dict) and "success" in data and "errors" in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Standardize success responses
        is_success = status_code < 400

        if is_success:
            # If data is empty string or None, set data to {}
            if data is None or (isinstance(data, str) and not data):
                data = {}

            # Support pagination (where DRF returns a dict with 'results', 'count', etc)
            if isinstance(data, dict) and "results" in data and "count" in data:
                # Wrap the whole pagination structure in 'data'
                pass # it's already fine, just wrap it

            standardized_data = {
                "success": True,
                "message": "Success",
                "data": data
            }
            return super().render(standardized_data, accepted_media_type, renderer_context)

        # For unhandled errors that bypassed exception handler
        standardized_error = {
            "success": False,
            "message": "An error occurred",
            "errors": data if isinstance(data, dict) else {"detail": data}
        }
        return super().render(standardized_error, accepted_media_type, renderer_context)
