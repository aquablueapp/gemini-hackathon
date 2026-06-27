# ADR 0010: GCP Cloud Run Native Multi-container (Sidecar) Architecture

* **Status**: Accepted
* **Date**: 2026-06-16

## Context
In ADR 0004, we originally planned to use Node.js `child_process.spawn` to launch and supervise the Python ADK `api_server` process on the same container to avoid process separation. However, this approach presented several architectural and deployment bottlenecks:
1. **Container Isolation Violation**: Forcing different runtime environments (Node.js and Python) into a single Docker image leads to bloated image sizes, extremely complex multi-stage Dockerfiles, and difficulty in versioning and maintaining dependencies.
2. **Resource Competition**: Spawning Python processes inside the same Node.js container causes CPU and memory contention, making it hard to allocate separate limits for the lightweight Node.js API and the memory-intensive Python Agent.
3. **Log Interleaving**: Monitoring stdout/stderr for two different runtime environments within a single container is complex and error-prone.

## Decision
We decided to adopt the native **GCP Cloud Run Multi-container (Sidecar)** pattern for deploying the backend application:
1. **Separated Containers**: Split the backend into two distinct, high-cohesion Docker images:
   - `backend-api` (Hono.js / Bun runtime)
   - `backend-agent` (Python 3.11 / FastAPI ADK server)
2. **Knative Multi-container Spec**: Assemble them in `hackathon-service.yaml` under Knative Service configuration.
3. **Shared Network Namespace**: Cloud Run maps all containers within a service instance to a single localhost network namespace. Hono.js invokes the companion agent directly via `http://localhost:7668`.
4. **Ingress Allocation**: Set `backend-api` as the sole container defining `ports` (Ingress container), routing all public traffic through it.

## Consequences

### Positive (Pros)
- **Runtime Isolation**: Independent base images and package dependencies for JS and Python.
- **Independent Scaling and Sizing**: Resource limits can be specified individually for each container in the YAML.
- **Cloud Run Native**: Easier setup, cleaner Dockerfiles, and simpler maintenance.

### Negative (Cons)
- **YAML Constraints**: Strict validation on GCP. Only one container is permitted to declare `ports`. Any secondary container defining ports will cause deployment failure.
- **Port Environment Variable Restrictions**: The `PORT` variable is reserved by GCP for routing public requests to the Ingress container. Manually injecting `PORT` under the Ingress container's environment variables in Knative YAML is forbidden and causes API rejection.
