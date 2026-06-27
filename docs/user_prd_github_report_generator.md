# 智能多源工作流自动合成与日报/周报生成器 PRD (Product Requirements Document)

## 1. Executive Summary (业务概述)

本系统旨在构建一个智能的、多源兼容的开发者日常任务与周报自动生成器应用平台（Agent Application Platform）。面向全栈开发者，应用通过安全连接并提取**多种数据源**（包括 GitHub 提交记录、Google Docs 文档/表格、Jira 任务看板等）的信息与代码变更，调用大语言模型（LLM）进行深入的语义分析与技术归类。在隔离的沙盒中执行工作流时，前端采用**基于 React Flow 的只读工作流看板**动态显示每一个任务节点的运行状态与数据流向，并在任务完成后**流式生成排版精美、支持多服务联合汇总的日报/周报，并呈献量化性能改进的双图表看板**，助力工程师高效汇报，展现真实的技术价值。

---

## 2. Problem Statement (痛点陈述)

* **谁遇到了问题**：Expert Full-Stack Developer 这一技术画像以及日常需要写日报/周报的开发者。
* **具体痛点**：手动整理每天/每周的开发工作极为繁琐，通常每周耗费 30-60 分钟；并且，除了代码提交（GitHub）外，开发者还需要去查看产品设计文档（Google Docs）、Jira 任务进度、以及 Slack 沟通纪要。多源零散的信息使得手动整理工作成果极其低效，且容易遗漏一些隐性的贡献（如深度的性能调优、潜在的重构与缺陷修复）。
* **业务痛点**：对于团队管理者和非技术 Stakeholders，工程师提交的简单文字总结十分模糊，管理者无法快速量化地了解这些代码改动和业务跟进究竟带来了多少性能增益或业务价值。
* **现状证据**：调研显示，约有 80% 的资深开发人员认为每周写工作周报是“重复且缺乏数据支持的无意义负担”，且 90% 的周报缺失对代码改动本身的量化性能评估以及跨平台的多源工作汇总。

---

## 3. Target Users & Personas (目标用户画像)

### 3.1 核心画像 (Primary Persona)
* **全栈架构师 / Expert Developer (例如 Yinlei)**：
  - **特征**：技术深度高，注重代码质量、算法性能及高内聚职责分离。
  - **任务 (JTBD)**：希望在周报中能够以非常专业的技术指标（如算法复杂度降低、时延优化比率、Web Vitals 改善）来体现自己的技术产出，同时将 Google Docs 表格中的销售/发布计划数据进行汇总。
  - **痛点**：厌恶繁复的手动整理，需要自动化拉取 Commit 并进行深度代码 Diff 分析及文档汇总。

### 3.2 次要画像 (Secondary Persona)
* **开发团队主管 / 技术总监**：
  - **特征**：需要对团队产出进行全局把控，关心系统可用性与非功能性改进。
  - **目标**：希望一眼看出下属提交的“性能优化”是否具备真实数据支撑，并直接查看可视化的性能对比看板与文档交付状态。

---

## 4. Strategic Context (战略背景)

* **业务目标**：契合平台作为智能应用开发平台（Agent Application Platform）的核心定位——展示 Agent 将开发者复杂日常任务转化为可执行工作流并最终合成为静态 Applet 应用的能力。
* **为什么是现在**：开发者越来越依赖大模型辅助编程，但针对大模型输出代码的实际性能和工程贡献缺乏量化归档和汇报的闭环。打通 GitHub 提交 -> 代码 Diff -> Google Docs 提取 -> AI 语义分析 -> 性能 Mock 可视化这一闭环，是黑客马拉松（Demo）及商业展示的最佳实践。

---

## 5. Solution Overview (解决方案概述)

系统是一个全栈应用，划分为以下技术与功能边界：
1. **前端监控与图表展示 (Apps/Web)**：
   - 使用 **React Flow (`@xyflow/react`)** 渲染只读任务流拓扑图，直观展现节点执行状态。
   - 使用 **Recharts** 图表库渲染技术成果双图表看板。
