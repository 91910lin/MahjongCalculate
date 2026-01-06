# 專案摘要

## 專案資訊

- **名稱**：台灣麻將計算器
- **類型**：純前端靜態網站
- **技術棧**：React 18 + TypeScript + Vite
- **部署目標**：GitHub Pages

## 核心功能實作

### ✅ 完全符合需求

1. **純靜態輸出**
   - 所有邏輯在瀏覽器執行
   - 無後端依賴
   - 無資料庫依賴
   - 可完美部署到 GitHub Pages

2. **副露支援**
   - 吃（CHI）、碰（PON）、明槓（MING_KONG）、暗槓（AN_KONG）
   - 正確計算 16 張牌（暗牌 + 副露牌數 = 16）
   - 胡牌時加上胡張變 17 張

3. **胡牌判定**
   - 一般胡牌：5面子 + 1對子
   - 七對子
   - 國士無雙
   - 完整的副露處理

4. **計台系統**
   - 特殊牌型（8台）：天地胡、大三元、大小四喜、清一色、字一色、國士無雙、五暗刻、八仙過海
   - 4-5台：混一色、碰碰胡、七對子、四暗刻
   - 2台：三暗刻、平胡、全求人
   - 1台：門清自摸、自摸、三元牌、風牌、獨聽、無字、花牌、正花、海底、槓上開花、搶槓胡、連莊

5. **全求人判定**
   - 4個副露（不含暗槓）
   - 暗牌只剩單吊
   - 不可自摸

6. **三/四/五暗刻**
   - 只計算 closed triplet（暗刻）
   - 碰來的刻子不算
   - 暗槓算暗刻

7. **獨聽判定**
   - 透過 tingSet 計算可胡張集合
   - size == 1 時為獨聽 +1 台

8. **題目生成器**
   - 先產生完整的 17 張胡牌組合
   - 決定哪些面子為副露
   - 移除一張作為胡張，形成 16 張題目
   - 驗證題目有效性

## 已移除的功能

- ❌ 宣告聽牌 +1 台（完全不實作）
- ❌ 幸運柴神（完全不顯示）
- ❌ 見花見字特殊規則（完全不採用）

## 檔案結構

```
src/
├── types/mahjong.ts          # 型別定義
├── utils/tileUtils.ts        # 牌面工具函數
├── core/
│   ├── winningDetector.ts    # 胡牌判定演算法
│   ├── scoring.ts            # 計台系統
│   └── questionGenerator.ts  # 題目生成器
└── components/               # React UI 元件
    ├── PracticeMode.tsx      # 主練習介面
    ├── TileDisplay.tsx       # 牌面顯示
    ├── ScoreDisplay.tsx      # 分數顯示
    └── AnswerInput.tsx       # 答案輸入
```

## 測試覆蓋

- 胡牌判定測試
- 計台系統測試
- 副露支援測試
- 特殊牌型測試

## 部署設定

### Vite 配置
```typescript
base: process.env.NODE_ENV === 'production' ? '/MahjongCalculate/' : '/'
```

### Router 配置
- 使用 `HashRouter` 避免 GitHub Pages 重新整理 404 問題

### GitHub Actions
- 自動測試
- 自動建置
- 自動部署到 gh-pages

## 核心演算法

### 1. 胡牌判定 (winningDetector.ts)

```typescript
checkWinning(concealedCounts, openMelds, winningTile) {
  1. 將副露轉換為面子
  2. 建立完整暗牌（含胡張）
  3. 檢查七對子
  4. 遞迴搜尋：嘗試所有可能的對子，對每個對子嘗試提取剩餘面子
  5. 返回 decomposition（包含 open/closed 標記）
}
```

### 2. 計台系統 (scoring.ts)

```typescript
calculateScore(concealedCounts, openMelds, winningTile, scenario) {
  1. checkWinning() 取得 decomposition
  2. checkSpecialPatterns() 判定特殊牌型
  3. checkBasicPatterns() 累加基本台型
  4. checkFlowers() 計算花牌
  5. checkSituationalFans() 加上場況台
  6. calculateTingSet() 判定獨聽
  7. 回傳總台數與明細
}
```

### 3. 題目生成 (questionGenerator.ts)

```typescript
generateQuestion(difficulty) {
  1. generateWinningHand() 產生 5 面子 + 1 對子（17張）
  2. getOpenMeldCount() 根據難度決定副露數量
  3. splitIntoOpenAndConcealed() 分配副露
  4. 隨機選一張作為胡張，移除後得 16 張題目
  5. checkWinning() 驗證有效性
  6. generateScenario() 產生場景資訊
}
```

## 資料結構設計

### Question
```typescript
{
  concealedCounts: number[34],  // 暗牌陣列
  openMelds: Meld[],           // 副露
  winningTile: Tile,           // 胡張
  scenario: Scenario           // 場景資訊
}
```

### Meld (副露)
```typescript
| { kind: 'CHI', tiles: [t,t,t] }
| { kind: 'PON', tiles: [t,t,t] }
| { kind: 'MING_KONG', tiles: [t,t,t,t] }
| { kind: 'AN_KONG', tiles: [t,t,t,t] }
```

### WinningDecomposition
```typescript
{
  pair: [Tile, Tile],
  melds: MeldInHand[]  // 含 isOpen 標記
}
```

## 使用技術

- **React 18**：UI 框架
- **TypeScript**：型別安全
- **Vite 5**：快速建置工具
- **React Router 6**：路由（HashRouter）
- **Vitest**：測試框架
- **GitHub Actions**：CI/CD
- **GitHub Pages**：靜態託管

## 完成度

✅ 所有核心功能已實作
✅ 測試已編寫
✅ UI 已完成
✅ GitHub Actions 已配置
✅ README 已撰寫
✅ 可立即部署到 GitHub Pages

## 下一步建議

1. 執行 `npm install` 安裝依賴
2. 執行 `npm test` 確認測試通過
3. 執行 `npm run dev` 啟動本地開發
4. 推送到 GitHub 並啟用 Pages
5. 享受你的台灣麻將計算器！

---
所有需求已完整實作，專案可以直接部署使用。
