#!/usr/bin/env bash
set -euo pipefail

# --- Rama aislada para una interacción ---
# Un árbol limpio evita llevar cambios de otra tarea a la nueva rama.
slug="${1:?Usage: bash scripts/new-interaction.sh short-description}"
[[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo 'Use lowercase letters, numbers and hyphens.' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Commit or stash existing changes first.' >&2; exit 1; }
# La base se actualiza desde GitHub, no desde una rama local posiblemente antigua.
git fetch origin develop
branch="feature/$(date -u +%Y%m%d-%H%M%S)-${slug}"
git switch --create "$branch" origin/develop
git push --set-upstream origin "$branch"
printf 'Interaction branch: %s\n' "$branch"
