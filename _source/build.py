"""Build GitHub Pages HTML from the shared source; Python standard library only."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
source = (ROOT / "_source/site.html").read_text()
pages = {
    "cases": ("專案案例", "每個案例都寫清楚三件事：遇到什麼問題、怎麼設計解法、最後改變了什麼。"),
    "works": ("視覺作品", "農機品牌社群海報。資訊層級、產品編排、賣點圖示與多機型比較。"),
    "lab": ("雲月 IP", "原創角色「雲月」的設定、動畫、表情貼圖與 3D 模型，持續延伸中。"),
    "services": ("合作服務", "求職期間以全職職位為優先，亦可討論單次專案合作。"),
    "about": ("相關經歷", "2017 年起累積社群與內容經驗，橫跨電商、自媒體、社群經營與 AI 內容製作。"),
    "updates": ("更新日誌", "重要通知、作品與專案進度。"),
    "contact": ("聯絡", "有內容或 AI 導入想聊聊？歡迎來信說明需求。"),
}
sections = {}
for match in re.finditer(r'<section\b[^>]*>.*?</section>', source, re.S):
    section_id = re.search(r'\bid="([^"]+)"', match[0]).group(1)
    sections[section_id] = match[0]
assert set(sections) == set(pages) | {"hero", "method"}
main_start = source.index('<main id="top">')
main_end = source.index('</main>', main_start) + len('</main>')
home_intro = source[main_start:source.index('<div id="flow">')]
audience = re.search(r'<div class="aud".*?</div>', source, re.S)[0]
cards = "".join(
    f'<a class="page-card" data-page="{key}" href="/{key}.html">'
    f'<strong>{title} →</strong><p>{description}</p></a>'
    for key, (title, description) in pages.items()
)
home = home_intro + (
    '<section class="block" id="explore" aria-labelledby="explore-title">'
    '<div class="sec-head"><p class="label">Explore</p><div>'
    '<h2 id="explore-title">探索作品集</h2></div></div>'
    f'<div class="page-grid">{cards}</div></section></div></main>'
)
for key in ["home", *pages]:
    title = "Aries 作品集" if key == "home" else f"{pages[key][0]}｜Aries 作品集"
    url = "/" if key == "home" else f"/{key}.html"
    if key == "home":
        main = home
    else:
        section = sections[key]
        section = re.sub(r'<h2>(.*?)</h2>', r'<h1>\1</h1>', section, count=1)
        if key == "cases":
            section = section.replace('</div>\n      </div>', '</div>\n      </div>' + audience, 1)
        if key == "services":
            section = section.replace('id="servicesDetails"', 'id="servicesDetails" open')
        if key == "updates":
            section = section.replace(' data-limit="3"', '')
            section = re.sub(r'<div class="cta">.*?</div>', '', section)
            filters = '<div class="update-filters" role="group" aria-label="依更新分類篩選">'
            for category in ["全部", "重要通知", "作品", "專案進度"]:
                filters += (f'<button type="button" data-update-filter="{category}" '
                            f'aria-pressed="{str(category == "全部").lower()}">{category}</button>')
            filters += '</div>'
            section = section.replace('<p class="update-status"', filters + '<p class="update-status"')
        main = ('<main id="top"><div class="wrap">'
                '<a class="page-back" href="/">← 回首頁</a>'
                + section + '</div></main>')
    html = source[:main_start] + main + source[main_end:]
    html = html.replace('<body>', f'<body data-page="{key}">')
    html = html.replace('<title>Aries 作品集</title>', f'<title>{title}</title>')
    html = html.replace('property="og:title" content="Aries 作品集"', f'property="og:title" content="{title}"')
    html = html.replace('property="og:url" content="https://ariesrunai.github.io/"',
                        f'property="og:url" content="https://ariesrunai.github.io{url}"')
    html = html.replace('</head>', f'<link rel="canonical" href="https://ariesrunai.github.io{url}">\n</head>')
    if key != "home":
        html = re.sub(r'<meta name="description" content="[^"]*">',
                      f'<meta name="description" content="{pages[key][1]}">', html)
    # Only mark the link in the primary navigation, not repeated links elsewhere.
    nav = re.search(r'<nav\b.*?</nav>', html, re.S)[0]
    html = html.replace(nav, nav.replace(f'href="{url}"', f'href="{url}" aria-current="page"'))
    html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
    (ROOT / ("index.html" if key == "home" else key + ".html")).write_text(html)
print("Built homepage and seven standalone pages.")
