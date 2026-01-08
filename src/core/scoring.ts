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

  // 獨聽判定
  addDuTingIfApplicable(fans, concealedCounts, openMelds);

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
 * 依據中華民國麻將競技協會規則 (98年12月26日修訂版)
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

  // === 十六台 ===

  // 天胡：莊家取完牌後已胡牌，不得加計門清、不求、自摸、天地聽
  if (scenario.isTianHu) {
    fans.push({ name: '天胡', fan: 16 });
    // 天胡不加計門清、不求、自摸，但其餘可另計
  }

  // 地胡：閒家第一巡第一次摸牌即自摸，不得加計自摸、門清、不求、天地聽
  if (scenario.isDiHu) {
    fans.push({ name: '地胡', fan: 16 });
  }

  // 大四喜：有風牌4種刻子，不得加計門風、圈風台
  const windKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isWind(m.tiles[0])
  );
  if (windKe.length === 4) {
    fans.push({ name: '大四喜', fan: 16 });
    // 大四喜不加計門風、圈風
  }

  // === 八台 ===

  // 國士無雙（13么九）- 此規則中沒有，但保留
  if (openMelds.length === 0 && isThirteenOrphans(concealedCounts.map((c, i) => i === winningTile ? c + 1 : c))) {
    fans.push({ name: '國士無雙', fan: 8 });
    return; // 國士無雙排除其他判定
  }

  // 大三元（中發白都是刻子）
  const dragonKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
  );
  if (dragonKe.length === 3) {
    fans.push({ name: '大三元', fan: 8 });
  }

  // 小四喜（3風刻+1風將）
  if (windKe.length === 3 && isWind(decomposition.pair[0])) {
    fans.push({ name: '小四喜', fan: 8 });
  }

  // 字一色（全部字牌）- 圈風、門風、三元牌可複合計算
  if (allTiles.every(t => isHonor(t))) {
    fans.push({ name: '字一色', fan: 8 });
  }

  // 清一色（全部同花色數牌）
  const suit = getSuit(allTiles.find(t => !isHonor(t)) || -1);
  if (suit >= 0 && suit < 3 && allTiles.every(t => getSuit(t) === suit)) {
    fans.push({ name: '清一色', fan: 8 });
  }

  // 五暗刻
  const concealedKe = countConcealedTriplets(decomposition);
  if (concealedKe === 5) {
    fans.push({ name: '五暗刻', fan: 8 });
  }

  // 八仙過海在花牌中檢查

  // === 五台 ===

  // 四暗刻
  if (concealedKe === 4 && !fans.some(f => f.name === '五暗刻')) {
    fans.push({ name: '四暗刻', fan: 5 });
  }

  // === 四台 ===

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

  // 小三元（中發白其中二組刻子一組對子）
  if (dragonKe.length === 2 && isDragon(decomposition.pair[0])) {
    fans.push({ name: '小三元', fan: 4 });
  }

  // 七對子（此規則中沒有明確列出，暫時保留）
  if (openMelds.length === 0 && getTotalCount(concealedCounts) + 1 === 14) {
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

  // === 二台 ===

  // 平胡：五組順子+一對子，胡他人牌非自摸，無字花牌，兩面聽
  if (isMenQing(openMelds) &&
    decomposition.melds.every(m => m.type === 'SHUN') &&
    !isHonor(decomposition.pair[0]) &&
    !scenario.isSelfDraw &&  // 必須胡他人牌
    scenario.flowers.length === 0) {  // 無花牌
    fans.push({ name: '平胡', fan: 2 });
  }

  // 全求人（4副露+單吊，胡他人牌）
  if (openMelds.length === 4 && openMelds.every(m => m.kind !== 'AN_KONG') && !scenario.isSelfDraw) {
    const concealedTilesCount = getTotalCount(concealedCounts);
    if (concealedTilesCount === 1) {
      fans.push({ name: '全求人', fan: 2 });
    }
  }

  // 三暗刻
  if (concealedKe === 3 && !fans.some(f => f.name === '四暗刻' || f.name === '五暗刻')) {
    fans.push({ name: '三暗刻', fan: 2 });
  }
}

/**
 * 檢查基本台型
 * 依據中華民國麻將競技協會規則
 */
