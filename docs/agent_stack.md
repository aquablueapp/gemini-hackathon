# Agent 子项目技术栈与依赖文档 (apps/agent)

该子项目是基于 Python 开发的伴生决策与智能体（Agent）服务。它作为一个 Sidecar 容器运行在云端，或者作为独立的决策服务，主要基于 Google ADK 构建 ReAct 智能体。

## 🛠 技术栈总览

- **编程语言**: Python 3.10+ (要求 Python >= 3.10, < 3.14)
- **依赖与环境管理**: `uv` (Astral 团队开发的极速 Rust-based Python 包管理器)
- **智能体框架**: `Google ADK` (Agent Development Kit)
- **代码规范与质量**:
  - **Linter & Formatter**: `ruff`
  - **类型检查 (Type Checker)**: `ty` (Astral 团队的静态类型检查器)
- **测试框架**: `pytest` & `pytest-asyncio`
- **构建系统**: `Hatch` (使用 `hatchling` 构建后端，将应用打包为 wheel 包)

---

## 📦 依赖库详述与用途

### 1. 运行时生产依赖 (Dependencies)

| 依赖库名称 | 版本范围 | 在本项目中的具体用途 |
| :--- | :--- | :--- |
| **`google-adk`** | `>=1.15.0, <2.0.0` | **核心智能体 SDK**。用于构建 Agent、Tools、Workflow 并在大模型（如 Gemini）之上实现 ReAct（Reasoning and Acting）决策链逻辑。 |
| **`opentelemetry-instrumentation-google-genai`** | `>=0.1.0, <1.0.0` | **可观测性监控插桩**。基于 OpenTelemetry 对 Google GenAI SDK 执行过程中的调用链（Trace）和性能指标（Metrics）进行自动监控，便于追踪 Agent 执行路径。 |
| **`gcsfs`** | `>=2024.11.0` | **Google Cloud Storage 文件系统接口**。允许将 GCS（云存储）直接当做 Python 的 file-like object 挂载并读写，方便 Agent 读写云端大文件和数据集。 |
| **`google-cloud-logging`** | `>=3.12.0, <4.0.0` | **Google Cloud 日志客户端**。将 Python 的标准日志系统与 GCP Cloud Logging 无缝对接，把 Agent 的执行日志实时结构化上传到云端。 |
| **`a2ui-agent-sdk`** | `>=0.2.4` | **Web UI 交互 SDK**。用于与特定的智能体交互前端（如 A2UI）进行消息与状态对接，使得 Agent 的思考和执行结果能实时推送到用户界面。 |

### 2. 运行时可选依赖 (Optional Dependencies)

- **`jupyter`** (可选依赖组: `jupyter`)
  - **用途**: 提供 Jupyter Notebook 支持，方便在本地开发或沙盒环境中交互式调试 Agent 逻辑。
- **`google-adk[eval]`** (可选依赖组: `eval`)
  - **用途**: 激活 Google ADK 的评估模块，用于离线或在线评估 Agent 智能体生成质量与 Tool Calling 的准确率。

### 3. 开发与测试依赖 (Dependency Groups - dev)

| 依赖库名称 | 版本范围 | 在开发测试中的具体用途 |
| :--- | :--- | :--- |
| **`pytest`** | `>=8.3.4, <9.0.0` | **核心单元测试框架**。用于组织和执行 Python 单元测试与集成测试。 |
| **`pytest-asyncio`** | `>=0.23.8, <1.0.0` | **异步测试插件**。支持使用 pytest 对 `async/await` 异步协程方法进行单测。 |
| **`nest-asyncio`** | `>=1.6.0, <2.0.0` | **嵌套事件循环支持**。解决 Python 异步事件循环在已运行 of loop 中无法再次 run 的限制，便于在某些特定测试环境（如 Jupyter 或多线程测试）中启动 asyncio。 |
| **`ruff`** | `>=0.4.6, <1.0.0` | **极速 Linter & Formatter**。负责代码规范扫描和自动格式化，确保代码风格统一。 |
| **`ty`** | `>=0.0.1a0` | **类型检查工具**。Astral 团队推出的 Rust-based 类型检查辅助器，提供极速的类型检查体验。 |
| **`codespell`** | `>=2.2.0, <3.0.0` | **单词拼写检查**。自动扫描代码、注释和 Markdown 文档中的常见英文单词拼写错误。 |
