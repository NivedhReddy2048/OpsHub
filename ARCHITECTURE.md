# OpsHub Architecture

OpsHub is built on a clean, decoupled architecture optimizing for stability, security, and developer experience.

## Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query.
- **Backend**: Django 5, Django REST Framework, PostgreSQL, SimpleJWT.

## Design Patterns

### 1. Service Layer Pattern
To avoid "fat models" or "fat views", OpsHub uses explicit Service classes (e.g., `TicketService`, `AuditLogService`, `SLAService`). 
- **Views**: Handle HTTP, parse parameters, serialize responses.
- **Services**: Enforce permissions, handle business logic, orchestrate side-effects (like triggering notifications or audit logs).
- **Models**: State storage only. Avoid complex methods inside models.

### 2. Explicit over Implicit (No Django Signals)
We avoid Django signals for domain logic (like converting a ticket to a task or sending an audit log). Instead, explicit service calls are made. This guarantees predictable, traceable, and easily testable flows.

### 3. Standardized API Responses
All API responses are parsed through `StandardizedJSONRenderer` to ensure the structure:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### 4. Global Exception Handling
Handled centrally in `core.exceptions.custom_exception_handler`. Unhandled or DRF validation errors are coerced into:
```json
{
  "success": false,
  "message": "...",
  "errors": { ... }
}
```

### 5. Multi-tenancy
Partitioned at the application level via the `organization` foreign key. Querysets are heavily restricted in Services using `user.organization`.
