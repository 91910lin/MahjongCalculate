import {
  Tile,
  Meld,
  WinningDecomposition,
  Scenario,
  FanResult,
  ScoreResult,
  Wind
} from '../types/mahjong';
import {
  isHonor,
  isWind,
  isDragon,
  getSuit,
  countsToTiles,
  getTotalCount
} from '../utils/tileUtils';
import { checkWinning, isThirteenOrphans, countConcealedTriplets, isMenQing } from './winningDetector';

/**
 * 計算胡牌總分
 */
export function calculateScore(
  concealedCounts: number[],
  openMelds: Meld[],
  winningTile: Tile,
  scenario: Scenario
): ScoreResult {
  // 1. 檢查是否胡牌
  const decomposition = checkWinning(concealedCounts, openMelds, winningTile);

  if (!decomposition) {
    return {
      fans: [],
      totalFan: 0,
      basePoints: 0,
      totalPoints: 0,
      isWinning: false
    };
  }

  // 2. 計算所有台型
  const fans: FanResult[] = [];

  // 特殊牌型
  checkSpecialPatterns(fans, concealedCounts, openMelds, decomposition, winningTile, scenario);

  // 基本台型
  checkBasicPatterns(fans, decomposition, openMelds, scenario);

  // 花牌
  checkFlowers(fans, scenario);

  // 場況台
  checkSituationalFans(fans, scenario, openMelds);

  // 3. 計算總台數
  const totalFan = fans.reduce((sum, f) => sum + f.fan, 0);

  // 4. 計算分數（台數 × 底分）
  const basePoints = 10; // 基礎底分
  const totalPoints = totalFan * basePoints;

  return {
    fans,
    totalFan,
    basePoints,
    totalPoints,
    isWinning: true,
    decomposition
  };
}

/**
 * 檢查特殊牌型
 */
function checkSpecialPatterns(
  fans: FanResult[],
  concealedCounts: number[],
  openMelds: Meld[],
  decomposition: WinningDecomposition,
  winningTile: Tile,
  scenario: Scenario
): void {
  const allTiles = [...countsToTiles(concealedCounts), winningTile];

  // 國士無雙（13么九）
  if (openMelds.length === 0 && isThirteenOrphans(concealedCounts.map((c, i) => i === winningTile ? c + 1 : c))) {
    fans.push({ name: '國士無雙', fan: 8 });
    return; // 國士無雙排除其他判定
  }

  // 天胡
  if (scenario.isTianHu) {
    fans.push({ name: '天胡', fan: 8 });
  }

  // 地胡
  if (scenario.isDiHu) {
    fans.push({ name: '地胡', fan: 8 });
  }

  // 大三元（中發白都是刻子）
  const dragonKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
  );
  if (dragonKe.length === 3) {
    fans.push({ name: '大三元', fan: 8 });
  }

  // 大四喜（東南西北都是刻子）
  const windKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isWind(m.tiles[0])
  );
  if (windKe.length === 4) {
    fans.push({ name: '大四喜', fan: 8 });
  }

  // 小四喜（3風刻+1風將）
  if (windKe.length === 3 && isWind(decomposition.pair[0])) {
    fans.push({ name: '小四喜', fan: 8 });
  }

  // 字一色（全部字牌）
  if (allTiles.every(t => isHonor(t))) {
    fans.push({ name: '字一色', fan: 8 });
  }

  // 清一色（全部同花色數牌）
  const suit = getSuit(allTiles.find(t => !isHonor(t)) || -1);
  if (suit >= 0 && suit < 3 && allTiles.every(t => getSuit(t) === suit)) {
    fans.push({ name: '清一色', fan: 8 });
  }

  // 混一色（只有一種數牌花色+字牌）
  if (fans.every(f => f.name !== '清一色' && f.name !== '字一色')) {
    const suits = new Set(allTiles.filter(t => !isHonor(t)).map(t => getSuit(t)));
    if (suits.size === 1 && allTiles.some(t => isHonor(t))) {
      fans.push({ name: '混一色', fan: 4 });
    }
  }

  // 碰碰胡（全刻子）
  if (decomposition.melds.every(m => m.type === 'KE' || m.type === 'GANG')) {
    fans.push({ name: '碰碰胡', fan: 4 });
  }

  // 五暗刻（含對子）
  const concealedKe = countConcealedTriplets(decomposition);
  if (concealedKe === 5) {
    fans.push({ name: '五暗刻', fan: 8 });
  } else if (concealedKe === 4) {
    fans.push({ name: '四暗刻', fan: 5 });
  } else if (concealedKe === 3) {
    fans.push({ name: '三暗刻', fan: 2 });
  }

  // 全求人（4副露+單吊，不可自摸）
  if (openMelds.length === 4 && openMelds.every(m => m.kind !== 'AN_KONG') && !scenario.isSelfDraw) {
    // 檢查是否單吊（剩餘暗牌只有對子在等）
    const concealedTilesCount = getTotalCount(concealedCounts);
    if (concealedTilesCount === 1) {
      fans.push({ name: '全求人', fan: 2 });
    }
  }

  // 七對子
  if (openMelds.length === 0 && getTotalCount(concealedCounts) + 1 === 14) {
    // 檢查是否為7對
    const counts = [...concealedCounts];
    counts[winningTile]++;
    let pairs = 0;
    for (let i = 0; i < 34; i++) {
      if (counts[i] === 2) pairs++;
      else if (counts[i] !== 0) {
        pairs = 0;
        break;
      }
    }
    if (pairs === 7) {
      fans.push({ name: '七對子', fan: 4 });
    }
  }

  // 平胡（門清+全順子+無字將+雙面聽）
  if (isMenQing(openMelds) &&
    decomposition.melds.every(m => m.type === 'SHUN') &&
    !isHonor(decomposition.pair[0])) {
    // 簡化版：不檢查雙面聽
    fans.push({ name: '平胡', fan: 2 });
  }
}

