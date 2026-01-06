import { Tile, Meld, Question, Scenario, Wind, MeldInHand } from '../types/mahjong';
import { tilesToCounts, cloneCounts, countsToTiles, getTotalCount } from '../utils/tileUtils';
import { checkWinning } from './winningDetector';

/**
 * 題目難度
 */
export enum Difficulty {
  EASY = 'easy',       // 簡單：無副露或最多1副露
  MEDIUM = 'medium',   // 中等：2-3副露
  HARD = 'hard'        // 困難：3-4副露或複雜牌型
}

/**
 * 生成隨機題目
 */
export function generateQuestion(difficulty: Difficulty = Difficulty.EASY): Question {
  let question: Question | null = null;
  let attempts = 0;
  const maxAttempts = 100;

  while (!question && attempts < maxAttempts) {
    attempts++;
    question = tryGenerateQuestion(difficulty);
  }

  if (!question) {
    // 如果生成失敗，返回一個簡單的預設題目
    return generateDefaultQuestion();
  }

  return question;
}

/**
 * 驗證牌組是否合法（每張牌最多4張）
 */
function validateTileCounts(concealedCounts: number[], openMelds: Meld[], winningTile: Tile): boolean {
  const totalCounts = [...concealedCounts];

  // 加上胡張
  totalCounts[winningTile]++;

  // 加上副露的牌
  openMelds.forEach(meld => {
    meld.tiles.forEach(tile => {
      totalCounts[tile]++;
    });
  });

  // 檢查每張牌是否超過4張
  for (let i = 0; i < 34; i++) {
    if (totalCounts[i] > 4) {
      return false;
    }
  }

  return true;
}

/**
 * 嘗試生成一個題目
 */
function tryGenerateQuestion(difficulty: Difficulty): Question | null {
  // 1. 生成完整的胡牌組合（17張：5面子+1將）
  const { decomposition, allTiles } = generateWinningHand(difficulty);

  // 2. 決定哪些面子要作為副露
  const openMeldCount = getOpenMeldCount(difficulty);
  const { openMelds, concealedTiles } = splitIntoOpenAndConcealed(
    decomposition,
    allTiles,
    openMeldCount
  );

  // 3. 從暗牌中選一張作為胡張（因為副露的牌不能當胡張）
  if (concealedTiles.length === 0) return null;
  const winningTileIndex = Math.floor(Math.random() * concealedTiles.length);
  const winningTile = concealedTiles[winningTileIndex];

  // 4. 移除胡張，得到16張的題目狀態
  const finalConcealedTiles = [...concealedTiles];
  finalConcealedTiles.splice(winningTileIndex, 1);
  const concealedCounts = tilesToCounts(finalConcealedTiles);

  // 5. 驗證牌數是否合法（每張牌最多4張）
  if (!validateTileCounts(concealedCounts, openMelds, winningTile)) {
    return null;
  }

  // 6. 驗證題目是否有效
  const verification = checkWinning(concealedCounts, openMelds, winningTile);
  if (!verification) return null;

  // 7. 生成場景資訊
  const scenario = generateScenario();

  return {
    concealedCounts,
    openMelds,
    winningTile,
    scenario
  };
}

/**
 * 生成完整的胡牌組合
 */
