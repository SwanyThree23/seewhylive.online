#!/usr/bin/env bash
# Uploads ~/.ssh/github_deploy as the VPS_SSH_KEY GitHub Actions secret.
# Run this once in the Hostinger VPS terminal.
# Usage: bash set-deploy-key.sh <YOUR_GITHUB_PAT>
#   PAT needs: repo (or repo/Actions secrets write) scope
#   Get one at: https://github.com/settings/tokens/new?scopes=repo&description=VPS-deploy

set -e
REPO="SwanyThree23/seewhylive.online"
KEY_FILE="${HOME}/.ssh/github_deploy"

if [ ! -f "$KEY_FILE" ]; then
  echo "ERROR: $KEY_FILE not found. Generate it first:"
  echo "  ssh-keygen -t ed25519 -C github-actions -f ~/.ssh/github_deploy -N ''"
  echo "  cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys"
  exit 1
fi

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  read -rsp "GitHub PAT (repo scope): " TOKEN
  echo
fi

echo "Installing gh CLI if needed…"
if ! command -v gh &>/dev/null; then
  type -p curl &>/dev/null || apt-get install curl -y
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list
  apt-get update -qq && apt-get install gh -y -qq
fi

echo "$TOKEN" | gh auth login --with-token
gh secret set VPS_SSH_KEY --body "$(cat "$KEY_FILE")" --repo "$REPO"
echo ""
echo "✅  VPS_SSH_KEY secret set on $REPO"
echo ""
echo "Triggering a test deploy…"
gh workflow run deploy.yml --repo "$REPO"
echo "✅  Workflow triggered — check: https://github.com/$REPO/actions"
