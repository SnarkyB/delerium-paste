#!/bin/bash
# DEPRECATED: This script is deprecated and will be removed in a future release
# Use the unified CLI instead: ./delerium monitor

echo "⚠️  WARNING: This script is deprecated!"
echo ""
echo "   Old command: ./scripts/monitor.sh"
echo "   New command: ./delerium monitor"
echo ""
echo "   The unified Delerium CLI provides all functionality in one tool."
echo "   Run './delerium help' to see all available commands."
echo ""
echo "Redirecting to new CLI in 3 seconds..."
sleep 3
echo ""

cd "$(dirname "$0")/.." && ./delerium monitor "$@"