2. **后端服务 (Apps/Api)**：负责调度执行沙盒，包含 Firestore 数据库探测、**统一多服务凭证托管中心 (OAuth Credentials Hub)**、以及 Mock 性能对比 API 服务（`GET /api/dev/mock-performance`）。
3. **EventStream 通信 (SSE)**：使用 **Hono 的 `streamSSE`** 建立长链接，向前端流式推送每一个工作流节点的运行状态与数据流向。
4. **伴生 Agent (Apps/Agent)**：使用 Vertex AI 驱动 Gemini 进行数据过滤和语义分类。
5. **沙盒执行器 (Sandbox)**：在 Node 容器内部派生的 Python 子进程，使用 `uv run` 保证沙盒执行的安全隔离，并利用 `UV_CACHE_DIR=/tmp/uv-cache` 缓存加快动态依赖解析。

---

## 6. Success Metrics (量化成功指标)

为了确保产品满足高质量标准，系统设定了以下具体可度量的 KPI 指标：

### 6.1 核心性能与体验指标 (Primary Metrics)
* **任务处理时延**：单次拉取与处理含有 50+ 提交记录的 GitHub 仓库并联合读取 5 个 Google Docs 的生成任务，端到端 P95 响应时延 $\le 10.0\text{ 秒}$。
* **前端图表加载时延**：Mock 性能数据接口的响应耗时 $\le 100\text{ms}$，首屏数据图表渲染的 TTFB $\le 300\text{ms}$。
* **工作流渲染流畅度**：前端 React Flow 工作流拓扑渲染与边流动动画流畅度平均 $\ge 60\text{fps}$。
* **AI 分类精确度 (Precision@10)**：大模型将 Commit、代码 Diff 以及文档表格内容正确归入 Features, Performance, UI/UX, Fixes 四类标签的精确度在基准评测集下 $\ge 90\%$。

### 6.2 安全性护栏指标 (Guardrail Metrics)
* **凭证泄露比率**：**绝对为 0%**。任何生成的 Applet 脚本、运行日志输出（stdout/stderr）或 API 响应数据中均不得泄露带有 `ghp_` 标识的 GitHub Token 或 Google OAuth 的 Access/Refresh Token 明文，敏感字段必须被正则匹配并截断/脱敏。
* **沙盒运行 Out-Of-Memory (OOM) 崩溃率**：$\le 0.1\%$。所有依赖解析和运行时必须被限制在 `/tmp` 内存盘的规定配额内。

---

## 7. User Stories & Acceptance Criteria (需求细分与验收标准)

### Story 1: 多服务凭证托管中心安全鉴权
**User Story**：  
作为一名开发者，我希望能够统一授权并绑定我的第三方服务（如 GitHub、Google Docs、Slack 等），以便 Agent 能够在沙盒运行期间安全拉取私有数据源，而不暴露我的敏感密钥。

**Acceptance Criteria (验收标准)**：
- [ ] 前端提供“多服务账号授权看板”，支持用户对不同服务（GitHub PAT、Google Workspace OAuth、Slack Webhook）进行一键绑定和状态监控。
- [ ] 后端通过数据库对所有解密后的 Token 凭证进行 AES-256 加密保存。
- [ ] 当沙盒微服务启动时，后端根据工作流节点类型，动态解密对应凭证，并以临时环境变量（如 `GITHUB_TOKEN`, `GOOGLE_WORKSPACE_TOKEN`）的形式注入子进程，严禁以明文形式写入 Applet 代码文件。
- [ ] 在日志输出（Pino/SSE）中，配置通用正则表达式自动过滤并屏蔽所有 `ghp_` 、OAuth Token 等敏感字符串。

### Story 2: 自定义多源数据整合与分析配置
**User Story**：  
作为一名开发人员，我希望能够自定义拉取的仓库地址、选定要分析的 Google Docs 链接以及配置自定义的分析时间跨度，以适应我非单一场景的汇报周期。

**Acceptance Criteria (验收标准)**：
- [ ] 支持输入形如 `owner/repo` 的仓库路径，并支持输入自定义分支名称。
- [ ] 支持输入一个或多个 Google Docs/Sheets 的公网或私有文档链接。
- [ ] 提供一键预设的 “Daily (过去 24 小时)” 与 “Weekly (过去 7 天)” 过滤按钮。
- [ ] 提供日历时间选择器组件，允许用户自主选择任意的 `StartDate` 与 `EndDate`。
- [ ] 允许切换日报模式（排版简短、突出关键点）或周报模式（排版详尽，包含跨平台联合成果与性能对比汇总看板）。

### Story 3: 多源数据与代码变更的智能语义分类
**User Story**：  
作为一名开发者，我希望 Agent 不仅看我的提交消息与代码 Diff，还能提取并分析 Google Docs 表格中的新规则与开发计划，从而智能化地对我的工作成果进行技术归类。

