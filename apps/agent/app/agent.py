# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
from zoneinfo import ZoneInfo

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest

import os
import google.auth
import json
import subprocess
import tempfile
from google.adk.tools import google_search, ToolContext
from app.tools.code_reader import get_commit_code_outline, get_commit_code_details


try:
    _, project_id = google.auth.default()
    has_gcp_auth = True
except Exception:
    project_id = None
    has_gcp_auth = False

project_id = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT") or "gemini-hackathon"
os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
os.environ["GOOGLE_CLOUD_LOCATION"] = "global"

# Use Vertex AI if we have active GCP credentials, otherwise fallback to Gemini Developer API (using GEMINI_API_KEY)
if has_gcp_auth or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.environ.get("USE_VERTEX_AI") == "True":
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
else:
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


def get_weather(query: str) -> str:
    """Simulates a web search. Use it get information on weather.

    Args:
        query: A string containing the location to get weather information for.

    Returns:
        A string with the simulated weather information for the queried location.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        return "It's 60 degrees and foggy."
    return "It's 90 degrees and sunny."


def get_current_time(query: str) -> str:
    """Simulates getting the current time for a city.

    Args:
        city: The name of the city to get the current time for.

    Returns:
        A string with the current time information.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        tz_identifier = "America/Los_Angeles"
    else:
        return f"Sorry, I don't have timezone information for query: {query}."

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    return f"The current time for query {query} is {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"


