#!/bin/bash
# ============================================================================
# sandbox-env.sh — Antigravity Sandbox Environment Bootstrap
# ============================================================================
# Source this file to set up the environment for the Antigravity sandbox.
# This fixes EPERM/EACCES errors by redirecting all caches and temp dirs
# to the project's working directory.
#
# Usage:
#   source ./sandbox-env.sh
#   # or
#   . ./sandbox-env.sh
# ============================================================================

# Resolve project root (directory where this script lives)
SANDBOX_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

echo "🔧 Setting up sandbox environment in: $SANDBOX_PROJECT_DIR"

# ---------------------------------------------------------------------------
# 1. Create local directories
# ---------------------------------------------------------------------------
mkdir -p "$SANDBOX_PROJECT_DIR/.npm-cache"
mkdir -p "$SANDBOX_PROJECT_DIR/.tmp/node-compile-cache"
mkdir -p "$SANDBOX_PROJECT_DIR/.tmp/tsx-cache"

# ---------------------------------------------------------------------------
# 2. Use local Node.js if available
# ---------------------------------------------------------------------------
if [ -d "$SANDBOX_PROJECT_DIR/.node/bin" ]; then
  export PATH="$SANDBOX_PROJECT_DIR/.node/bin:$PATH"
  echo "  ✅ Using local Node: $(node --version)"
else
  echo "  ℹ️  Using system Node: $(node --version 2>/dev/null || echo 'not found')"
fi

# ---------------------------------------------------------------------------
# 3. Redirect npm cache to working directory
# ---------------------------------------------------------------------------
export npm_config_cache="$SANDBOX_PROJECT_DIR/.npm-cache"
echo "  ✅ npm cache → .npm-cache/"

# ---------------------------------------------------------------------------
# 4. Redirect temp directories
# ---------------------------------------------------------------------------
export TMPDIR="$SANDBOX_PROJECT_DIR/.tmp"
export NODE_COMPILE_CACHE="$SANDBOX_PROJECT_DIR/.tmp/node-compile-cache"
echo "  ✅ TMPDIR → .tmp/"
echo "  ✅ NODE_COMPILE_CACHE → .tmp/node-compile-cache/"

# ---------------------------------------------------------------------------
# 5. Disable npm update checks (write to restricted paths)
# ---------------------------------------------------------------------------
export NO_UPDATE_NOTIFIER=1
export npm_config_update_notifier=false

# ---------------------------------------------------------------------------
# 6. Set npm to avoid audit checks (faster, fewer writes)
# ---------------------------------------------------------------------------
export npm_config_audit=false
export npm_config_fund=false

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "✅ Sandbox environment ready!"
echo "   Node:  $(node --version 2>/dev/null || echo 'N/A')"
echo "   npm:   $(npm --version 2>/dev/null || echo 'N/A')"
echo "   Cache: $npm_config_cache"
echo "   Tmp:   $TMPDIR"
echo ""
