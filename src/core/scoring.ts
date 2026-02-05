import {
  Tile,
  Meld,
  WinningDecomposition,
  Scenario,
  FanResult,
  ScoreResult,
  Wind
} from '../types/mahjong';
import { RulesConfig, DEFAULT_RULES_CONFIG } from '../types/rulesConfig';
import {
  isHonor,
  isWind,
  isDragon,
  getSuit,
  countsToTiles,
  getTotalCount
} from '../utils/tileUtils';
import { checkWinning, isThirteenOrphans, isMenQing } from './winningDetector';

/**
 * 計算胡牌總分
 */
export function calculateScore(
  concealedCounts: number[],
  openMelds: Meld[],
  winningTile: Tile,
  scenario: Scenario,
  rulesConfig: RulesConfig = DEFAULT_RULES_CONFIG
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
  checkSpecialPatterns(fans, concealedCounts, openMelds, decomposition, winningTile, scenario, rulesConfig);

  // 基本台型
  checkBasicPatterns(fans, decomposition, openMelds, scenario, rulesConfig);

  // 獨聽判定
  if (rulesConfig.duTing) {
    addDuTingIfApplicable(fans, concealedCounts, openMelds);
  }

  // 花牌
  checkFlowers(fans, scenario, rulesConfig);

  // 場況台
  checkSituationalFans(fans, scenario, rulesConfig);

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
  scenario: Scenario,
  rulesConfig: RulesConfig
): void {
  // 收集所有牌（暗牌 + 副露 + 胡張）
  const allTiles = [
    ...countsToTiles(concealedCounts),
    winningTile,
    ...openMelds.flatMap(m => m.tiles)
  ];

  // === 十六台 ===

  // 天胡：莊家取完牌後已胡牌，不得加計門清、不求、自摸、天地聽
  if (rulesConfig.tianHu && scenario.isTianHu) {
    fans.push({ name: '天胡', fan: 16 });
  }

  // 地胡：閒家第一巡第一次摸牌即自摸，不得加計自摸、門清、不求、天地聽
  if (rulesConfig.diHu && scenario.isDiHu) {
    fans.push({ name: '地胡', fan: 16 });
  }

  // 大四喜：有風牌4種刻子，不得加計門風、圈風台
  const windKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isWind(m.tiles[0])
  );
  if (rulesConfig.daSiXi && windKe.length === 4) {
    fans.push({ name: '大四喜', fan: 16 });
  }

  // === 八台 ===

  // 國士無雙（13么九）
  if (rulesConfig.guoShiWuShuang && openMelds.length === 0 && isThirteenOrphans(concealedCounts.map((c, i) => i === winningTile ? c + 1 : c))) {
    fans.push({ name: '國士無雙', fan: 8 });
    return; // 國士無雙排除其他判定
  }

  // 大三元（中發白都是刻子）
  const dragonKe = decomposition.melds.filter(m =>
    (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
  );
  if (rulesConfig.daSanYuan && dragonKe.length === 3) {
    fans.push({ name: '大三元', fan: 8 });
  }

  // 小四喜（3風刻+1風將）
  if (rulesConfig.xiaoSiXi && windKe.length === 3 && isWind(decomposition.pair[0])) {
    fans.push({ name: '小四喜', fan: 8 });
  }

  // 字一色（全部字牌）- 圈風、門風、三元牌可複合計算
  if (rulesConfig.ziYiSe && allTiles.every(t => isHonor(t))) {
    fans.push({ name: '字一色', fan: 8 });
  }

  // 清一色（全部同花色數牌）
  if (rulesConfig.qingYiSe) {
    const suit = getSuit(allTiles.find(t => !isHonor(t)) || -1);
    if (suit >= 0 && suit < 3 && allTiles.every(t => getSuit(t) === suit)) {
      fans.push({ name: '清一色', fan: 8 });
    }
  }

  // 計算暗刻數（放槍時，胡張組成的刻子不算暗刻）
  const concealedKe = countActualConcealedTriplets(decomposition, winningTile, scenario.isSelfDraw);

  // 五暗刻
  if (rulesConfig.wuAnKe && concealedKe === 5) {
    fans.push({ name: '五暗刻', fan: 8 });
  }

  // 八仙過海在花牌中檢查

  // === 五台 ===

  // 四暗刻
  if (rulesConfig.siAnKe && concealedKe === 4 && !fans.some(f => f.name === '五暗刻')) {
    fans.push({ name: '四暗刻', fan: 5 });
  }

  // === 四台 ===

  // 混一色（只有一種數牌花色+字牌）
  if (rulesConfig.hunYiSe && fans.every(f => f.name !== '清一色' && f.name !== '字一色')) {
    const suits = new Set(allTiles.filter(t => !isHonor(t)).map(t => getSuit(t)));
    if (suits.size === 1 && allTiles.some(t => isHonor(t))) {
      fans.push({ name: '混一色', fan: 4 });
    }
  }

  // 碰碰胡（全刻子）
  if (rulesConfig.pengPengHu && decomposition.melds.every(m => m.type === 'KE' || m.type === 'GANG')) {
    fans.push({ name: '碰碰胡', fan: 4 });
  }

  // 小三元（中發白其中二組刻子一組對子）
  if (rulesConfig.xiaoSanYuan && dragonKe.length === 2 && isDragon(decomposition.pair[0])) {
    fans.push({ name: '小三元', fan: 4 });
  }

  // 七對子
  if (rulesConfig.qiDuiZi && openMelds.length === 0 && getTotalCount(concealedCounts) + 1 === 14) {
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
  if (rulesConfig.pingHu && isMenQing(openMelds) &&
    decomposition.melds.every(m => m.type === 'SHUN') &&
    !isHonor(decomposition.pair[0]) &&
    !scenario.isSelfDraw &&  // 必須胡他人牌
    scenario.flowers.length === 0) {  // 無花牌
    fans.push({ name: '平胡', fan: 2 });
  }

  // 全求人（4副露+單吊，胡他人牌）
  if (rulesConfig.quanQiuRen && openMelds.length === 4 && openMelds.every(m => m.kind !== 'AN_KONG') && !scenario.isSelfDraw) {
    const concealedTilesCount = getTotalCount(concealedCounts);
    if (concealedTilesCount === 1) {
      fans.push({ name: '全求人', fan: 2 });
    }
  }

  // 三暗刻
  if (rulesConfig.sanAnKe && concealedKe === 3 && !fans.some(f => f.name === '四暗刻' || f.name === '五暗刻')) {
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
  scenario: Scenario,
  rulesConfig: RulesConfig
): void {
  const hasTianHu = fans.some(f => f.name === '天胡');
  const hasDiHu = fans.some(f => f.name === '地胡');
  const hasDaSiXi = fans.some(f => f.name === '大四喜');

  // 門清：沒有吃牌、碰牌、明槓（1台）
  // 天胡、地胡不得加計門清
  if (rulesConfig.menQing && isMenQing(openMelds) && !hasTianHu && !hasDiHu) {
    fans.push({ name: '門清', fan: 1 });
  }

  // 不求：完全沒吃碰且自摸（1台）
  // 天胡、地胡不得加計不求
  if (rulesConfig.buQiu && isMenQing(openMelds) && scenario.isSelfDraw && !hasTianHu && !hasDiHu) {
    fans.push({ name: '不求', fan: 1 });
  }

  // 三元牌刻子（中、發、白各1台）
  if (rulesConfig.sanYuanPai) {
    const dragonKe = decomposition.melds.filter(m =>
      (m.type === 'KE' || m.type === 'GANG') && isDragon(m.tiles[0])
    );
    dragonKe.forEach(m => {
      const dragonNames = ['中', '發', '白'];
      const dragonName = dragonNames[m.tiles[0] - 31];
      fans.push({ name: dragonName, fan: 1 });
    });
  }

  // 風牌刻子
  if (!hasDaSiXi) {
    const windKe = decomposition.melds.filter(m =>
      (m.type === 'KE' || m.type === 'GANG') && isWind(m.tiles[0])
    );

    if (rulesConfig.jianHuaJianZi) {
      // 見花見字模式：每個風牌刻子 = 1 台
      windKe.forEach(() => {
        fans.push({ name: '風牌刻', fan: 1 });
      });
    } else {
      // 標準模式：只有匹配圈風/門風才算台
      windKe.forEach(m => {
        const tile = m.tiles[0];
        if (rulesConfig.quanFeng && tile === scenario.roundWind) {
          fans.push({ name: '圈風', fan: 1 });
        }
        if (rulesConfig.menFeng && tile === scenario.seatWind) {
          fans.push({ name: '門風', fan: 1 });
        }
      });
    }
  }
}

/**
 * 檢查花牌
 * 依據中華民國麻將競技協會規則
 */
function checkFlowers(fans: FanResult[], scenario: Scenario, rulesConfig: RulesConfig): void {
  // 八仙過海：8張花牌（8台）
  if (rulesConfig.baXianGuoHai && scenario.flowers.length === 8) {
    fans.push({ name: '八仙過海', fan: 8 });
    return;
  }

  // 花槓（梅蘭竹菊或春夏秋冬任一組完整）（2台）
  if (rulesConfig.huaGang) {
    const hasChunXiaQiuDong = [0, 1, 2, 3].every(f => scenario.flowers.includes(f));
    const hasMeiLanZhuJu = [4, 5, 6, 7].every(f => scenario.flowers.includes(f));

    if (hasChunXiaQiuDong) {
      fans.push({ name: '花槓（春夏秋冬）', fan: 2 });
    }
    if (hasMeiLanZhuJu) {
      fans.push({ name: '花槓（梅蘭竹菊）', fan: 2 });
    }
  }

  // 花牌台數
  if (rulesConfig.huaPai) {
    if (rulesConfig.jianHuaJianZi) {
      // 見花見字模式：每朵花 = 1 台
      if (scenario.flowers.length > 0) {
        fans.push({ name: '花牌', fan: scenario.flowers.length });
      }
    } else {
      // 標準模式：只有正花（對應座位）才算台
      const seatIndex = scenario.seatWind - Wind.EAST;
      let flowerFan = 0;

      scenario.flowers.forEach(flower => {
        if (flower < 4 && flower === seatIndex) {
          flowerFan++;
        } else if (flower >= 4 && (flower - 4) === seatIndex) {
          flowerFan++;
        }
      });

      if (flowerFan > 0) {
        fans.push({ name: '花牌', fan: flowerFan });
      }
    }
  }
}

/**
 * 檢查場況台
 * 依據中華民國麻將競技協會規則
 */
function checkSituationalFans(
  fans: FanResult[],
  scenario: Scenario,
  rulesConfig: RulesConfig
): void {
  const hasTianHu = fans.some(f => f.name === '天胡');
  const hasDiHu = fans.some(f => f.name === '地胡');

  // 自摸（1台）- 天胡、地胡不得加計自摸
  if (rulesConfig.ziMo && scenario.isSelfDraw && !hasTianHu && !hasDiHu) {
    fans.push({ name: '自摸', fan: 1 });
  }

  // 莊家（1台）
  if (rulesConfig.zhuangJia && scenario.isDealer) {
    fans.push({ name: '莊家', fan: 1 });
  }

  // 連莊/拉莊：連N莊 = 連莊N台 + 拉莊N台 = 2N台
  if (scenario.isDealer && scenario.dealerStreak > 0) {
    if (rulesConfig.lianZhuang) {
      fans.push({ name: '連莊', fan: scenario.dealerStreak });
    }
    if (rulesConfig.laZhuang) {
      fans.push({ name: '拉莊', fan: scenario.dealerStreak });
    }
  }

  // 海底撈月/河底撈魚（1台）
  if (rulesConfig.haiDi && scenario.isHaidi) {
    const name = scenario.isSelfDraw ? '海底撈月' : '河底撈魚';
    fans.push({ name, fan: 1 });
  }

  // 槓上開花（1台）
  if (rulesConfig.gangShangKaiHua && scenario.isGangShangKaiHua) {
    fans.push({ name: '槓上開花', fan: 1 });
  }

  // 搶槓（1台）
  if (rulesConfig.qiangGang && scenario.isQiangGangHu) {
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
  // 避免重複計算
  if (fans.some(f => f.name === '獨聽')) return;

  const tingSet = calculateTingSet(concealedCounts, openMelds);
  if (tingSet.size === 1) {
    fans.push({ name: '獨聽', fan: 1 });
  }
}

/**
 * 計算實際暗刻數量
 * 放槍時，胡張組成的刻子不算暗刻
 */
function countActualConcealedTriplets(
  decomposition: WinningDecomposition,
  winningTile: Tile,
  isSelfDraw: boolean
): number {
  let count = 0;
  let winningTileKeCounted = false;

  for (const meld of decomposition.melds) {
    if ((meld.type === 'KE' || meld.type === 'GANG') && !meld.isOpen) {
      // 如果是放槍，且這個刻子包含胡張，則不算暗刻（只扣一次）
      if (!isSelfDraw && !winningTileKeCounted && meld.tiles[0] === winningTile) {
        winningTileKeCounted = true;
      } else {
        count++;
      }
    }
  }

  return count;
}