**Acceptance Criteria (验收标准)**：
- [ ] 沙盒执行器使用 Python SDK，动态调用拉取指定时间段内所有 Commit 的详细 Diff 代码，并调用 Google Docs API 提取指定表格或文档内容。
- [ ] 调用大语言模型对 Diff 代码行及 Docs 文本进行联合分析与深度语境推理。
- [ ] 分析结果智能分装为四个标准模块：
  1. **🚀 新功能 (Features)**：识别出新增的端点、组件、页面，以及 Google Docs 中所记录的最新交付功能模块。
  2. **⚡️ 性能优化 (Performance)**：识别出降低时间复杂度（如嵌套循环优化为查找表）、优化 SQL 查询、新增 Redis/缓存等。
  3. **🎨 视觉与体验 (UI/UX)**：识别出 CSS/Tailwind 改动、动画交互、A11y/ARIA 属性修正。
  4. **🔧 缺陷修复与重构 (Bug Fixes & Refactoring)**：识别出空指针拦截、异常修补和可读性重构。

### Story 4: 工作流看板可视化只读监视
**User Story**：  
作为一名开发者，我希望在任务运行期间，能够以拓扑工作流图的形式只读观看每个节点的运行状态与数据流向，以直观了解 Agent 的执行进展。

**Acceptance Criteria (验收标准)**：
- [ ] 前端渲染基于 `@xyflow/react` 的拓扑图，禁用一切连线修改、节点拖拽、画布编辑与二次保存行为。
- [ ] 当节点处于等待状态时，背景呈现灰色且半透明；当处于执行中状态时，边框显示蓝色并伴有 Tailwind 呼吸灯效果 (`animate-pulse`)；当执行成功时，背景呈绿色并带有勾选标记；当执行失败且处于 AI 自动纠错时，右上角动态更新重试次数。
- [ ] 数据流动画：一旦父节点执行成功并向子节点传递中间数据，它们之间的连线（Edge）将被动态启用 `animated: true` 动画，在前端展示数据流的能量流动。

### Story 5: 结果双图表化面板渲染
**User Story**：  
作为一名开发主管，我希望日报/周报的最终产出除了 Markdown 文本外，还能包含直观的可视化图表，以便快速查看技术侧重以及具体的性能对比。

**Acceptance Criteria (验收标准)**：
- [ ] **改动类别占比环形图**：使用 Recharts 渲染。将 Feat (蓝色)、Perf (绿色)、UI/UX (紫色)、Fix/Refactor (灰色) 在本周期内的提交次数与行数以环形图（Donut Chart）占比展示。
- [ ] **性能量化对比柱状图**：前端调用后端 `GET /api/dev/mock-performance` 接口，在周报的“性能看板”中用双柱状图对比优化前后的耗时（ms）、吞吐量（Ops/sec）和内存开销（MB），支持 Hover 查看加速倍率（如 "67.8x Faster"）。

---

## 8. Out of Scope (非本次开发目标)

为了确保 MVP 版本的按时交付，以下功能明确划为本阶段 Out of Scope：
* **节点拓扑交互式修改**：前端工作流完全为只读状态监控。不支持用户双击节点修改 AI 自动生成的代码，也不支持手动拖拽连线或手动增加/删除任务节点。
* **性能数据动态编辑**：前端的性能对比图表完全依赖后端 Mock API 静态渲染，暂不支持用户在页面上动态修改/伪造图表底层的 CPU/耗时参数。
* **多格式物理文件导出**：第一阶段仅支持网页端渲染周报成果，并提供“一键复制 Markdown”文本到剪贴板，暂不支持导出为 PDF、Word 或 HTML 实体附件。

---

## 9. Dependencies & Risks (依赖与技术风险)

* **外部依赖：GitHub & Google API Rate Limit**：
  - *风险*：高频调用三方 REST API 拉取数据时，可能会触发外部限流机制。
  - *缓解措施*：要求私有或频繁使用的用户必须绑定 Personal Access Token 以提升限流额度；对 Google API 的请求结果进行短期内存缓存，避免短时间内重复拉取同一未变动文档。
* **技术风险：Diff 代码体积过大或 Docs 字节超限导致的 Token 溢出**：
  - *风险*：拉取的 Diff 代码和文档字节过大，直接传给大模型将导致 Token 耗尽。
  - *缓解措施*：在沙盒中设置限制：单次分析的 Diff 代码最大限制为 500 行，Google Docs 提取的文本截取前 10,000 个字符。