/**
 * 檢查基本台型
 */
function checkBasicPatterns(
  fans: FanResult[],
  decomposition: WinningDecomposition,
  openMelds: Meld[],
  scenario: Scenario
): void {
  // 門清
  if (isMenQing(openMelds) && scenario.isSelfDraw) {
    fans.push({ name: '門清自摸', fan: 1 });
  }

  // 三元牌刻子
  const dragonKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
  );
  dragonKe.forEach(m => {
    const dragonNames = ['中', '發', '白'];
    const dragonName = dragonNames[m.tiles[0] - 31];
    fans.push({ name: dragonName, fan: 1 });
  });

  // 風牌刻子（圈風或門風）
  const windKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isWind(m.tiles[0])
  );
  windKe.forEach(m => {
    const tile = m.tiles[0];
    if (tile === scenario.roundWind) {
      fans.push({ name: '圈風', fan: 1 });
    }
    if (tile === scenario.seatWind) {
      fans.push({ name: '門風', fan: 1 });
    }
  });

  // 獨聽（在聽牌計算中判定，此處簡化）
  // 需要額外實作聽牌計算來判斷是否只有一個聽張

  // 無字（全部數牌）
  const allTilesInMelds = decomposition.melds.flatMap(m => m.tiles);
  const allTilesWithPair = [...allTilesInMelds, ...decomposition.pair];
  if (allTilesWithPair.every(t => !isHonor(t))) {
    fans.push({ name: '無字', fan: 1 });
  }
}

/**
 * 檢查花牌
 */
function checkFlowers(fans: FanResult[], scenario: Scenario): void {
  if (scenario.flowers.length === 8) {
    fans.push({ name: '八仙過海', fan: 8 });
    return;
  }

  // 花牌編號：0春 1夏 2秋 3冬 4梅 5蘭 6菊 7竹
  // 位置對應：0東 1南 2西 3北
  const seatIndex = scenario.seatWind - Wind.EAST;
  let flowerFan = 0;

  scenario.flowers.forEach(flower => {
    // 春夏秋冬（0-3）對應東南西北
    if (flower < 4 && flower === seatIndex) {
      flowerFan++;
    }
    // 梅蘭菊竹（4-7）對應東南西北
    else if (flower >= 4 && (flower - 4) === seatIndex) {
      flowerFan++;
    }
  });

  if (flowerFan > 0) {
    fans.push({ name: '本花', fan: flowerFan });
  }
}

/**
 * 檢查場況台
 */
function checkSituationalFans(
  fans: FanResult[],
  scenario: Scenario,
  _openMelds: Meld[]
): void {
  // 自摸
  if (scenario.isSelfDraw && !fans.some(f => f.name === '門清自摸')) {
    fans.push({ name: '自摸', fan: 1 });
  }

  // 海底撈月/撈魚
  if (scenario.isHaidi) {
    const name = scenario.isSelfDraw ? '海底撈月' : '海底撈魚';
    fans.push({ name, fan: 1 });
  }

  // 槓上開花
  if (scenario.isGangShangKaiHua) {
    fans.push({ name: '槓上開花', fan: 1 });
  }

  // 搶槓胡
  if (scenario.isQiangGangHu) {
    fans.push({ name: '搶槓胡', fan: 1 });
  }

  // 莊家連莊
  if (scenario.isDealer && scenario.dealerStreak > 0) {
    fans.push({ name: `連莊${scenario.dealerStreak}`, fan: scenario.dealerStreak });
  }
}

/**
 * 計算聽牌集合（用於獨聽判定）
 */
export function calculateTingSet(
  concealedCounts: number[],
  openMelds: Meld[]
): Set<Tile> {
  const tingSet = new Set<Tile>();

  for (let tile = 0; tile < 34; tile++) {
    if (concealedCounts[tile] >= 4) continue; // 已經4張的不可能聽

    const decomposition = checkWinning(concealedCounts, openMelds, tile);
    if (decomposition) {
      tingSet.add(tile);
    }
  }

  return tingSet;
}

/**
 * 檢查並添加獨聽台
 */
export function addDuTingIfApplicable(
  fans: FanResult[],
  concealedCounts: number[],
  openMelds: Meld[]
): void {
  const tingSet = calculateTingSet(concealedCounts, openMelds);
  if (tingSet.size === 1) {
    fans.push({ name: '獨聽', fan: 1 });
  }
}
