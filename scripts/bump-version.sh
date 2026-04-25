#!/usr/bin/env bash
# Veeda version bumper — sincroniza APP_VERSION (index.html), EMBEDDED_VERSION (index.html)
# e version.json. Uso: ./scripts/bump-version.sh 2.0.8
set -e

if [ -z "$1" ]; then
  echo "Uso: $0 <nova_versão>   (ex: $0 2.0.8)"
  exit 1
fi

NEW="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TODAY=$(date +%Y-%m-%d)

# 1. version.json
echo "{\"version\":\"$NEW\",\"released\":\"$TODAY\"}" > "$ROOT/version.json"

# 2. APP_VERSION na linha do código
sed -i "" "s/const APP_VERSION  = \"[^\"]*\";/const APP_VERSION  = \"$NEW\";/" "$ROOT/index.html"

# 3. EMBEDDED_VERSION no pre-render check
sed -i "" "s/var EMBEDDED_VERSION = \"[^\"]*\";/var EMBEDDED_VERSION = \"$NEW\";/" "$ROOT/index.html"

echo "✅ Versão bumpada para $NEW em:"
echo "  - version.json"
echo "  - index.html APP_VERSION"
echo "  - index.html EMBEDDED_VERSION"
echo ""
echo "Próximo passo: git add -A && git commit -m \"Bump to $NEW\" && git push"
