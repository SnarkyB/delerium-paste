#!/bin/bash
# scripts/bump-version.sh
# Automatically bumps version numbers across the entire codebase
#
# Usage:
#   ./scripts/bump-version.sh 1.0.7
#   ./scripts/bump-version.sh 1.0.7 --dry-run  # Preview changes without modifying files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number is required${NC}"
    echo "Usage: $0 <version> [--dry-run]"
    echo "Example: $0 1.0.7"
    exit 1
fi

NEW_VERSION="$1"
DRY_RUN=false

# Check for dry-run flag
if [ "$2" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE: No files will be modified${NC}"
fi

# Validate version format (semantic versioning: x.y.z)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format. Expected format: x.y.z (e.g., 1.0.7)${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(grep '"version":' client/package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}Error: Could not determine current version from client/package.json${NC}"
    exit 1
fi

echo -e "${GREEN}Bumping version from ${CURRENT_VERSION} to ${NEW_VERSION}${NC}"
echo ""

# Function to replace version in a file
replace_version() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    local description="$4"
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}Warning: File not found: $file${NC}"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would update: $file${NC}"
        echo "  Pattern: $pattern"
        echo "  Replacement: $replacement"
        if grep -q "$pattern" "$file" 2>/dev/null; then
            echo -e "  ${GREEN}✓ Match found${NC}"
        else
            echo -e "  ${RED}✗ No match found${NC}"
        fi
    else
        if sed -i.bak "s|$pattern|$replacement|g" "$file" 2>/dev/null; then
            rm -f "${file}.bak"
            echo -e "${GREEN}✓ Updated: $file${NC} ($description)"
        else
            echo -e "${RED}✗ Failed to update: $file${NC}"
        fi
    fi
}

# Update client/package.json
replace_version \
    "client/package.json" \
    "\"version\": \"${CURRENT_VERSION}\"," \
    "\"version\": \"${NEW_VERSION}\"," \
    "package.json version"

# Update MODULE.bazel
replace_version \
    "MODULE.bazel" \
    "version = \"${CURRENT_VERSION}\"," \
    "version = \"${NEW_VERSION}\"," \
    "Bazel module version"

# Update HTML files (index.html, view.html, delete.html)
for html_file in "client/index.html" "client/view.html" "client/delete.html"; do
    replace_version \
        "$html_file" \
        "class=\"version-display\">v${CURRENT_VERSION}</a>" \
        "class=\"version-display\">v${NEW_VERSION}</a>" \
        "HTML version display"
done

# Update test file
replace_version \
    "client/tests/e2e/delete-paste.spec.ts" \
    "toContainText('v${CURRENT_VERSION}');" \
    "toContainText('v${NEW_VERSION}');" \
    "E2E test version assertion"

# Update API documentation
replace_version \
    "server/docs/API.md" \
    "Current API version: \*\*${CURRENT_VERSION}\*\*" \
    "Current API version: **${NEW_VERSION}**" \
    "API documentation version"

echo ""
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Dry run completed. No files were modified.${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo -e "${GREEN}Version bump completed successfully!${NC}"
    echo ""
    echo "Updated files:"
    echo "  - client/package.json"
    echo "  - MODULE.bazel"
    echo "  - client/index.html"
    echo "  - client/view.html"
    echo "  - client/delete.html"
    echo "  - client/tests/e2e/delete-paste.spec.ts"
    echo "  - server/docs/API.md"
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes: git diff"
    echo "  2. Commit the changes: git commit -am 'chore: bump version to v${NEW_VERSION}'"
    echo "  3. Create release branch: git checkout -b release/v${NEW_VERSION}"
fi
