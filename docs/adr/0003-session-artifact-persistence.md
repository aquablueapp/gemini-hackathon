# ADR 0003: Stateless Session and Artifact Persistence for GCP Cloud Run

* **Status**: Superseded by [ADR 0007](file:///Users/yl/gemini/hackathon/gemini-hackathon/in-play/docs/adr/0007-backend-storage-selection.md)
* **Date**: 2026-06-06

## Context
When deploying the Agent Application Platform on Google Cloud Run, we face stateless container characteristics. Cloud Run instances scale dynamically (including scaling to zero) and do not guarantee session sticky routing or persistent local disks. 

If session history (ADK Session Events) or generated session items (Artifacts like temporary scripts, inputs, outputs) are stored in memory or on local container storage:
1. Users' chats will break if subsequent messages are routed to different container instances.
2. Compiled scripts and user files will be permanently lost when Cloud Run recycles container instances.

## Decision
We decided to enforce **Stateless Session and Artifact Cloud Persistence**:

1. **Session Persistence**: Configure the `adk-python` FastAPI service to utilize a database-backed session service (`DatabaseSessionService`) instead of `InMemorySessionService`. Hono.js and the Python sidecar will share a central database (Neon Postgres or Google Cloud SQL) using Drizzle ORM.
2. **Artifacts Persistence**: Configure ADK-Python to use Google Cloud Storage via the `GcsArtifactService`. All files generated during trials, user uploads, and compiled static script code will be stored in a GCS Bucket. 

## Consequences

### Positive (Pros)
- **High Availability**: Multi-instance Cloud Run scaling works seamlessly. Users can send requests to any backend instance and retrieve their chat history and artifacts.
- **Data Durability**: Artifacts are durably preserved on GCS, and Applet scripts survive Cloud Run recycling events.
- **GCP Native Alignment**: Leveraging GCS aligns with GCP cloud-native designs and provides scalable file access controls.

### Negative (Cons)
- **Database Dependency**: The chat interface becomes non-functional if the shared database goes offline.
- **I/O Latency**: Fetching files from GCS incurs minor network I/O overhead compared to local file system reads.
