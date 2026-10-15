# Aries 作品集網站

網址：https://ariesrunai.github.io/

## 結構
- `index.html`：首頁
- `updates.html` / `updates.js` / `updates.css`：更新日誌
- `updates.json`：更新日誌內容（新增公告只要改這個檔）
- `img/`：網站用圖片（原檔保存在 Google Drive）

## 新增一則更新
在 `updates.json` 最上面加一筆：
```json
{"date":"YYYY-MM-DD","category":"重要通知｜作品｜專案進度","title":"標題","content":"內容","link":"可選連結"}
```

## 交接紀錄
- 2026-10-15：由 ChatGPT Sites 搬到 GitHub Pages（Claude）。移除舊的平台內建訪客統計，待之後改裝 GA4。
