"""Check generated pages, asset references, unique IDs, and content preservation."""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index", "cases", "works", "lab", "services", "about", "updates", "contact"]


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.ids, self.refs, self.h1 = [], [], 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1 += 1
        for attr in ("src", "href"):
            if attr in attrs:
                self.refs.append(attrs[attr])
        if tag == "a" and attrs.get("href", "").startswith("/"):
            assert attrs.get("target", "_self") == "_self", attrs


before = {page: (ROOT / f"{page}.html").read_bytes() for page in PAGES}
subprocess.run(["python3", str(ROOT / "_source/build.py")], check=True)
for page in PAGES:
    html = (ROOT / f"{page}.html").read_text()
    assert before[page] == html.encode(), f"Stale generated page: {page}"
    doc = Document(html)
    assert doc.h1 == 1, (page, "heading count", doc.h1)
    assert len(doc.ids) == len(set(doc.ids)), (page, "duplicate IDs")
    assert html.count('aria-current="page"') == 1, page
    assert "G-67135LKMFE" in html, page
    for ref in doc.refs:
        if ref.startswith("#"):
            assert ref[1:] in doc.ids, (page, ref)
        elif not re.match(r"^[a-z]+:|^//", ref):
            path = ref.split("#")[0].split("?")[0].lstrip("/") or "index.html"
            assert (ROOT / path).is_file(), (page, "missing file", ref)

# Every existing content section survives on its own page, apart from page heading,
# audience controls, and the updates listing which now displays all announcements.
baseline = subprocess.check_output(
    ["git", "show", "89e7c1488a6e393d38edf12fc5c603ec97cf9171:index.html"],
    cwd=ROOT, text=True,
)
source = (ROOT / "_source/site.html").read_text()
for key in ["hero", "cases", "works", "lab", "services", "about", "contact"]:
    def section(html):
        return next(m[0] for m in re.finditer(r"<section\b.*?</section>", html, re.S)
                    if re.search(rf'\bid="{key}"', m[0].split(">")[0]))

    def words(html):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()

    if key in ("cases", "lab"):
        # 2026-10-20 改為卡片＋詳情視窗：原本每段文字都必須仍存在（僅移除 Mission 編號）。
        new = words(section(source))
        for frag in re.split(r"<[^>]+>", section(baseline)):
            frag = re.sub(r"\s+", " ", frag).strip()
            # 2026-10-21 實驗室改名「雲月 IP」，舊標題文字刻意替換
            renamed = {"Laboratory", "實驗室", "原創角色與互動實驗。"}
            # 2026-10-28 統一用詞：品牌海報指標「需重新生成」改為與首頁一致的「需整張重做」
            frag = frag.replace("需要重新生成", "需要整張重做、重新生成").replace("需重新生成", "需整張重做").replace("重新生成比例 =", "需整張重做比例 =")
            if frag and not re.fullmatch(r"Mission \d+", frag) and not (key == "lab" and frag in renamed):
                assert frag in new, (key + " text lost", frag)
    elif key == "hero":
        # 2026-10-27 首屏改為 AI 導入定位（標題、副標、首屏錄影），文字刻意更新；只確認區塊存在。
        assert words(section(source)), key
    elif key == "about":
        # 2026-10-27 工具標籤移除 Canva、Photoshop（不屬熟練工具），其餘文字須保留。
        base = words(section(baseline)).replace("Canva", "").replace("Photoshop", "")
        # 2026-10-28 現職年份補「— 現在」
        assert re.sub(r"\s+", "", base).replace("2026社群內容", "2026—現在社群內容") == re.sub(r"\s+", "", words(section(source))), key
    else:
        assert words(section(baseline)) == words(section(source)), key

assert not subprocess.check_output(
    ["git", "diff", "89e7c1488a6e393d38edf12fc5c603ec97cf9171", "--",
     "img", "og.png", "updates.js", "updates.css"],
    cwd=ROOT,
), "Original assets or updates data changed"
print("PASS: 8 pages; deterministic build; headings, IDs, links, GA4, original content/assets.")
