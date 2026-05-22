# API Reference

OpsHub uses **drf-spectacular** to automatically generate an OpenAPI schema.

## Interactive Documentation
When running the server locally, visit:
- **Swagger UI**: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
- **Redoc**: [http://localhost:8000/api/v1/redoc/](http://localhost:8000/api/v1/redoc/)
- **Raw OpenAPI Schema**: [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/)

## Authentication
All endpoints under `/api/v1/` require an `Authorization` header with a valid JWT token, except for the login/auth endpoints.

```http
Authorization: Bearer <your_access_token>
```

## Standard Response Format
OpsHub standardizes all successful API responses through a custom renderer:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "title": "Example Ticket"
  }
}
```

Errors follow a consistent structure:

```json
{
  "success": false,
  "message": "A validation or permission error occurred.",
  "errors": {
    "email": ["This field is required."]
  }
}
```
