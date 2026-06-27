# ADR 0001: Node.js and Python Agent Co-process Communication Architecture

* **Status**: Accepted
* **Date**: 2026-06-06

## Context
The application framework requires a real-time conversational chat system (`apps/web`) to interact with the `adk-python` agent workspace (`apps/agent`) for decomposing goals, retrieving credentials, and generating code. The web api gateway is written in Hono.js (`apps/api`), whereas the agent capabilities are fully implemented in Python. 

We considered two primary communication patterns between the Hono.js API backend and the Python ADK engine:
1. **Subprocess CLI Mode**: Node.js spawns a temporary Python child process for every message, piping arguments and capturing stdout.
2. **Co-process Port Proxying (FastAPI Sidecar)**: A Python FastAPI microservice runs concurrently with the Hono.js server in the same GCP Cloud Run container. Hono.js acts as the gateway, proxying HTTP chat requests to the Python server on a local port.

## Decision
We decided to adopt **Co-process Port Proxying (FastAPI Sidecar)**. 

Hono.js will listen on the primary container port (e.g., `8080`) to serve the client, and at startup, will spawn and monitor a long-running instance of the Python agent microservice (e.g. listening on local port `8000` via `adk api_server`). Node.js proxies conversational endpoint calls to the local Python API.

## Consequences

### Positive (Pros)
- **Zero Cold-start Latency**: Conversational exchanges do not incur the overhead of importing Python packages (like `google-genai` and `google-adk`) and parsing workspace scripts on every single message.
- **Natural State Management**: The `adk-python` SDK natively supports running as a FastAPI microservice, preserving session states and cache configurations cleanly in memory during chat sessions.
- **Robust Event Control**: Simplifies the implementation of complex custom events (e.g. OAuth validation interrupts) as standard HTTP/SSE exchanges rather than raw stdin/stdout piping.

### Negative (Cons)
- **Container Orchestration Complexity**: The Dockerfile and startup script must manage the lifecycle of two concurrent services. If either fails, the container must self-heal or restart.
- **Increased Memory Baseline**: Keeping a resident Python FastAPI process active alongside the Node.js API increases the baseline memory usage of the Cloud Run instance.