---

## 10. AI Evaluation Strategy (大模型评估策略)

由于周报的技术准确性高度依赖大模型对多源数据的分类质量，系统建立如下评估策略（Evaluation Strategy）：

1. **构建黄金评测集 (Golden Dataset)**：
   - 收集 20 个具有代表性的真实 commits 样本（覆盖 UI 调色、算法循环重构、新增接口、修复空指针等 diff）以及 5 份包含表格的 Google Docs 文本片段。
   - 标注团队公认的正确技术分类标签（Features, Performance, UI/UX, Fixes）。
2. **基准测试与通过率门槛**：
   - 在测试和 CI/CD 阶段运行 AI 分类脚本，评估大模型对这 20 个样本分类的匹配精度。
   - **通过率门槛**：大模型在此黄金评测集上的分类精度 **必须 $\ge 90\%$**（即至少正确分类 18 个测试用例），方可被允许合并部署至 GCP 生产环境。

---

## 11. Visual Workflow & Charts Protocol (可视化与图表协议规格)

本章节定义了 EventStream 通讯的报文数据结构规格，以规范前后端接口联调：

### 11.1 工作流节点定义接口 (Initial Node Schema)
当用户点击“开始分析”后，后端应立即计算并下发用于初始化 React Flow 的节点列表与依赖关系拓扑数据：
```json
{
  "nodes": [
    { "id": "git_fetch", "label": "拉取 Commit 历史", "type": "task" },
    { "id": "gdoc_fetch", "label": "读取 Google Docs 数据", "type": "task" },
    { "id": "diff_extract", "label": "抓取代码 Diff 改动", "type": "task" },
    { "id": "ai_classify", "label": "大模型语义分析与归类", "type": "task" },
    { "id": "performance_eval", "label": "性能量化对比评估", "type": "task" },
    { "id": "report_synthesis", "label": "最终周报数据合成", "type": "task" }
  ],
  "edges": [
    { "source": "git_fetch", "target": "diff_extract" },
    { "source": "gdoc_fetch", "target": "ai_classify" },
    { "source": "diff_extract", "target": "ai_classify" },
    { "source": "ai_classify", "target": "performance_eval" },
    { "source": "performance_eval", "target": "report_synthesis" }
  ]
}
```

### 11.2 EventStream 事件结构 (Hono SSE Stream Payload)
在长链接流式数据输出时，必须遵循以下三种消息事件封装：

1. **节点执行状态消息**：
   - `event: node-status`
   - `data` 格式：
     ```json
     {
       "nodeId": "gdoc_fetch",
       "status": "pending" | "running" | "success" | "failed",
       "retryCount": 0,
       "inputData": { "docUrl": "https://docs.google.com/..." },
       "outputData": { "tableCount": 1 }
     }
     ```
2. **节点详细日志消息**：
   - `event: node-log`
   - `data` 格式：
     ```json
     {
       "nodeId": "ai_classify",
       "line": "Successfully processed Google Docs table row data.",
       "type": "stdout" | "stderr"
     }
     ```
3. **周报生成完毕消息**：
   - `event: report-result`
   - `data` 格式：
     ```json
     {
       "markdown": "# 智能多源开发周报 ...",
       "chartData": {
         "categories": [
           { "name": "Features", "value": 7 },
           { "name": "Performance", "value": 4 },
           { "name": "UI/UX", "value": 4 },
           { "name": "Fixes/Refactor", "value": 3 }
         ]
       }
     }
     ```

---

## 12. Multi-Service Extension Spec (多服务扩展规范)

为了确保引擎的通用可扩展性，对于新增的第三方服务集成，必须遵循以下对接协议：
1. **OAuth 接入映射**：在 `apps/api/src/services/credentials.ts` 中注册对应的服务标示（如 `google_workspace`, `jira`, `slack`），并在托管解密器中提供通用的 header/token 返回接口。
2. **`uv` 动态包声明**：在沙盒 Python 文件头部利用 PEP 723 格式动态加载相关客户端 SDK（例如对 Google Docs 支持，使用 `google-api-python-client`；对 Slack 通知，使用 `slack-sdk`）。Python 环境会自适应拉取，无需在 Dockerfile 容器层反复进行静态依赖扩充。
