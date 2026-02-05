import { Tile, Meld, Question, Scenario, Wind, MeldInHand } from '../types/mahjong';
import { RulesConfig, DEFAULT_RULES_CONFIG } from '../types/rulesConfig';
import { tilesToCounts } from '../utils/tileUtils';
import { checkWinning } from './winningDetector';
import { calculateScore } from './scoring';

/**
 * 題目難度
 */
export enum Difficulty {
  EASY = 'easy',       // 簡單：1~4台
  MEDIUM = 'medium',   // 中等：3~10台
  HARD = 'hard'        // 困難：5台以上
}

/**
 * 強制生成的牌型
 */
type ForcedPattern =
  | 'RANDOM'
  | 'QING_YI_SE'
  | 'HUN_YI_SE'
  | 'PENG_PENG_HU'
  | 'QI_DUI'
  | 'DA_SAN_YUAN'
  | 'XIAO_SAN_YUAN'
  | 'ZI_YI_SE';

/**
 * 生成隨機題目
 */
export function generateQuestion(
  difficulty: Difficulty = Difficulty.EASY,
  rulesConfig: RulesConfig = DEFAULT_RULES_CONFIG
): Question {
  let question: Question | null = null;
  let attempts = 0;
  const maxAttempts = 300;

  while (!question && attempts < maxAttempts) {
    attempts++;
    question = tryGenerateQuestion(difficulty, rulesConfig);
  }

  if (!question) {
    return generateDefaultQuestion();
  }

  return question;
}

/**
 * 驗證牌組是否合法（每張牌最多4張）
 */
