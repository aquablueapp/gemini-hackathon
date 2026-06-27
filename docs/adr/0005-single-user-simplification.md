# ADR 0005: Single-User System Simplification (No Authentication)

* **Status**: Accepted
* **Date**: 2026-06-06

## Context
Originally, the platform spec assumed a multi-tenant SaaS architecture utilizing Better Auth or Firebase Auth to segregate user Sessions, Applets, and Credentials. 

However, because this system is built strictly for personal/single-user utility, implementing complex multi-user registration, database authentication middleware, and session token verification introduces unnecessary engineering overhead and slows down deployment.

## Decision
We decided to **remove all user authentication requirements** and simplify the system to a **Single-User Architecture**:

1. **No User Authentication**: Access to the Web interface (`apps/web`) and API gateway (`apps/api`) requires no login screen or JWT token validation.
2. **Static User Context**: For all database (Firestore) and file storage (GCS) operations, the `userId` field will be hardcoded to a static global constant (`default_user`).
3. **Personal Credentials Management**: While user login is removed, the system still requires a **Credentials Config Panel** in the UI where the single user can bind and save their own Google OAuth refresh token and API Keys. These keys remain encrypted in the database under the `default_user` record.

## Consequences

### Positive (Pros)
- **Massive Complexity Reduction**: Eliminates OAuth redirect loops, Firebase Auth setup, and Hono.js auth middlewares.
- **Faster Development**: Saves significant frontend and backend development hours.
- **Lower Resource Overhead**: Eliminates the need to maintain auth session tables or run auth servers.

### Negative (Cons)
- **No Multi-tenancy**: The application cannot be shared publicly with different users having isolated workspaces without reversing this decision.
