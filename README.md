# OpsHub

OpsHub is an enterprise operations workflow platform combining helpdesk ticket management, internal task tracking, SLA monitoring, and organization-aware analytics.

## Features
- **Multi-tenant Organization Architecture**: Data is securely partitioned per organization.
- **Role-Based Access Control**: Admins, Support Agents, and Team Members have distinct permissions.
- **Ticket Management**: Create, assign, comment, and resolve support requests.
- **Task & Project Management**: Organize internal work with explicit assignments and deadlines.
- **Ticket-to-Task Conversion**: Seamlessly convert external support requests into internal engineering tasks.
- **SLA Monitoring**: Configurable SLA targets with automatic deadline calculations and breach tracking.
- **Audit Logging**: Immutable, explicit service-layer event logs for security and compliance.
- **In-App Notifications**: Real-time alerts for assignments and SLA updates.
- **Operational Analytics Dashboard**: Centralized metrics for open tickets, active tasks, and team health.

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed technical breakdown.

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for Render/Railway/Vercel and Docker instructions.

## API Reference
See [API_REFERENCE.md](API_REFERENCE.md) or visit `/api/v1/docs/` when the server is running.

## Local Setup

### Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## Future Improvements
- Websocket implementation for real-time notifications.
- Celery / Redis integration for async SLA jobs and email sending.
- Advanced Kanban drag-and-drop task boards.
- External integrations (Slack/Jira).
