# noteの新着をHPに反映する（GitHub Actions で定期実行。手元でも python scripts/sync_note.py で動く）
# - data/notes.json に記事をためる（noteのRSSは最新25件までなので、古い記事はここに残す）
# - blog.html のカード一覧・構造化データ、index.html のニュース（最新5件）を作り直す
# - お知らせ（コラム以外）は data/news.json に手で書く
import html, json, re, urllib.request
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RSS = 'https://note.com/naoya6939/rss'
NOTES = ROOT / 'data' / 'notes.json'
NEWS = ROOT / 'data' / 'news.json'
NEWS_COUNT = 5
LD_COUNT = 10

TAGS = {
    '飲食経営': 'restaurant', 'AI・DX': 'ai', 'ストーリー': 'story', '有料記事': 'paid', 'ビジネス': 'business',
}
NEWS_TAGS = {'コラム': 'column', 'お知らせ': 'info', '店舗': 'store'}


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (cream-okinawa.com note sync)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8')


def guess_tag(title):
    # RSSには分類がないので、題名から決める（あとで data/notes.json を手で直してもよい）
    if re.search(r'AI|Claude|ChatGPT|システム|アプリ|自動|ダッシュボード|CRM|DX', title):
        return 'AI・DX'
    if re.search(r'飲食|店|居酒屋|スナック|メニュー|原価|仕込み|スタッフ|出店|開業', title):
        return '飲食経営'
    return 'ビジネス'


def parse_rss(xml):
    items = []
    for item in xml.split('<item>')[1:]:
        def tag(name):
            m = re.search(rf'<{name}>([\s\S]*?)</{name}>', item)
            return m.group(1).strip() if m else ''
        desc = re.sub(r'^<!\[CDATA\[|\]\]>$', '', tag('description'))
        text = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r"<a [^>]*>続きをみる</a>", '', desc)))
        text = re.sub(r'\s+', ' ', text).strip()
        url = tag('link')
        if not url.startswith('https://note.com/'):
            continue
        items.append({
            'url': url,
            'title': html.unescape(tag('title')),
            'date': parsedate_to_datetime(tag('pubDate')).strftime('%Y.%m.%d'),
            'excerpt': text[:80] + ('…' if len(text) > 80 else ''),
            'image': html.unescape(tag('media:thumbnail')),
        })
    return items


def og_image(url):
    try:
        m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', fetch(url))
        return html.unescape(m.group(1)) if m else ''
    except Exception:
        return ''


def esc(s):
    return html.escape(s, quote=True)


def card(n):
    img = f'\n        <div class="blog-card__thumb"><img src="{esc(n["image"])}" alt="" loading="lazy" width="800" height="419"></div>' if n.get('image') else ''
    cls = TAGS.get(n['tag'], 'restaurant')
    return f'''      <a href="{esc(n["url"])}" target="_blank" rel="noopener" class="blog-card fade-in">{img}
        <div class="blog-card__body">
          <div class="blog-card__meta">
            <span class="blog-card__date">{n["date"]}</span>
            <span class="blog-card__tag blog-card__tag--{cls}">{esc(n["tag"])}</span>
          </div>
          <h2 class="blog-card__title">{esc(n["title"])}</h2>
          <p class="blog-card__excerpt">{esc(n["excerpt"])}</p>
          <span class="blog-card__link">noteで読む &rarr;</span>
        </div>
      </a>
'''


def ld_post(n):
    return ('        {\n          "@type": "BlogPosting",\n'
            f'          "headline": {json.dumps(n["title"], ensure_ascii=False)},\n'
            f'          "datePublished": "{n["date"].replace(".", "-")}",\n'
            f'          "url": "{n["url"]}",\n'
            '          "author": {"@type": "Person", "name": "久貝 直哉"}\n        }')


def news_item(n):
    cls = NEWS_TAGS.get(n['tag'], 'info')
    title = (f'<a href="{esc(n["url"])}" target="_blank" rel="noopener" class="news-title news-link">{esc(n["title"])}</a>'
             if n.get('url') else f'<span class="news-title">{esc(n["title"])}</span>')
    return f'''      <div class="news-item">
        <span class="news-date">{n["date"]}</span>
        <span class="news-tag news-tag--{cls}">{esc(n["tag"])}</span>
        {title}
      </div>
'''


def between(text, start, end, body):
    pat = re.compile(re.escape(start) + r'[\s\S]*?' + re.escape(end))
    assert pat.search(text), start
    return pat.sub(lambda m: start + '\n' + body + end, text, count=1)


def main():
    notes = json.loads(NOTES.read_text(encoding='utf-8'))
    known = {n['url']: n for n in notes}
    for it in parse_rss(fetch(RSS)):
        if it['url'] in known:
            n = known[it['url']]
            n['title'] = it['title']
            if not n.get('image'):
                n['image'] = it['image']
        else:
            it['tag'] = guess_tag(it['title'])
            notes.append(it)
            known[it['url']] = it
    for n in notes:
        if not n.get('image'):
            n['image'] = og_image(n['url'])
    notes.sort(key=lambda n: n['date'], reverse=True)
    NOTES.write_text(json.dumps(notes, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    blog = (ROOT / 'blog.html').read_text(encoding='utf-8')
    blog = between(blog, '<!-- NOTE_CARDS_START -->', '      <!-- NOTE_CARDS_END -->', ''.join(card(n) for n in notes))
    blog = between(blog, '"blogPost": [', '      ]', ',\n'.join(ld_post(n) for n in notes[:LD_COUNT]) + '\n')
    (ROOT / 'blog.html').write_text(blog, encoding='utf-8')

    news = json.loads(NEWS.read_text(encoding='utf-8'))
    items = [{'date': n['date'], 'tag': 'コラム', 'title': n['title'], 'url': n['url']} for n in notes] + news
    items.sort(key=lambda n: n['date'], reverse=True)
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    index = between(index, '<!-- NEWS_START -->', '      <!-- NEWS_END -->', ''.join(news_item(n) for n in items[:NEWS_COUNT]))
    (ROOT / 'index.html').write_text(index, encoding='utf-8')
    print(f'記事 {len(notes)} 件・ニュース {NEWS_COUNT} 件を反映')


if __name__ == '__main__':
    main()
