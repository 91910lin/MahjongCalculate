# 🀄 台灣麻將計算器

一個完全運行在瀏覽器端的台灣麻將計算器，支援胡牌判定、台數計算、以及互動式練習模式。

## ✨ 特色功能

- ✅ **純前端實作**：所有邏輯在瀏覽器執行，無需後端伺服器
- ✅ **完整胡牌判定**：支援一般胡牌、七對子、國士無雙
- ✅ **副露支援**：正確處理吃、碰、明槓、暗槓
- ✅ **精確計台**：實作完整台灣麻將規則，包含所有台型
- ✅ **互動練習**：隨機生成題目，即時回饋
- ✅ **響應式設計**：支援各種螢幕尺寸
- ✅ **可部署至 GitHub Pages**：完全靜態網站

## 🎮 支援的台型

### 8 台
- 天胡、地胡
- 大三元、大四喜、小四喜
- 字一色、清一色
- 國士無雙
- 五暗刻
- 八仙過海（8朵花）

### 4-5 台
- 混一色（4台）
- 碰碰胡（4台）
- 七對子（4台）
- 四暗刻（5台）

### 2 台
- 三暗刻
- 平胡
- 全求人

### 1 台
- 門清自摸
- 自摸
- 中、發、白（三元牌刻子）
- 圈風、門風
- 獨聽
- 無字
- 花牌、正花
- 海底撈月/海底撈魚
- 槓上開花
- 搶槓胡
- 連莊

## 🚀 快速開始

### 本地開發

1. **克隆專案**
```bash
git clone https://github.com/你的用戶名/MahjongCalculate.git
cd MahjongCalculate
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發伺服器**
```bash
npm run dev
```

4. **開啟瀏覽器**
訪問 `http://localhost:5173`

### 執行測試

```bash
# 執行所有測試
npm test

# 執行測試並顯示 UI
npm run test:ui

# 生成測試覆蓋率報告
npm run test:coverage
```

### 建置生產版本

```bash
npm run build
```

建置完成的檔案會在 `dist` 目錄中。

## 📦 部署到 GitHub Pages

### 方法一：自動部署（推薦）

1. **在 GitHub 上建立新儲存庫**
   - 儲存庫名稱：`MahjongCalculate`（或任意名稱）

2. **推送程式碼**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/MahjongCalculate.git
git push -u origin main
```

3. **啟用 GitHub Pages**
   - 進入儲存庫的 Settings
   - 點選左側的 "Pages"
   - 在 "Source" 下選擇 "GitHub Actions"

4. **自動部署**
   - 每次推送到 `main` 分支時，GitHub Actions 會自動建置並部署
   - 部署完成後，可以在 `https://你的用戶名.github.io/MahjongCalculate/` 訪問

### 方法二：手動部署

```bash
# 建置專案
npm run build

# 部署到 gh-pages 分支（需要安裝 gh-pages 套件）
npm install -g gh-pages
gh-pages -d dist
```

## 🏗️ 專案結構

```
MahjongCalculate/
├── src/
│   ├── core/                 # 核心邏輯
│   │   ├── winningDetector.ts    # 胡牌判定
│   │   ├── scoring.ts            # 計台系統
│   │   └── questionGenerator.ts  # 題目生成
│   ├── types/                # TypeScript 型別定義
│   │   └── mahjong.ts
│   ├── utils/                # 工具函數
│   │   └── tileUtils.ts
│   ├── components/           # React 元件
│   │   ├── PracticeMode.tsx      # 練習模式
│   │   ├── TileDisplay.tsx       # 牌面顯示
│   │   ├── ScoreDisplay.tsx      # 分數顯示
│   │   └── AnswerInput.tsx       # 答案輸入
│   ├── App.tsx               # 主應用程式
│   ├── main.tsx              # 入口點
│   └── index.css             # 全域樣式
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 部署配置
├── package.json
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
└── README.md
```

## 🛠️ 技術棧

- **前端框架**：React 18 + TypeScript
- **建置工具**：Vite 5
- **路由**：React Router 6 (HashRouter)
- **測試框架**：Vitest
- **部署**：GitHub Pages + GitHub Actions
- **樣式**：原生 CSS

## 📝 核心演算法

### 胡牌判定

1. **副露處理**：將副露（吃、碰、槓）轉換為固定面子
2. **七對子判定**：檢查是否為7個對子
3. **一般胡牌**：使用遞迴搜尋，嘗試所有可能的對子與面子組合
4. **國士無雙**：檢查13種么九牌

### 計台系統

1. **特殊牌型判定**：大三元、清一色、碰碰胡等
2. **基本台型累加**：門清、三元牌、風牌等
3. **場況台**：自摸、海底、槓上開花等
4. **獨聽判定**：計算聽牌集合，判斷是否只聽一張

### 題目生成

1. **生成完整胡牌**：隨機產生 5 個面子 + 1 個對子（17張）
2. **決定副露**：根據難度隨機選擇部分面子作為副露
3. **選擇胡張**：從17張中隨機選一張作為胡張
4. **驗證有效性**：確保移除胡張後的16張仍能胡該張牌

## 🎯 使用方式

1. **選擇難度**：簡單、中等、困難
2. **查看題目**：顯示暗牌、副露、胡張、場況資訊
3. **計算台數**：根據規則計算總台數
4. **輸入答案**：在輸入框中填入計算結果
5. **查看解答**：顯示正確答案、台型明細、胡牌拆解

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 🔗 相關連結

- [台灣麻將規則](https://zh.wikipedia.org/wiki/%E5%8F%B0%E7%81%A3%E9%BA%BB%E5%B0%87)
- [GitHub Pages 文件](https://docs.github.com/en/pages)
- [Vite 文件](https://vitejs.dev/)
- [React 文件](https://react.dev/)

---

Made with ❤️ for Mahjong lovers
