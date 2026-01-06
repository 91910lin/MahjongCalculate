import { Tile, Meld, MeldInHand, WinningDecomposition } from '../types/mahjong';
import { cloneCounts, getTotalCount } from '../utils/tileUtils';

/**
 * 檢查是否胡牌（包含副露支援）
 * @param concealedCounts 暗牌陣列（16 - openTiles張數）
 * @param openMelds 副露
 * @param winningTile 胡張
 * @returns 胡牌拆解結果，若無法胡牌則返回 null
 */
export function checkWinning(
  concealedCounts: number[],
  openMelds: Meld[],
  winningTile: Tile
): WinningDecomposition | null {
  // 1. 將副露轉換為面子
  const openMeldsInHand = convertOpenMeldsToMeldInHand(openMelds);

  // 2. 建立完整的暗牌（含胡張）
  const fullConcealedCounts = cloneCounts(concealedCounts);
  fullConcealedCounts[winningTile]++;

  // 3. 檢查是否為七對子
  const sevenPairs = checkSevenPairs(fullConcealedCounts, openMelds);
  if (sevenPairs) return sevenPairs;

  // 4. 一般胡牌判定：剩餘暗牌需要形成 (剩餘面子數 + 1對)
  const remainingMeldsNeeded = 5 - openMeldsInHand.length;

  // 遞迴搜尋可能的拆解
  const result = searchWinningDecomposition(fullConcealedCounts, remainingMeldsNeeded);

  if (result) {
    return {
      pair: result.pair,
      melds: [...openMeldsInHand, ...result.melds]
    };
  }

  return null;
}

/**
 * 將副露轉換為面子
 */
function convertOpenMeldsToMeldInHand(openMelds: Meld[]): MeldInHand[] {
  return openMelds.map(meld => {
    switch (meld.kind) {
      case 'CHI':
        return { type: 'SHUN', tiles: meld.tiles, isOpen: true };
      case 'PON':
        return { type: 'KE', tiles: meld.tiles, isOpen: true };
      case 'MING_KONG':
        return { type: 'GANG', tiles: meld.tiles, isOpen: true };
      case 'AN_KONG':
        // 暗槓仍標記為暗的（但在副露中）
        return { type: 'GANG', tiles: meld.tiles, isOpen: false };
    }
  });
}

/**
 * 檢查七對子（必須無副露）
 */
function checkSevenPairs(counts: number[], openMelds: Meld[]): WinningDecomposition | null {
  if (openMelds.length > 0) return null; // 七對子不能有副露
  if (getTotalCount(counts) !== 14) return null;

  const pairs: [Tile, Tile][] = [];
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 2) {
      pairs.push([i, i]);
    } else if (counts[i] !== 0) {
      return null; // 有不是對子的牌
    }
  }

  if (pairs.length === 7) {
    // 七對子視為特殊形式：將第一對當作對子，其他6對當作刻子（用於計分）
    return {
      pair: pairs[0],
      melds: pairs.slice(1).map(pair => ({
        type: 'KE' as const,
        tiles: [pair[0], pair[0], pair[0]],
        isOpen: false
      }))
    };
  }

  return null;
}

/**
 * 遞迴搜尋胡牌拆解
 * @param counts 剩餘暗牌
 * @param meldsNeeded 需要的面子數
 * @returns 拆解結果
 */
function searchWinningDecomposition(
  counts: number[],
  meldsNeeded: number
): { pair: [Tile, Tile]; melds: MeldInHand[] } | null {
  const totalTiles = getTotalCount(counts);

  // 剩餘牌數應該等於 meldsNeeded * 3 + 2（對子）
  if (totalTiles !== meldsNeeded * 3 + 2) return null;

  // 嘗試所有可能的對子
  for (let pairTile = 0; pairTile < 34; pairTile++) {
    if (counts[pairTile] < 2) continue;

    const tempCounts = cloneCounts(counts);
    tempCounts[pairTile] -= 2;

    const melds = extractMelds(tempCounts, meldsNeeded);
    if (melds && melds.length === meldsNeeded) {
      return {
        pair: [pairTile, pairTile],
        melds
      };
    }
  }

  return null;
}

/**
 * 從暗牌中提取面子（使用遞迴回溯）
 * @param counts 牌數陣列
 * @param targetCount 目標面子數
 * @returns 面子陣列
 */
function extractMelds(counts: number[], targetCount: number): MeldInHand[] | null {
  if (targetCount === 0) {
    // 檢查是否還有剩餘牌
    return getTotalCount(counts) === 0 ? [] : null;
  }

  const tempCounts = cloneCounts(counts);

  // 找第一張有牌的位置
  let firstTile = -1;
  for (let i = 0; i < 34; i++) {
    if (tempCounts[i] > 0) {
      firstTile = i;
      break;
    }
  }

  if (firstTile === -1) return null;

  // 嘗試將第一張牌組成刻子
  if (tempCounts[firstTile] >= 3) {
    tempCounts[firstTile] -= 3;
    const remaining = extractMelds(tempCounts, targetCount - 1);
    if (remaining !== null) {
      return [
        { type: 'KE', tiles: [firstTile, firstTile, firstTile], isOpen: false },
        ...remaining
      ];
    }
    tempCounts[firstTile] += 3;
  }

  // 嘗試將第一張牌組成順子（只有數牌可以）
  if (firstTile < 27) {
    const rank = firstTile % 9;

    if (rank <= 6) {
      const t2 = firstTile + 1;
      const t3 = firstTile + 2;

      if (tempCounts[t2] > 0 && tempCounts[t3] > 0) {
        tempCounts[firstTile]--;
        tempCounts[t2]--;
        tempCounts[t3]--;

        const remaining = extractMelds(tempCounts, targetCount - 1);
        if (remaining !== null) {
          return [
            { type: 'SHUN', tiles: [firstTile, t2, t3], isOpen: false },
            ...remaining
          ];
        }

        tempCounts[firstTile]++;
        tempCounts[t2]++;
        tempCounts[t3]++;
      }
    }
  }

  return null;
}

/**
 * 判斷是否為國士無雙（13么九）
 */
export function isThirteenOrphans(counts: number[]): boolean {
  // 必須是：1萬、9萬、1筒、9筒、1條、9條、東南西北中發白 各至少1張
  // 且其中一種有2張（作為對子）
  const terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

  let pairCount = 0;
  for (const tile of terminals) {
    if (counts[tile] === 0) return false;
    if (counts[tile] === 2) pairCount++;
    if (counts[tile] > 2) return false;
  }

  // 檢查是否只有這13種牌
  for (let i = 0; i < 34; i++) {
    if (!terminals.includes(i) && counts[i] > 0) return false;
  }

  return pairCount === 1;
}

/**
 * 計算暗刻數量
 */
export function countConcealedTriplets(decomposition: WinningDecomposition): number {
  return decomposition.melds.filter(
    m => (m.type === 'KE' || m.type === 'GANG') && !m.isOpen
  ).length;
}

/**
 * 計算槓的數量
 */
export function countKongs(decomposition: WinningDecomposition): number {
  return decomposition.melds.filter(m => m.type === 'GANG').length;
}

/**
 * 判斷是否門清（無副露，暗槓允許）
 */
export function isMenQing(openMelds: Meld[]): boolean {
  // 暗槓不算破門清
  return openMelds.every(m => m.kind === 'AN_KONG');
}
