#!/usr/bin/env python3
"""店舗ページのメニュー欄を作る

使い方:
  # ダイニーの「注文集計」CSVから GARAGE・Leje のメニューデータを作り直す
  python scripts/build_menus.py dinii garage <CSVのパス>
  python scripts/build_menus.py dinii leje <CSVのパス>
  # data/menus/*.json から各店舗ページのメニュー欄を書き換える
  python scripts/build_menus.py build

せんべろ・ちゃっきーはPOSのデータがないので data/menus/*.json を手で直す。
"""
import csv
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data' / 'menus'
PAGES = {'senbero': 'stores/senbero.html', 'garage': 'stores/garage.html',
         'leje': 'stores/leje.html', 'chacky': 'stores/chacky.html'}
START, END = '<!-- MENU:START -->', '<!-- MENU:END -->'

# ダイニーの分類 → HPに出すカテゴリ名（並び順もこの順。ここにない分類は載せない）
DINII_RULES = {
    'garage': {
        'categories': [
            ('タコス', 'タコス'), ('ご飯もの', 'ご飯もの'), ('石垣島の美崎牛', '一品料理'),
            ('一品料理', '一品料理'), ('前菜', '前菜'), ('アヒージョ', 'アヒージョ'), ('揚げ物', '揚げ物'),
            ('バーガー', 'バーガー・ホットドッグ'), ('ホットドッグ', 'バーガー・ホットドッグ'), ('パスタ', 'パスタ・八重山そば'),
            ('八重山そば', 'パスタ・八重山そば'), ('スナック', 'スナック・トッピング'), ('トッピング', 'スナック・トッピング'), ('スイーツ', 'スイーツ'),
            ('ビール', 'ビール'), ('ハイボール', 'ハイボール'), ('酎ハイ/お茶ハイ', '酎ハイ・お茶ハイ'),
            ('石垣島泡盛', '泡盛・焼酎'), ('焼酎', '泡盛・焼酎'), ('ジン/ラム', 'カクテル・ジン・ラム'),
            ('カクテル', 'カクテル・ジン・ラム'), ('ショット', 'ショット'), ('ワイン', 'ワイン・果実酒'),
            ('石垣島果実酒', 'ワイン・果実酒'), ('ソフトドリンク', 'ソフトドリンク・珈琲'), ('珈琲', 'ソフトドリンク・珈琲'),
        ],
        'skip_items': {'ボトルチャージ'},
        'rename': {'清福梅酒': '請福梅酒', '清福ゆず酒': '請福ゆず酒'},
        'picks': ['石垣牛タコス', '石垣島タコライス', 'ガーリックシュリンプ', 'ロコモコ'],
        'system': [],
        'notes': ['価格は税込です', 'テイクアウトできるメニューがあります（店内価格＋50円）',
                  'ご飯もの・タコスなどはドリンクとのお得なセットもあります'],
    },
    'leje': {
        'categories': [
            ('SHISHA【カスタム】', 'シーシャ'), ('SHISHA【フルーツ系甘め】', 'シーシャ'),
            ('SHISHA【フルーツ系さっぱりめ】', 'シーシャ'), ('SHISHA【フローラル・ティー系】', 'シーシャ'),
            ('Lejeオリジナルドリンク ~ノンアルでもアルコール有でも可能です~', 'Lejeオリジナルドリンク'),
            ('BEER-ビール-', 'ビール'), ('HIGHBOOL-ハイボール-', 'ハイボール'),
            ('SOUR-サワー・お茶割-', 'サワー・お茶割'), ('SHOCHU-焼酎-', '焼酎'), ('WHISKY-ウィスキー-', 'ウイスキー'),
            ('COCKTAIL-カクテル-', 'カクテル・スピリッツ'), ('SPIRIT-スピリッツ-', 'カクテル・スピリッツ'),
            ('WINE-ワイン-', 'ワイン・果実酒・シャンパン'), ('FRUIT WINE-果実酒-', 'ワイン・果実酒・シャンパン'),
            ('CHAMPAGNE-シャンパン-', 'ワイン・果実酒・シャンパン'), ('SHOT-ショット-', 'ショット'),
            ('SOFT DRINK-ソフトドリンク-', 'ソフトドリンク'),
            ('MAIN-メイン-', 'メイン'), ('SIDE-サイド-', 'サイド'), ('APPETAIZER-前菜-', '前菜・スナック・スイーツ'),
            ('SNACK-スナック-', '前菜・スナック・スイーツ'), ('SWEETS-スイーツ-', '前菜・スナック・スイーツ'),
        ],
        'skip_items': set(),
        'rename': {'シークワーサーとドラゴンフルーツのモヒート石垣フルーツモヒート': '石垣フルーツモヒート（シークワーサーとドラゴンフルーツ）',
                   'お好みのフレーバーをカスタム': 'お好みのフレーバーでカスタム',
                   'ヴーヴクリコ　イエロー': 'ヴーヴ・クリコ イエロー'},
        'picks': ['お好みのフレーバーでカスタム', '石垣フルーツモヒート（シークワーサーとドラゴンフルーツ）',
                  '黒トリュフのポップコーン', '明太クリームパスタ'],
        'system': [['ドリンク飲み放題（2時間）', '3,000円', '']],
        'notes': ['価格は税込です', 'オリジナルドリンクはノンアルコールでもお作りできます'],
    },
}


