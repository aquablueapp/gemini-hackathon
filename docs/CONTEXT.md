# Domain Context Glossary

This document defines the core business terms and concepts for the Agent Application Platform. It contains no implementation details (such as database technologies, API libraries, or frameworks) and focuses strictly on domain definitions to maintain a shared language.

---

## Glossary

### Applet
*Canonical name: Applet (快捷应用 / 智能工作流)*
Also referred to as **Workflow** or **Workflow Applet** in user-facing SaaS context. A compiled, static automation unit that encapsulates a pre-verified, hardcoded execution flow (an intelligent daily task workflow) and the references to its required Credentials. Once compiled, an Applet can be run deterministically with a single click. **An Applet is modifiable**; a User can trigger an edit action which initializes a new Session loading the existing script as context, allowing the Aquablue Agent to refine the script conversationally.

### Session
*Canonical name: Session (开发会话)*
An interactive chat workspace where a User collaborates with the Aquablue Agent to decompose a goal, dynamically generate code, request necessary Credentials, and run validation trials. **Sessions are persistent**; event histories and states must be durably stored to prevent data loss across server restarts or scaled instances.

### Sandbox
*Canonical name: Sandbox (运行沙盒)*
A resource-constrained, isolated, **stateless operating environment** designated for running Applets or executing trial steps. It ensures executing programs cannot access host system files or exhaust system resources. Because the environment is stateless, any generated script code or execution artifact is persisted via distributed cloud storage.

### Credential
*Canonical name: Credential (外部凭证)*
An encrypted reference to authorization details (such as OAuth Access/Refresh Tokens or API Keys) that grants an Applet permission to interact with external services (like Gmail or Polymarket) on behalf of the User.

### Trashing
*Canonical name: Trashing (移入回收站)*
The specific action of moving an email to the Gmail "Trash" label. Unlike "Archiving" (removing the inbox label) or "Deleting" (permanent destruction), Trashing retains the email for a temporary period (30 days) allowing recovery before permanent deletion. **Trashing operations are strictly restricted**: during the development trial, a preview of affected emails must be generated and confirmed by the user before execution; and during Applet execution, the operation must enforce a hard upper limit per run (e.g., maximum of 50 items) to prevent accidental bulk data loss.