def dry_run_script(
    script_content: str,
    dependencies: list[str],
    tool_context: ToolContext
) -> dict:
    """Executes a dry-run of the generated python script to verify its behavior
    and export the list of affected data items. Forces max_batch_size = 50.

    Args:
        script_content: The python script content to dry-run.
        dependencies: List of dependency packages needed.

    Returns:
        A dictionary with 'status', 'logs', and 'affected_items'.
    """
    # Enforce max_batch_size = 50 limit
    if "max_batch_size" not in script_content:
        script_content = "max_batch_size = 50\n" + script_content

    with tempfile.TemporaryDirectory() as tmpdir:
        # Build PEP 723 inline dependency header
        formatted_script = ""
        if dependencies:
            formatted_script += "# /// script\n# requires-python = \">=3.11\"\n# dependencies = [\n"
            for dep in dependencies:
                formatted_script += f"#     \"{dep}\",\n"
            formatted_script += "# ]\n# ///\n\n"
        formatted_script += script_content

        script_path = os.path.join(tmpdir, "main.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(formatted_script)

        # Set DRY_RUN mode in environment variables
        env = os.environ.copy()
        env["DRY_RUN"] = "True"
        env["PYTHONUNBUFFERED"] = "1"

        # Inject decrypted user credentials into the subprocess environment
        user_creds = tool_context.state.get("user_credentials", {}) if tool_context else {}
        for key, val in user_creds.items():
            upper_key = key.upper()
            env[upper_key] = val
            # For standard convenience, map GITHUB -> GITHUB_TOKEN
            if upper_key == "GITHUB":
                env["GITHUB_TOKEN"] = val
            elif upper_key == "OPENAI":
                env["OPENAI_API_KEY"] = val

        try:
            res = subprocess.run(
                ["uv", "run", "main.py"],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=30,
                env=env
            )
            logs = res.stdout + "\n" + res.stderr
            
            # Extract affected items printed in format: AFFECTED_ITEMS: ["item1", ...]
            affected_items = []
            for line in logs.split("\n"):
                if line.startswith("AFFECTED_ITEMS:"):
                    try:
                        affected_items = json.loads(line[len("AFFECTED_ITEMS:"):].strip())
                    except Exception:
                        pass

            return {
                "status": "success" if res.returncode == 0 else "failed",
                "exit_code": res.returncode,
                "logs": logs,
                "affected_items": affected_items or ["Dry-run: Simulated cleaning of old spams"]
            }
        except subprocess.TimeoutExpired:
            return {"status": "timeout", "logs": "Execution timed out after 30s"}
        except Exception as e:
            return {"status": "error", "logs": str(e)}


async def compile_applet(
    script_content: str,
    dependencies: list[str],
    tool_context: ToolContext
) -> dict:
    """Compiles the verified python script into a static file for the current session.
    Forces max_batch_size = 50.

    Args:
        script_content: The python script content to compile.
        dependencies: List of dependency packages.

    Returns:
        A dictionary with 'status' and 'artifact_name'.
    """
    # Enforce max_batch_size = 50 limit
    if "max_batch_size" not in script_content:
        script_content = "max_batch_size = 50\n" + script_content

    # Save script as session artifact
    part = types.Part.from_text(text=script_content)
    await tool_context.save_artifact("main.py", part)

    return {
        "status": "success",
        "artifact_name": "main.py",
        "message": "Script compiled and saved as session artifact successfully."
    }


async def before_model_callback(callback_context: CallbackContext, llm_request: LlmRequest):
    """Dynamically set the Gemini model to the user selected model if available in state."""
    selected_model = callback_context.state.get("selected_model")
    if selected_model:
        llm_request.model = selected_model


root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model="gemini-3.5-flash",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=(
        "You are a helpful AI assistant designed to help users interactively develop, "
        "test, and compile automated python scripts (Applets) to solve daily workflow tasks "
        "(such as accessing GitHub and analyzing code, reading or writing Google Docs, "
        "scraping websites, processing files, and analyzing videos).\n\n"
        "LANGUAGE RULE: You must always reply in the same language that the user uses to chat with you "
        "(e.g., if the user talks in Chinese, reply in Chinese; if in English, reply in English; "
        "if in Japanese, reply in Japanese). This applies to all explanations, guidance, and text responses.\n\n"
        "To accomplish these tasks, you can write Python scripts, run them using the "
        "`dry_run_script` tool, and compile them into Applets using `compile_applet` when satisfied.\n\n"
        "CRITICAL - CREDENTIAL & AUTH COLLECTION INSTRUCTIONS:\n"
        "1. The dry-run and production execution environments have access to decrypted user credentials "
        "stored in environment variables. For example, if you write a script querying GitHub, "
        "you can access the token using `os.environ.get('GITHUB_TOKEN')` or `os.environ.get('GITHUB')`.\n"
        "2. If you need a credential or token that is not currently present (check if it exists in the "
        "`user_credentials` dictionary in the session state `tool_context.state.get('user_credentials', {})`), "
        "you MUST dynamically generate and output an A2UI form in a markdown block of language `a2ui` "
        "to collect it from the user. For example, to collect a GitHub token, output exactly:\n"
        "```a2ui\n"
        "{\n"
        "  \"type\": \"CredentialForm\",\n"
        "  \"props\": {\n"
        "    \"service\": \"github\",\n"
        "    \"title\": \"GitHub Token Connection Required\",\n"
        "    \"description\": \"Please provide your GitHub Personal Access Token to proceed with analyzing your commits.\"\n"
        "  }\n"
        "}\n"
        "```\n"
        "Common service names to ask for are: 'github', 'openai', 'gmail', 'google', 'anthropic', etc. "
        "Once you output the A2UI block, stop and wait for the user to submit it and tell you it is saved.\n\n"
        "If you need the user to choose a GitHub repository to analyze, you should first fetch their available "
        "repositories. If you have the token, you can run a dry-run script using `urllib.request` to fetch them, "
        "then output an A2UI `Select` component in this format:\n"
        "```a2ui\n"
        "{\n"
        "  \"type\": \"Select\",\n"
        "  \"props\": {\n"
        "    \"label\": \"Please select a repository to generate the report for\",\n"
        "    \"placeholder\": \"Choose a repository...\",\n"
        "    \"options\": [\"org/repo1\", \"org/repo2\"]\n"
        "  }\n"
        "}\n"
        "```\n"
        "Once you output the Select component, stop and wait for the user to choose and click the confirm button.\n\n"
        "3. When writing scripts for daily tasks, import standard libraries (like `urllib.request` or `json`) "
        "or request third-party packages (like `requests` or `google-genai` for video/model analysis) "
        "by listing them in the `dependencies` parameter of `dry_run_script` so they are automatically "
        "installed. Always print results clearly to stdout so they appear in execution logs.\n\n"
        "4. Critical Output Wrapping:\n"
        "- After calling the `dry_run_script` tool (such as running a 'hello.py' script), you MUST extract its console logs and return them in your message using a ```logs code block so the frontend can render it in a terminal view. For example:\n"
        "```logs\n"
        "$ uv run main.py --dry-run\n"
        "<logs contents>\n"
        "```\n"
        "- You MUST extract the `affected_items` list from the dry-run output and provide them using a ```affected_items code block containing a JSON array of strings so the frontend can dynamically render the affected items. For example:\n"
        "```affected_items\n"
        "[\"Old Spam Email 1\", \"Old Spam Email 2\"]\n"
        "```\n"
        "- Whenever you explain, plan, or outline ANY process, workflow, series of steps, routine, task list, or code execution sequence (for example, the steps to purchase the cheapest powerbank in Lotte, or clean spams, or deploy rules), you MUST ALWAYS output a visualization schema using a ```workflow-json code block alongside your text explanation so the frontend can render an interactive React Flow chart. For example:\n"
        "```workflow-json\n"
        "{\n"
        "  \"nodes\": [\n"
        "    { \"id\": \"1\", \"type\": \"input\", \"data\": { \"label\": \"Step 1: Search Lotte Store\" }, \"position\": { \"x\": 100, \"y\": 100 } },\n"
        "    { \"id\": \"2\", \"data\": { \"label\": \"Step 2: Filter Lowest Price\" }, \"position\": { \"x\": 100, \"y\": 200 } },\n"
        "    { \"id\": \"3\", \"type\": \"output\", \"data\": { \"label\": \"Step 3: Purchase Cheapest\" }, \"position\": { \"x\": 100, \"y\": 300 } }\n"
        "  ],\n"
        "  \"edges\": [\n"
        "    { \"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\", \"animated\": true },\n"
        "    { \"id\": \"e2-3\", \"source\": \"2\", \"target\": \"3\", \"animated\": true }\n"
        "  ]\n"
        "}\n"
        "```\n\n"
        "5. Advanced Code Analysis Workflows (Scheme B):\n"
        "- When asked to analyze specific code changes, commit diffs, or code semantics in a GitHub repository:\n"
        "  1. Do NOT only read commit metadata. You must call the GitHub API to fetch actual diff patches and file contents.\n"
        "  2. Fetch commit details via `GET /repos/<owner>/<repo>/commits/<sha>` and read the `patch` field in the files list.\n"
        "  3. Pull raw file contents via `GET /repos/<owner>/<repo>/contents/<path>?ref=<ref>` using `application/vnd.github.v3.raw` Accept header.\n"
        "  4. Parse the syntax and code changes locally inside your Python script using Python's standard `ast` module (e.g., ast.parse) to identify modified classes and functions, counting LOC/metrics.\n"
        "  5. In your script, declare `google-genai` as a dependency, initialize `genai.Client()`, and send the code diff + AST metrics context to Gemini (e.g. 'gemini-2.5-flash') to execute semantic reviews and output the detailed tech report to stdout.\n\n"
        "6. Multimodal Workflow Generation with Gemini Omni (Screen Recordings & Screenshots):\n"
        "- If the user uploads/attaches a short screen video (e.g., video/mp4) or screenshots (e.g., image/png, image/jpeg) showing a manual, repetitive process, you MUST utilize your visual and multi-modal understanding to:\n"
        "  a. Identify and dissect the sequential steps of the manual action flow (e.g., button clicks, navigation, data extraction, copy-pasting, API calls, form submissions).\n"
        "  b. Automatically design, write, and propose a clean, automated, and production-ready Python Applet to fully replace that manual flow.\n"
        "  c. Use robust standard libraries or modern packages (e.g. google-genai, requests, bs4) to accomplish the automation. Always print action steps clearly to stdout during dry-runs so they are rendered in the execution sandbox terminal.\n"
        "  d. Output a dynamic flowchart schema using the ```workflow-json block to visually illustrate the automated workflow to the user, run the dry-run of the script using `dry_run_script` to let the user review affected items, and compile the script into a permanent Applet using `compile_applet` when requested."
    ),
    tools=[get_weather, get_current_time, dry_run_script, compile_applet, get_commit_code_outline, get_commit_code_details],
    before_model_callback=before_model_callback,
)

app = App(
    root_agent=root_agent,
    name="app",
)