def from_dinii(store, path):
    """ダイニーの注文集計CSV（cp932）→ data/menus/<store>.json"""
    rule = DINII_RULES[store]
    order = [c for c, _ in rule['categories']]
    label = dict(rule['categories'])
    rows = list(csv.reader(open(path, encoding='cp932')))
    ix = {k: i for i, k in enumerate(rows[0])}
    cats = {}
    for r in rows[1:]:
        # チップ・選択肢の行・0円の行は除く
        if r[ix['メニュータイプ']] == 'tip' or r[ix['チョイスID']]:
            continue
        cat, name, price = r[ix['分類名称']], r[ix['メニュー名称']], int(r[ix['売価(税込)']] or 0)
        if cat not in label or price == 0 or name in rule['skip_items']:
            continue
        name = rule['rename'].get(name, name)
        items = cats.setdefault(label[cat], {})
        items.setdefault(name, price)
    out = []
    for c in order:
        lab = label[c]
        if lab in cats and lab not in [o[0] for o in out]:
            out.append([lab, [[n, p] for n, p in cats[lab].items()]])
    prices = {n: p for _, items in out for n, p in items}
    data = {
        'source': f'ダイニーの注文集計 {Path(path).name}',
        'system': rule['system'],
        'picks': [[n, prices[n]] for n in rule['picks'] if n in prices],
        'categories': out,
        'notes': rule['notes'],
    }
    (DATA / f'{store}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(store, sum(len(i) for _, i in out), '品')


def yen(p):
    return f'¥{p:,}'


def render(d):
    e = html.escape
    h = ['        <p class="section__subtitle">メニュー</p>']
    if d['system']:
        h.append('        <dl class="menu-system">')
        for name, price, note in d['system']:
            if name:
                h.append(f'          <div><dt>{e(name)}</dt><dd>{e(price)}{"<small>" + e(note) + "</small>" if note else ""}</dd></div>')
            else:
                h.append(f'          <div class="menu-system__note">{e(note)}</div>')
        h.append('        </dl>')
    if d['picks']:
        h.append('        <h3 class="menu-heading">おすすめ</h3>')
        h.append('        <ul class="menu-picks">')
        for n, p in d['picks']:
            h.append(f'          <li><span class="menu-picks__name">{e(n)}</span><span class="menu-picks__price">{yen(p)}</span></li>')
        h.append('        </ul>')
    h.append('        <div class="menu-cats">')
    for i, (cat, items) in enumerate(d['categories']):
        h.append(f'          <details class="menu-cat"{" open" if i == 0 else ""}>')
        h.append(f'            <summary>{e(cat)}<span>{len(items)}品</span></summary>')
        h.append('            <ul class="menu-list">')
        for n, p in items:
            h.append(f'              <li><span>{e(n)}</span><span class="menu-list__price">{yen(p)}</span></li>')
        h.append('            </ul>')
        h.append('          </details>')
    h.append('        </div>')
    notes = d['notes'] + ['内容・価格は変わることがあります']
    h.append('        <ul class="menu-notes">' + ''.join(f'<li>{e(n)}</li>' for n in notes) + '</ul>')
    return '\n'.join(h)


def build():
    for store, page in PAGES.items():
        f = DATA / f'{store}.json'
        if not f.exists():
            continue
        p = ROOT / page
        s = p.read_text(encoding='utf-8')
        a, b = s.index(START) + len(START), s.index(END)
        s = s[:a] + '\n' + render(json.loads(f.read_text(encoding='utf-8'))) + '\n        ' + s[b:]
        p.write_text(s, encoding='utf-8')
        print('更新', page)


if __name__ == '__main__':
    if sys.argv[1] == 'dinii':
        from_dinii(sys.argv[2], sys.argv[3])
    else:
        build()
