# Aries 作品集網站

網址：https://ariesrunai.github.io/

## 結構
- `index.html`：首頁
- `cases.html`：專案案例
- `works.html`：視覺作品
- `lab.html`：實驗室
- `services.html`：合作服務
- `about.html`：相關經歷
- `contact.html`：聯絡
- `updates.html` / `updates.js` / `updates.css`：更新日誌
- `updates.json`：更新日誌內容（新增公告只要改這個檔）
- `img/`：網站用圖片（原檔保存在 Google Drive）
- `site.css` / `site.js`：所有頁面共用的樣式、身分偏好與雲月互動
- `_source/site.html`：共用頁首／頁尾及既有內容的唯一編輯來源
- `_source/build.py`：產生首頁與七個分類頁（只需 Python 3）

## 維護與部署

以本 Git 儲存庫為準，請勿再編輯舊 ChatGPT Sites 版本。
修改內容請改 `_source/site.html`，首頁入口摘要及頁面組合請改 `_source/build.py`；
共用樣式／互動直接修改 `site.css` / `site.js`。不要只改產生的 HTML，否則下次建置會覆蓋。

```sh
python3 _source/build.py
python3 _source/check.py
python3 -m http.server 8765
```

確認桌面／手機顯示、導覽與互動後，將來源及生成的 HTML 一起提交。
GitHub Pages 的 `pages build and deployment` 工作流程會從 `main` 建置及發布。
產生的 HTML 已提交，因此部署端不需要執行 Python，也不需要新增套件或變更 Pages 設定。
`_source/` 由現行 Jekyll 預設排除，不會作為公開網頁發布。

每頁均為實體 HTML，支援同分頁導航、瀏覽器返回／前進及直接重新整理；
舊的 `/#cases` 等分類連結會轉到對應獨立頁面。首頁及案例頁的身分偏好
使用 sessionStorage 跨頁保存；瀏覽器封鎖儲存時仍可使用預設排序。
所有分類始終可從導覽列存取。GA4 追蹤碼保留於所有頁面。

## 新增一則更新
在 `updates.json` 最上面加一筆：
```json
{"date":"YYYY-MM-DD","category":"重要通知｜作品｜專案進度","title":"標題","content":"內容","link":"可選連結"}
```

## 交接紀錄
- 2026-10-15：由 ChatGPT Sites 搬到 GitHub Pages（Claude）。移除舊的平台內建訪客統計，待之後改裝 GA4。
- 2026-10-20：安裝 GA4（評估 ID：G-67135LKMFE，資源「Aries 作品集」），index.html 與 updates.html 的 <head> 皆已加入 gtag.js（Claude）。新增頁面時記得一併加入。