function validateTileCounts(concealedCounts: number[], openMelds: Meld[], winningTile: Tile): boolean {
  const totalCounts = [...concealedCounts];
  totalCounts[winningTile]++;

  openMelds.forEach(meld => {
    meld.tiles.forEach(tile => {
      totalCounts[tile]++;
    });
  });

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
function tryGenerateQuestion(difficulty: Difficulty, rulesConfig: RulesConfig): Question | null {
  // 1. 選擇牌型模式
  const pattern = selectPattern(difficulty);

  // 2. 生成完整的胡牌組合
  const hand = generateWinningHand(pattern);
  if (!hand) return null;
  const { decomposition, allTiles } = hand;

  // 3. 決定副露數量（與難度脫鉤）
  const openMeldCount = pattern === 'QI_DUI' ? 0 : getOpenMeldCount();
  const { openMelds, concealedTiles } = splitIntoOpenAndConcealed(
    decomposition,
    allTiles,
    openMeldCount
  );

  // 4. 從暗牌中選胡張
  if (concealedTiles.length === 0) return null;
  const winningTileIndex = Math.floor(Math.random() * concealedTiles.length);
  const winningTile = concealedTiles[winningTileIndex];

  // 5. 移除胡張
  const finalConcealedTiles = [...concealedTiles];
  finalConcealedTiles.splice(winningTileIndex, 1);
  const concealedCounts = tilesToCounts(finalConcealedTiles);

  // 6. 驗證牌數合法
  if (!validateTileCounts(concealedCounts, openMelds, winningTile)) {
    return null;
  }

  // 7. 驗證可以胡牌
  const verification = checkWinning(concealedCounts, openMelds, winningTile);
  if (!verification) return null;

  // 8. 生成場景（依難度）
  const scenario = generateScenario(difficulty);

  // 9. 計算台數，檢查是否在難度範圍內
  const score = calculateScore(concealedCounts, openMelds, winningTile, scenario, rulesConfig);
  if (!isAppropriateForDifficulty(score.totalFan, difficulty)) {
    return null;
  }

  return {
    concealedCounts,
    openMelds,
    winningTile,
    scenario
  };
}

/**
 * 檢查台數是否符合難度範圍
 */
function isAppropriateForDifficulty(totalFan: number, difficulty: Difficulty): boolean {
  switch (difficulty) {
    case Difficulty.EASY: return totalFan >= 1 && totalFan <= 4;
    case Difficulty.MEDIUM: return totalFan >= 3 && totalFan <= 10;
    case Difficulty.HARD: return totalFan >= 5;
  }
}

/**
 * 根據難度選擇牌型模式
 */
function selectPattern(difficulty: Difficulty): ForcedPattern {
  const rand = Math.random();
  switch (difficulty) {
    case Difficulty.EASY:
      return 'RANDOM';
    case Difficulty.MEDIUM:
      if (rand < 0.70) return 'RANDOM';
      if (rand < 0.80) return 'HUN_YI_SE';
      if (rand < 0.90) return 'PENG_PENG_HU';
      return 'QING_YI_SE';
    case Difficulty.HARD:
      if (rand < 0.40) return 'RANDOM';
      if (rand < 0.52) return 'QING_YI_SE';
      if (rand < 0.62) return 'HUN_YI_SE';
      if (rand < 0.72) return 'PENG_PENG_HU';
      if (rand < 0.82) return 'QI_DUI';
      if (rand < 0.88) return 'DA_SAN_YUAN';
      if (rand < 0.94) return 'XIAO_SAN_YUAN';
      return 'ZI_YI_SE';
  }
}

/**
 * 副露數量（與難度脫鉤）
 */
function getOpenMeldCount(): number {
  const rand = Math.random();
  if (rand < 0.30) return 0;
  if (rand < 0.55) return 1;
  if (rand < 0.75) return 2;
  if (rand < 0.90) return 3;
  return 4;
}

/**
 * 生成完整的胡牌組合
 */
function generateWinningHand(pattern: ForcedPattern): {
  decomposition: MeldInHand[];
  allTiles: Tile[];
} | null {
  switch (pattern) {
    case 'RANDOM': return generateRandomHand();
    case 'QING_YI_SE': return generateQingYiSeHand();
    case 'HUN_YI_SE': return generateHunYiSeHand();
    case 'PENG_PENG_HU': return generatePengPengHuHand();
    case 'QI_DUI': return generateQiDuiHand();
    case 'DA_SAN_YUAN': return generateDaSanYuanHand();
    case 'XIAO_SAN_YUAN': return generateXiaoSanYuanHand();
    case 'ZI_YI_SE': return generateZiYiSeHand();
  }
}

// ====== 各牌型生成器 ======

function generateRandomHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  for (let i = 0; i < 5; i++) {
    const meld = randomMeld();
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  const pairTile = Math.floor(Math.random() * 34);
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generateQingYiSeHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const suit = Math.floor(Math.random() * 3);
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  for (let i = 0; i < 5; i++) {
    const meld = randomMeldInSuit(suit);
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  const pairTile = suit * 9 + Math.floor(Math.random() * 9);
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generateHunYiSeHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const suit = Math.floor(Math.random() * 3);
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  // 3~4 組數牌面子
  const numericCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numericCount; i++) {
    const meld = randomMeldInSuit(suit);
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  // 1~2 組字牌刻子
  const honorTiles = shuffleArray([27, 28, 29, 30, 31, 32, 33]);
  for (let i = 0; i < 5 - numericCount; i++) {
    const tile = honorTiles[i];
    const meld: MeldInHand = { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
    melds.push(meld);
    allTiles.push(tile, tile, tile);
  }

  // 將：數牌或字牌
  const pairTile = Math.random() < 0.5
    ? suit * 9 + Math.floor(Math.random() * 9)
    : 27 + Math.floor(Math.random() * 7);
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generatePengPengHuHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } | null {
  const usedTiles = new Set<number>();
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  // 5 組不同牌的刻子
  while (usedTiles.size < 5) {
    usedTiles.add(Math.floor(Math.random() * 34));
  }

  for (const tile of usedTiles) {
    const meld: MeldInHand = { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
    melds.push(meld);
    allTiles.push(tile, tile, tile);
  }

  // 將：不能和刻子重複
  let pairTile: number;
  let safety = 0;
  do {
    pairTile = Math.floor(Math.random() * 34);
    safety++;
    if (safety > 100) return null;
  } while (usedTiles.has(pairTile));

  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generateQiDuiHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const usedTiles = new Set<number>();
  const allTiles: Tile[] = [];

  while (usedTiles.size < 7) {
    usedTiles.add(Math.floor(Math.random() * 34));
  }

  // 七對子用特殊分解（第一對當將，其他6對當面子）
  const tiles = Array.from(usedTiles);
  const melds: MeldInHand[] = [];

  for (let i = 1; i < 7; i++) {
    // 七對子的「面子」用 KE 表示但只有2張（checkWinning 會正確處理）
    melds.push({ type: 'KE', tiles: [tiles[i], tiles[i], tiles[i]], isOpen: false });
    allTiles.push(tiles[i], tiles[i]);
  }

  // 將
  allTiles.push(tiles[0], tiles[0]);

  return { decomposition: melds, allTiles };
}

function generateDaSanYuanHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  // 3 組三元牌刻子（中31, 發32, 白33）
  for (const tile of [31, 32, 33]) {
    const meld: MeldInHand = { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
    melds.push(meld);
    allTiles.push(tile, tile, tile);
  }

  // 2 組隨機面子（排除三元牌刻子避免重複）
  for (let i = 0; i < 2; i++) {
    const meld = randomMeld(false); // 不包含三元牌
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  // 將（不用三元牌）
  let pairTile: number;
  do {
    pairTile = Math.floor(Math.random() * 34);
  } while (pairTile >= 31 && pairTile <= 33);

  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generateXiaoSanYuanHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } {
  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];
  const dragons = shuffleArray([31, 32, 33]);

  // 2 組三元牌刻子
  for (let i = 0; i < 2; i++) {
    const tile = dragons[i];
    const meld: MeldInHand = { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
    melds.push(meld);
    allTiles.push(tile, tile, tile);
  }

  // 3 組隨機面子（排除三元牌刻子）
  for (let i = 0; i < 3; i++) {
    const meld = randomMeld(false);
    melds.push(meld);
    allTiles.push(...meld.tiles);
  }

  // 將：第三個三元牌
  const pairTile = dragons[2];
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

function generateZiYiSeHand(): { decomposition: MeldInHand[]; allTiles: Tile[] } | null {
  // 字牌只有 27-33（7種），需要5組刻子+1將 = 6種不同牌
  const honorTiles = shuffleArray([27, 28, 29, 30, 31, 32, 33]);
  if (honorTiles.length < 6) return null;

  const melds: MeldInHand[] = [];
  const allTiles: Tile[] = [];

  for (let i = 0; i < 5; i++) {
    const tile = honorTiles[i];
    const meld: MeldInHand = { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
    melds.push(meld);
    allTiles.push(tile, tile, tile);
  }

  const pairTile = honorTiles[5];
  allTiles.push(pairTile, pairTile);

  return { decomposition: melds, allTiles };
}

// ====== 輔助函數 ======

/**
 * 生成隨機面子
 */
function randomMeld(includeDragons: boolean = true): MeldInHand {
  const rand = Math.random();

  if (rand < 0.4) {
    // 刻子
    let tile: number;
    if (includeDragons) {
      tile = Math.floor(Math.random() * 34);
    } else {
      // 排除三元牌（31-33）
      tile = Math.floor(Math.random() * 31);
    }
    return { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
  } else {
    // 順子
    const suit = Math.floor(Math.random() * 3);
    const rank = Math.floor(Math.random() * 7);
    const base = suit * 9 + rank;
    return { type: 'SHUN', tiles: [base, base + 1, base + 2], isOpen: false };
  }
}

/**
 * 在指定花色中生成隨機面子
 */
function randomMeldInSuit(suit: number): MeldInHand {
  const base = suit * 9;
  const rand = Math.random();

  if (rand < 0.4) {
    // 刻子
    const tile = base + Math.floor(Math.random() * 9);
    return { type: 'KE', tiles: [tile, tile, tile], isOpen: false };
  } else {
    // 順子
    const rank = Math.floor(Math.random() * 7);
    const start = base + rank;
    return { type: 'SHUN', tiles: [start, start + 1, start + 2], isOpen: false };
  }
}

/**
 * Fisher-Yates 洗牌
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

  const shuffledMelds = shuffleArray(melds);
  const openMeldIndices = shuffledMelds.slice(0, Math.min(openMeldCount, melds.length));

  const openMelds: Meld[] = [];
  const concealedTiles: Tile[] = [...allTiles];

  openMeldIndices.forEach(meld => {
    if (meld.type === 'SHUN') {
      openMelds.push({ kind: 'CHI', tiles: meld.tiles as [Tile, Tile, Tile] });
      meld.tiles.forEach(tile => {
        const index = concealedTiles.indexOf(tile);
        if (index > -1) concealedTiles.splice(index, 1);
      });
    } else {
      const isKong = Math.random() < 0.1;
      if (isKong) {
        openMelds.push({
          kind: 'MING_KONG',
          tiles: [meld.tiles[0], meld.tiles[0], meld.tiles[0], meld.tiles[0]]
        });
        for (let i = 0; i < 3; i++) {
          const index = concealedTiles.indexOf(meld.tiles[0]);
          if (index > -1) concealedTiles.splice(index, 1);
        }
      } else {
        openMelds.push({ kind: 'PON', tiles: meld.tiles as [Tile, Tile, Tile] });
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
 * 依難度生成場景
 */
function generateScenario(difficulty: Difficulty): Scenario {
  let isSelfDraw = Math.random() < 0.5;
  let isDealer = false;
  let dealerStreak = 0;
  let isHaidi = false;
  let isGangShangKaiHua = false;
  let isQiangGangHu = false;
  let flowerCount: number;

  switch (difficulty) {
    case Difficulty.EASY:
      // 簡單：不是莊家、無特殊場況、0~1花
      isDealer = false;
      flowerCount = Math.floor(Math.random() * 2); // 0-1
      break;

    case Difficulty.MEDIUM:
      // 中等：可能莊家（無連莊）、10%特殊、0~3花
      isDealer = Math.random() < 0.25;
      flowerCount = Math.floor(Math.random() * 4); // 0-3

      if (Math.random() < 0.10) {
        const specialType = Math.floor(Math.random() * 4);
        switch (specialType) {
          case 0: isSelfDraw = true; isHaidi = true; break;
          case 1: isSelfDraw = false; isHaidi = true; break;
          case 2: isSelfDraw = true; isGangShangKaiHua = true; break;
          case 3: isSelfDraw = false; isQiangGangHu = true; break;
        }
      }
      break;

    case Difficulty.HARD:
      // 困難：可能莊家+連莊、20%特殊、0~5花
      isDealer = Math.random() < 0.3;
      dealerStreak = isDealer && Math.random() < 0.4
        ? Math.floor(Math.random() * 3) + 1
        : 0;
      flowerCount = Math.floor(Math.random() * 6); // 0-5

      if (Math.random() < 0.20) {
        const specialType = Math.floor(Math.random() * 4);
        switch (specialType) {
          case 0: isSelfDraw = true; isHaidi = true; break;
          case 1: isSelfDraw = false; isHaidi = true; break;
          case 2: isSelfDraw = true; isGangShangKaiHua = true; break;
          case 3: isSelfDraw = false; isQiangGangHu = true; break;
        }
      }
      break;
  }

  const flowers = generateFlowers(flowerCount);

  return {
    isSelfDraw,
    isDealer,
    dealerStreak,
    roundWind: Wind.EAST,
    seatWind: [Wind.EAST, Wind.SOUTH, Wind.WEST, Wind.NORTH][Math.floor(Math.random() * 4)],
    isHaidi,
    isGangShangKaiHua,
    isQiangGangHu,
    isTianHu: false,
    isDiHu: false,
    flowers
  };
}

/**
 * 生成指定數量的花牌
 */
function generateFlowers(count: number): number[] {
  const flowers: number[] = [];
  const available = [0, 1, 2, 3, 4, 5, 6, 7];

  const actualCount = Math.min(count, available.length);
  for (let i = 0; i < actualCount; i++) {
    const index = Math.floor(Math.random() * available.length);
    flowers.push(available[index]);
    available.splice(index, 1);
  }

  return flowers.sort((a, b) => a - b);
}

/**
 * 預設題目（當隨機生成失敗時使用）
 */
function generateDefaultQuestion(): Question {
  const concealedCounts = new Array(34).fill(0);
  concealedCounts[0] = 3;
  concealedCounts[1] = 3;
  concealedCounts[2] = 3;
  concealedCounts[3] = 3;
  concealedCounts[4] = 2;

  return {
    concealedCounts,
    openMelds: [],
    winningTile: 5,
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