function generateWinningHand(difficulty: Difficulty): {
  decomposition: MeldInHand[];
  allTiles: Tile[];
} {
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  // 生成5個面子
  for (let i = 0; i < 5; i++) {
    const meld = generateRandomMeld(difficulty);
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  // 生成1個將（對子）
  const pairTile = Math.floor(Math.random() * 34);
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

/**
 * 生成隨機面子
 */
function generateRandomMeld(difficulty: Difficulty): MeldInHand {
  const rand = Math.random();

  // 根據難度調整刻子/順子比例
  const keRatio = difficulty === Difficulty.HARD ? 0.6 : 0.4;

  if (rand < keRatio) {
    // 刻子
    const tile = Math.floor(Math.random() * 34);
    return { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
  } else {
    // 順子（只能是數牌）
    const suit = Math.floor(Math.random() * 3);
    const rank = Math.floor(Math.random() * 7); // 0-6，對應1-7開始的順子
    const base = suit * 9 + rank;
    return { type: 'SHUN', tiles: [base, base + 1, base + 2], isOpen: false };
  }
}

/**
 * 根據難度決定副露數量
 */
function getOpenMeldCount(difficulty: Difficulty): number {
  switch (difficulty) {
    case Difficulty.EASY:
      return Math.random() < 0.5 ? 0 : 1;
    case Difficulty.MEDIUM:
      return Math.floor(Math.random() * 2) + 2; // 2-3
    case Difficulty.HARD:
      return Math.floor(Math.random() * 2) + 3; // 3-4
  }
}

/**
 * 將面子分為副露和暗牌
 */
function splitIntoOpenAndConcealed(
  melds: MeldInHand[],
  allTiles: Tile[],
  openMeldCount: number
): { openMelds: Meld[]; concealedTiles: Tile[] } {
  if (openMeldCount === 0) {
    return { openMelds: [], concealedTiles: allTiles };
  }

  // 隨機選擇要開門的面子
  const shuffledMelds = [...melds].sort(() => Math.random() - 0.5);
  const openMeldIndices = shuffledMelds.slice(0, Math.min(openMeldCount, melds.length));

  const openMelds: Meld[] = [];
  const concealedTiles: Tile[] = [...allTiles];

  openMeldIndices.forEach(meld => {
    if (meld.type === 'SHUN') {
      openMelds.push({ kind: 'CHI', tiles: meld.tiles as [Tile, Tile, Tile] });
      // 從暗牌中移除這個順子的牌
      meld.tiles.forEach(tile => {
        const index = concealedTiles.indexOf(tile);
        if (index > -1) concealedTiles.splice(index, 1);
      });
    } else {
      // 刻子可能是碰或明槓
      const isKong = Math.random() < 0.1; // 10%機率是明槓
      if (isKong) {
        openMelds.push({
          kind: 'MING_KONG',
          tiles: [meld.tiles[0], meld.tiles[0], meld.tiles[0], meld.tiles[0]]
        });
        // 從暗牌中移除這個刻子的牌（3張），明槓的第4張是補牌
        for (let i = 0; i < 3; i++) {
          const index = concealedTiles.indexOf(meld.tiles[0]);
          if (index > -1) concealedTiles.splice(index, 1);
        }
      } else {
        openMelds.push({ kind: 'PON', tiles: meld.tiles as [Tile, Tile, Tile] });
        // 從暗牌中移除這個刻子的牌
        meld.tiles.forEach(tile => {
          const index = concealedTiles.indexOf(tile);
          if (index > -1) concealedTiles.splice(index, 1);
        });
      }
    }
  });

  return { openMelds, concealedTiles };
}

/**
 * 生成隨機場景
 */
function generateScenario(): Scenario {
  const isSelfDraw = Math.random() < 0.5;
  const isDealer = Math.random() < 0.25;

  return {
    isSelfDraw,
    isDealer,
    dealerStreak: isDealer && Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0,
    roundWind: Wind.EAST,
    seatWind: [Wind.EAST, Wind.SOUTH, Wind.WEST, Wind.NORTH][Math.floor(Math.random() * 4)],
    isHaidi: Math.random() < 0.05,
    isGangShangKaiHua: Math.random() < 0.05,
    isQiangGangHu: Math.random() < 0.05,
    isTianHu: false,
    isDiHu: false,
    flowers: generateFlowers()
  };
}

/**
 * 生成花牌
 */
function generateFlowers(): number[] {
  const flowerCount = Math.floor(Math.random() * 4); // 0-3朵花
  const flowers: number[] = [];
  const available = [0, 1, 2, 3, 4, 5, 6, 7];

  for (let i = 0; i < flowerCount; i++) {
    const index = Math.floor(Math.random() * available.length);
    flowers.push(available[index]);
    available.splice(index, 1);
  }

  return flowers.sort((a, b) => a - b);
}

/**
 * 生成預設簡單題目（當隨機生成失敗時使用）
 */
function generateDefaultQuestion(): Question {
  // 簡單的清一色題目：1112223334445 胡6
  const concealedCounts = new Array(34).fill(0);
  // 1萬x3, 2萬x3, 3萬x3, 4萬x3, 5萬x2
  concealedCounts[0] = 3; // 1萬
  concealedCounts[1] = 3; // 2萬
  concealedCounts[2] = 3; // 3萬
  concealedCounts[3] = 3; // 4萬
  concealedCounts[4] = 2; // 5萬

  return {
    concealedCounts,
    openMelds: [],
    winningTile: 5, // 6萬
    scenario: {
      isSelfDraw: true,
      isDealer: false,
      dealerStreak: 0,
      roundWind: Wind.EAST,
      seatWind: Wind.EAST,
      isHaidi: false,
      isGangShangKaiHua: false,
      isQiangGangHu: false,
      isTianHu: false,
      isDiHu: false,
      flowers: []
    }
  };
}

/**
 * 生成特定類型的題目（用於測試或教學）
 */
export function generateSpecificQuestion(type: 'QING_YI_SE' | 'PENG_PENG_HU' | 'QI_DUI'): Question {
  switch (type) {
    case 'QING_YI_SE':
      return generateQingYiSeQuestion();
    case 'PENG_PENG_HU':
      return generatePengPengHuQuestion();
    case 'QI_DUI':
      return generateQiDuiQuestion();
  }
}

function generateQingYiSeQuestion(): Question {
  const suit = Math.floor(Math.random() * 3);
  const base = suit * 9;

  const concealedCounts = new Array(34).fill(0);
  // 生成清一色組合
  for (let i = 0; i < 5; i++) {
    const tile = base + Math.floor(Math.random() * 9);
    concealedCounts[tile] = Math.min(concealedCounts[tile] + 3, 4);
  }

  return {
    concealedCounts,
    openMelds: [],
    winningTile: base + Math.floor(Math.random() * 9),
    scenario: generateScenario()
  };
}

function generatePengPengHuQuestion(): Question {
  const concealedCounts = new Array(34).fill(0);

  // 5個刻子
  const tiles = new Set<number>();
  while (tiles.size < 5) {
    tiles.add(Math.floor(Math.random() * 34));
  }

  Array.from(tiles).forEach(tile => {
    concealedCounts[tile] = 3;
  });

  // 1個對子
  let pairTile: number;
  do {
    pairTile = Math.floor(Math.random() * 34);
  } while (tiles.has(pairTile));

  concealedCounts[pairTile] = 2;

  // 隨機選一張作為胡張
  const allTiles = Array.from(tiles);
  const winningTile = allTiles[Math.floor(Math.random() * allTiles.length)];
  concealedCounts[winningTile]--;

  return {
    concealedCounts,
    openMelds: [],
    winningTile,
    scenario: generateScenario()
  };
}

function generateQiDuiQuestion(): Question {
  const concealedCounts = new Array(34).fill(0);

  // 7個對子
  const tiles = new Set<number>();
  while (tiles.size < 7) {
    tiles.add(Math.floor(Math.random() * 34));
  }

  Array.from(tiles).forEach(tile => {
    concealedCounts[tile] = 2;
  });

  // 選一對作為聽牌
  const allTiles = Array.from(tiles);
  const winningTile = allTiles[Math.floor(Math.random() * allTiles.length)];
  concealedCounts[winningTile] = 1;

  return {
    concealedCounts,
    openMelds: [],
    winningTile,
    scenario: generateScenario()
  };
}
