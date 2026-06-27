#!/usr/bin/env bash

# ==============================================================================
# Service Manager Script for Aquablue App
# Fixed Ports: Web (7666), API (7667), Agent (7668)
# ==============================================================================

set -euo pipefail

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ports
WEB_PORT=7666
API_PORT=7667
AGENT_PORT=7668

# Log directory
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

# PIDs files for tracking background processes
PID_WEB_FILE="/tmp/aquablue_web.pid"
PID_API_FILE="/tmp/aquablue_api.pid"
PID_AGENT_FILE="/tmp/aquablue_agent.pid"

check_port() {
  local port=$1
  if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null; then
    return 0 # Port is occupied
  else
    return 1 # Port is free
  fi
}

get_process_info() {
  local port=$1
  lsof -i :"$port" -sTCP:LISTEN | tail -n +2 | awk '{print $1" (PID: "$2")"}' || echo "None"
}

kill_port_owner() {
  local port=$1
  local pids
  pids=$(lsof -t -i :"$port" -sTCP:LISTEN) || true
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Stopping process occupying port $port...${NC}"
    kill -9 $pids 2>/dev/null || true
  fi
}

show_status() {
  echo -e "\n${BLUE}===================== Service Status =====================${NC}"
  printf "%-12s | %-6s | %-10s | %-30s\n" "Service" "Port" "Status" "Process Details"
  echo "----------------------------------------------------------"

  # Web
  if check_port "$WEB_PORT"; then
    printf "${GREEN}%-12s${NC} | %-6d | ${GREEN}%-10s${NC} | %-30s\n" "Web (Front)" "$WEB_PORT" "RUNNING" "$(get_process_info "$WEB_PORT")"
  else
    printf "${RED}%-12s${NC} | %-6d | ${RED}%-10s${NC} | %-30s\n" "Web (Front)" "$WEB_PORT" "STOPPED" "-"
  fi

  # API
  if check_port "$API_PORT"; then
    printf "${GREEN}%-12s${NC} | %-6d | ${GREEN}%-10s${NC} | %-30s\n" "API (Back)" "$API_PORT" "RUNNING" "$(get_process_info "$API_PORT")"
  else
    printf "${RED}%-12s${NC} | %-6d | ${RED}%-10s${NC} | %-30s\n" "API (Back)" "$API_PORT" "STOPPED" "-"
  fi

  # Agent
  if check_port "$AGENT_PORT"; then
    printf "${GREEN}%-12s${NC} | %-6d | ${GREEN}%-10s${NC} | %-30s\n" "Agent (Py)" "$AGENT_PORT" "RUNNING" "$(get_process_info "$AGENT_PORT")"
  else
    printf "${RED}%-12s${NC} | %-6d | ${RED}%-10s${NC} | %-30s\n" "Agent (Py)" "$AGENT_PORT" "STOPPED" "-"
  fi
  echo -e "${BLUE}==========================================================${NC}\n"
}

stop_all() {
  echo -e "${YELLOW}Stopping all services...${NC}"
  kill_port_owner "$WEB_PORT"
  kill_port_owner "$API_PORT"
  kill_port_owner "$AGENT_PORT"
  
  # Clean up PID files
  rm -f "$PID_WEB_FILE" "$PID_API_FILE" "$PID_AGENT_FILE"
  echo -e "${GREEN}All services stopped successfully.${NC}"
}

start_all() {
  # Load API env variables so they propagate to Hono and Python Agent subprocesses
  if [ -f apps/api/.env ]; then
    echo -e "${YELLOW}Loading environment variables from apps/api/.env...${NC}"
    export $(grep -v '^#' apps/api/.env | grep -v '^[[:space:]]*$' | xargs)
  fi

  # 1. Verification
  echo -e "${CYAN}Checking prerequisites...${NC}"
  if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: 'bun' is required but not installed.${NC}"
    exit 1
  fi
  if ! command -v uv &> /dev/null; then
    echo -e "${RED}Error: 'uv' is required for running python agent but not installed.${NC}"
    exit 1
  fi

  # Clean up existing processes if any to avoid port collisions
  echo -e "${YELLOW}Ensuring clean port states...${NC}"
  kill_port_owner "$WEB_PORT"
  kill_port_owner "$API_PORT"
  kill_port_owner "$AGENT_PORT"

  echo -e "${CYAN}Starting API service...${NC}"
  # Run Hono API
  bun run dev:api > "$LOG_DIR/api.log" 2>&1 &
  echo $! > "$PID_API_FILE"

  echo -e "${CYAN}Starting Python Agent service...${NC}"
  # Run Agent
  (cd apps/agent && env API_BASE_URL="http://127.0.0.1:7667" make playground) > "$LOG_DIR/agent.log" 2>&1 &
  echo $! > "$PID_AGENT_FILE"

  echo -e "${CYAN}Starting Web Frontend service...${NC}"
  # Run React Start Web
  bun run dev:web > "$LOG_DIR/web.log" 2>&1 &
  echo $! > "$PID_WEB_FILE"

  # Wait a few seconds for services to initialize
  echo -e "${YELLOW}Initializing services (waiting 5 seconds)...${NC}"
  sleep 5

  echo -e "${CYAN}Injecting default dev credentials...${NC}"
  (cd apps/api && bun run scripts/save-github-token.ts) || true
  (cd apps/api && bun run scripts/save-google-key.ts) || true

  show_status

  echo -e "${GREEN}✨ All services are running in the background!${NC}"
  echo -e "📖 Logs are stored in:${CYAN}"
  echo -e "   - Frontend Web : tail -f $LOG_DIR/web.log"
  echo -e "   - Backend API  : tail -f $LOG_DIR/api.log"
  echo -e "   - Py Agent     : tail -f $LOG_DIR/agent.log${NC}"
  echo -e "\n👉 Open Web page in browser: ${BLUE}http://localhost:7666${NC}"
  echo -e "👉 Swagger API Docs:          ${BLUE}http://localhost:7667/reference${NC}"
  echo -e "👉 Agent Playground:          ${BLUE}http://localhost:7668${NC}"
  echo -e "\nTo stop services, run: ${PURPLE}./manage.sh stop${NC}\n"
}

# Command dispatcher
case "${1:-}" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  status)
    show_status
    ;;
  restart)
    stop_all
    start_all
    ;;
  logs)
    echo -e "${CYAN}Displaying last 20 lines of logs...${NC}"
    echo -e "\n${BLUE}=== WEB ===${NC}"
    tail -n 20 "$LOG_DIR/web.log" || echo "No logs yet."
    echo -e "\n${BLUE}=== API ===${NC}"
    tail -n 20 "$LOG_DIR/api.log" || echo "No logs yet."
    echo -e "\n${BLUE}=== AGENT ===${NC}"
    tail -n 20 "$LOG_DIR/agent.log" || echo "No logs yet."
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart|logs}"
    exit 1
    ;;
esac
