# ADR 0004: GCP Cloud Run Adaptations: Security, Process Control, and Resource Safety

* **Status**: Accepted
* **Date**: 2026-06-06

## Context
Deploying Hono.js alongside a Python FastAPI sidecar on GCP Cloud Run introduces strict operational constraints regarding container security, resource limits, and network routing:
1. **Access Credentials**: Standard GCP keys must not be hardcoded or stored in cleartext inside environment files.
2. **Process Management**: Cloud Run containers only listen on one external port (usually `8080`) and terminate if the primary process fails. We need a way to launch and monitor the Python sidecar process from the Node.js primary app.
3. **Memory Safety**: Cloud Run's `/tmp` directory is backed by container memory. Spawning multiple sandboxed runs that dynamically download large python packages (like `google-api-python-client` or `playwright`) will quickly exhaust memory, triggering Out-Of-Memory (OOM) crashes.

## Decision
We decided to implement the following platform-level adaptations for GCP Cloud Run:

1. **IAM Application Default Credentials (ADC)**:
   Ensure all local secrets (like Vertex AI Gemini API keys, Secret Manager tokens, and GCS buckets keys) are replaced by GCP IAM permissions associated with the Cloud Run Service Account. The code will rely exclusively on GCP ADC libraries, which require zero local key files in production.
2. **Node.js Process Supervisor**:
   Hono.js acts as the primary entrypoint. At startup, Node.js will spawn the Python service (`adk api_server` on localhost) as a child process and monitor its health. If the Python process crashes, Node.js will log the event and automatically restart the service.
3. **Pre-installed System Site-Packages**:
   The Dockerfile will pre-install heavy automation dependencies (`google-api-python-client`, `playwright`, etc.) in the global Python environment. Sandbox executions using `uv run` will use the `--system-site-packages` flag and share a localized cache (`/tmp/uv-cache`) to prevent dynamic PyPI downloads from consuming container memory.

## Consequences

### Positive (Pros)
- **High Security**: Zero key management overhead in code; all secrets are handled via Google Cloud IAM roles.
- **Resilience**: The backend automatically self-heals if the Python FastAPI co-process crashes.
- **Resource Protection**: Restricting dynamic downloads to pre-installed packages prevents OOM events and stabilizes Cloud Run instances.

### Negative (Cons)
- **Coupled Dockerfile**: Modifying the lists of pre-installed packages requires rebuilding and redeploying the Docker image.
- **Complex Docker Layering**: Python environment configuration and Node.js package setup must be combined in a single multi-stage Dockerfile.