function checkBasicPatterns(
  fans: FanResult[],
  decomposition: WinningDecomposition,
  openMelds: Meld[],
  scenario: Scenario
): void {
  const hasTianHu = fans.some(f => f.name === '天胡');
  const hasDiHu = fans.some(f => f.name === '地胡');
  const hasDaSiXi = fans.some(f => f.name === '大四喜');

  // 門清：沒有吃牌、碰牌、明槓（1台）
  // 天胡、地胡不得加計門清
  if (isMenQing(openMelds) && !hasTianHu && !hasDiHu) {
    fans.push({ name: '門清', fan: 1 });
  }

  // 不求：完全沒吃碰且自摸（1台）
  // 天胡、地胡不得加計不求
  if (isMenQing(openMelds) && scenario.isSelfDraw && !hasTianHu && !hasDiHu) {
    fans.push({ name: '不求', fan: 1 });
  }

  // 三元牌刻子（中、發、白各1台）
  const dragonKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
  );
  // 大三元時仍可計算個別三元牌台數
  dragonKe.forEach(m => {
    const dragonNames = ['中', '發', '白'];
    const dragonName = dragonNames[m.tiles[0] - 31];
    fans.push({ name: dragonName, fan: 1 });
  });

  // 風牌刻子（圈風、門風各1台）
  // 大四喜不得加計門風、圈風
  if (!hasDaSiXi) {
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
  }

  // 獨聽：邊張、中洞、單吊（1台）
  // 需要在聽牌計算中判定
}

/**
 * 檢查花牌
 * 依據中華民國麻將競技協會規則
 */
function checkFlowers(fans: FanResult[], scenario: Scenario): void {
  // 八仙過海：8張花牌（8台）
  if (scenario.flowers.length === 8) {
    fans.push({ name: '八仙過海', fan: 8 });
    return;
  }

  // 花牌編號：0春 1夏 2秋 3冬 4梅 5蘭 6菊 7竹
  // 位置對應：0東 1南 2西 3北
  const seatIndex = scenario.seatWind - Wind.EAST;
  let flowerFan = 0;

  // 檢查花槓（梅蘭竹菊或春夏秋冬任一組完整）（2台）
  const hasChunXiaQiuDong = [0, 1, 2, 3].every(f => scenario.flowers.includes(f));
  const hasMeiLanZhuJu = [4, 5, 6, 7].every(f => scenario.flowers.includes(f));

  if (hasChunXiaQiuDong) {
    fans.push({ name: '花槓（春夏秋冬）', fan: 2 });
  }
  if (hasMeiLanZhuJu) {
    fans.push({ name: '花槓（梅蘭竹菊）', fan: 2 });
  }

  // 本花：符合自己方位的花牌，一張一台
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
    fans.push({ name: '花牌', fan: flowerFan });
  }
}

/**
 * 檢查場況台
 * 依據中華民國麻將競技協會規則
 */
function checkSituationalFans(
  fans: FanResult[],
  scenario: Scenario,
  _openMelds: Meld[]
): void {
  const hasTianHu = fans.some(f => f.name === '天胡');
  const hasDiHu = fans.some(f => f.name === '地胡');

  // 自摸（1台）- 天胡、地胡不得加計自摸
  if (scenario.isSelfDraw && !hasTianHu && !hasDiHu) {
    fans.push({ name: '自摸', fan: 1 });
  }

  // 莊家（1台）- 做莊家者，無論胡牌或放槍都多算一台
  if (scenario.isDealer) {
    fans.push({ name: '莊家', fan: 1 });
  }

  // 連莊/拉莊（每連莊1台）
  if (scenario.isDealer && scenario.dealerStreak > 0) {
    fans.push({ name: `連莊`, fan: scenario.dealerStreak });
  }

  // 海底撈月：摸牌牆最後一張牌自摸（1台）
  // 河底撈魚：胡別人丟出的最後一張牌（1台）
  if (scenario.isHaidi) {
    const name = scenario.isSelfDraw ? '海底撈月' : '河底撈魚';
    fans.push({ name, fan: 1 });
  }

  // 槓上開花（1台）
  if (scenario.isGangShangKaiHua) {
    fans.push({ name: '槓上開花', fan: 1 });
  }

  // 搶槓（1台）
  if (scenario.isQiangGangHu) {
    fans.push({ name: '搶槓', fan: 1 });
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
