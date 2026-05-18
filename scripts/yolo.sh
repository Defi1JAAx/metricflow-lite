#!/usr/bin/env bash
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}🤠 YOLO Achievement Unlocker${NC}"
echo "Creates a branch, opens a PR, and merges it without review"
echo ""

if ! gh auth status &>/dev/null; then
  echo -e "${RED}❌ Not authenticated. Run:${NC}"
  echo "  unset GITHUB_TOKEN && gh auth login && gh auth setup-git"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo -e "${RED}❌ Not inside a GitHub repo.${NC}"; exit 1
fi

USERNAME=$(gh api user -q .login)
TS=$(date +%s)
BRANCH="yolo/auto-merge-$TS"

echo -e "${GREEN}📌 Repo: $REPO${NC}"

# Configure git
git config user.email "${USERNAME}@users.noreply.github.com" 2>/dev/null || true
git config user.name "$USERNAME" 2>/dev/null || true

echo -e "${YELLOW}Creating branch $BRANCH...${NC}"
git checkout -b "$BRANCH"

# Make a change
echo "# YOLO merge $TS — $(date)" >> YOLO_LOG.md
git add YOLO_LOG.md
git commit -m "chore: yolo auto-merge $TS [skip ci]"
git push origin "$BRANCH"

echo -e "${YELLOW}Opening PR...${NC}"
PR_URL=$(gh pr create \
  --title "🤠 YOLO: Auto-merge $TS" \
  --body "This PR was created and merged automatically by the YOLO achievement script. No review required!" \
  --base main \
  --head "$BRANCH")

PR_NUM=$(echo "$PR_URL" | grep -o '[0-9]*$')
echo -e "${GREEN}✅ PR #$PR_NUM opened: $PR_URL${NC}"

sleep 3

echo -e "${YELLOW}Merging PR without review...${NC}"
gh pr merge "$PR_NUM" --merge --admin --delete-branch 2>/dev/null || \
  gh pr merge "$PR_NUM" --merge --delete-branch

git checkout main
git pull origin main

echo ""
echo -e "${GREEN}🏆 YOLO script complete!${NC}"
echo -e "${CYAN}Check your profile in 2–24 hours: https://github.com/$USERNAME${NC}"
