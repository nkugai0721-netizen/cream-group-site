#!/bin/bash
# 廃止（2026-11-10）: noteの記事は GitHub Actions（.github/workflows/sync-note.yml）が3時間ごとに自動で反映する
# すぐ反映したいときは: python scripts/sync_note.py → git commit & push
# 分類（タグ）を直したいときは data/notes.json の "tag" を書き換えて同じ手順
echo "このスクリプトは廃止しました。noteの記事は自動で反映されます（scripts/sync_note.py）。"
exit 1
