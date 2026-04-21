#!/bin/bash
# note記事公開時にblog.htmlとindex.htmlを自動更新するスクリプト
# 使い方: ./scripts/update-blog.sh "2026.04.21" "記事タイトル" "https://note.com/..." "飲食経営" "記事の概要テキスト"
#
# 引数:
#   $1: 日付 (YYYY.MM.DD)
#   $2: タイトル
#   $3: note URL
#   $4: カテゴリ (飲食経営 / AI・DX / ストーリー / 有料記事 / ビジネス)
#   $5: 概要テキスト (1〜2行)

set -e

DATE="$1"
TITLE="$2"
URL="$3"
CATEGORY="$4"
EXCERPT="$5"

if [ -z "$DATE" ] || [ -z "$TITLE" ] || [ -z "$URL" ]; then
  echo "Usage: $0 DATE TITLE URL [CATEGORY] [EXCERPT]"
  echo "Example: $0 '2026.04.21' '記事タイトル' 'https://note.com/...' '飲食経営' '概要テキスト'"
  exit 1
fi

# デフォルト値
CATEGORY="${CATEGORY:-飲食経営}"
EXCERPT="${EXCERPT:-}"

# カテゴリからCSSクラスを決定
case "$CATEGORY" in
  "飲食経営")     TAG_CLASS="blog-card__tag--restaurant" ;;
  "AI・DX")       TAG_CLASS="blog-card__tag--ai" ;;
  "ストーリー")   TAG_CLASS="blog-card__tag--story" ;;
  "有料記事")     TAG_CLASS="blog-card__tag--paid" ;;
  "ビジネス")     TAG_CLASS="blog-card__tag--business" ;;
  *)              TAG_CLASS="blog-card__tag--restaurant" ;;
esac

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(dirname "$SCRIPT_DIR")"

# ===== 1. blog.html にカード追加 =====
BLOG_FILE="$SITE_DIR/blog.html"

# BLOG_INSERT_POINT の直後に新しいカードを挿入
CARD_HTML="      <a href=\"$URL\" target=\"_blank\" rel=\"noopener\" class=\"blog-card fade-in\">\\
        <div class=\"blog-card__body\">\\
          <div class=\"blog-card__meta\">\\
            <span class=\"blog-card__date\">$DATE</span>\\
            <span class=\"blog-card__tag $TAG_CLASS\">$CATEGORY</span>\\
          </div>\\
          <h2 class=\"blog-card__title\">$TITLE</h2>\\
          <p class=\"blog-card__excerpt\">$EXCERPT</p>\\
          <span class=\"blog-card__link\">noteで読む \\&rarr;</span>\\
        </div>\\
      </a>\\
"

sed -i "/<!-- BLOG_INSERT_POINT -->/a\\
$CARD_HTML" "$BLOG_FILE"

echo "[OK] blog.html にカード追加: $TITLE"

# ===== 2. index.html のNewsにリンク追加 =====
INDEX_FILE="$SITE_DIR/index.html"

# 日付フォーマット変換 (2026.04.21 はそのまま)
NEWS_HTML="      <div class=\"news-item\">\\
        <span class=\"news-date\">$DATE</span>\\
        <span class=\"news-tag news-tag--column\">コラム</span>\\
        <a href=\"$URL\" target=\"_blank\" rel=\"noopener\" class=\"news-title news-link\">$TITLE</a>\\
      </div>"

# news-listの最初のnews-itemの前に挿入
sed -i "/<div class=\"news-list\">/a\\
$NEWS_HTML" "$INDEX_FILE"

echo "[OK] index.html Newsに追加: $TITLE"

# ===== 3. git commit & push =====
cd "$SITE_DIR"
git add blog.html index.html
git commit -m "note記事追加: $TITLE"
git push

echo "[OK] push完了"
echo ""
echo "=== 更新完了 ==="
echo "blog.html: カード追加"
echo "index.html: Newsにリンク追加"
echo "git push: 完了"
