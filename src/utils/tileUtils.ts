import { Tile } from '../types/mahjong';

/**
 * 麻將牌名稱
 */
const TILE_NAMES: string[] = [
  '1萬', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '8萬', '9萬',
  '1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒',
  '1條', '2條', '3條', '4條', '5條', '6條', '7條', '8條', '9條',
  '東', '南', '西', '北',
  '中', '發', '白'
];

/**
 * 麻將牌 Unicode 符號
 * 萬子: 🀇-🀏
 * 筒子: 🀙-🀡
 * 條子: 🀐-🀘
 * 風牌: 🀀🀁🀂🀃
 * 三元牌: 🀄🀅🀆
 */
const TILE_UNICODE: string[] = [
  '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', // 1-9萬
  '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡', // 1-9筒
  '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘', // 1-9條
  '🀀', '🀁', '🀂', '🀃', // 東南西北
  '🀄', '🀅', '🀆'  // 中發白
];

/**
 * 花牌名稱
 */
const FLOWER_NAMES: string[] = ['春', '夏', '秋', '冬', '梅', '蘭', '竹', '菊'];

/**
 * 花牌 Unicode 符號
 */
const FLOWER_UNICODE: string[] = ['🀢', '🀣', '🀤', '🀥', '🀦', '🀧', '🀨', '🀩'];

/**
 * 取得牌的名稱
 */
export function getTileName(tile: Tile): string {
  return TILE_NAMES[tile] || '未知';
}

/**
 * 取得牌的 Unicode 符號
 */
export function getTileUnicode(tile: Tile): string {
  return TILE_UNICODE[tile] || '🀫';
}

/**
 * 取得花牌名稱
 */
export function getFlowerName(flower: number): string {
  return FLOWER_NAMES[flower] || '未知';
}

/**
 * 取得花牌 Unicode 符號
 */
export function getFlowerUnicode(flower: number): string {
  return FLOWER_UNICODE[flower] || '🀫';
}

/**
 * 判斷是否為字牌（風牌或三元牌）
 */
export function isHonor(tile: Tile): boolean {
  return tile >= 27 && tile <= 33;
}

/**
 * 判斷是否為風牌
 */
export function isWind(tile: Tile): boolean {
  return tile >= 27 && tile <= 30;
}

/**
 * 判斷是否為三元牌（中發白）
 */
export function isDragon(tile: Tile): boolean {
  return tile >= 31 && tile <= 33;
}

/**
 * 判斷是否為數牌（萬筒條）
 */
export function isSimple(tile: Tile): boolean {
  return tile >= 0 && tile <= 26;
}

/**
 * 判斷是否為么九牌（1、9、字牌）
 */
export function isTerminal(tile: Tile): boolean {
  if (isHonor(tile)) return true;
  const rank = tile % 9;
  return rank === 0 || rank === 8;
}

/**
 * 判斷是否為中張牌（2-8）
 */
export function isMiddle(tile: Tile): boolean {
  if (isHonor(tile)) return false;
  const rank = tile % 9;
  return rank >= 1 && rank <= 7;
}

/**
 * 取得牌的花色（0=萬, 1=筒, 2=條, 3=字）
 */
export function getSuit(tile: Tile): number {
  if (tile < 9) return 0;  // 萬
  if (tile < 18) return 1; // 筒
  if (tile < 27) return 2; // 條
  return 3;                // 字
}

/**
 * 取得牌的數字（1-9，字牌返回0）
 */
export function getRank(tile: Tile): number {
  if (isHonor(tile)) return 0;
  return (tile % 9) + 1;
}

/**
 * 從牌數陣列轉換為牌列表
 */
export function countsToTiles(counts: number[]): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < counts.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      tiles.push(i);
    }
  }
  return tiles;
}

/**
 * 從牌列表轉換為牌數陣列
 */
export function tilesToCounts(tiles: Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const tile of tiles) {
    counts[tile]++;
  }
  return counts;
}

/**
 * 複製牌數陣列
 */
export function cloneCounts(counts: number[]): number[] {
  return [...counts];
}

/**
 * 計算牌數陣列的總數
 */
export function getTotalCount(counts: number[]): number {
  return counts.reduce((sum, count) => sum + count, 0);
}

/**
 * 判斷兩張牌是否相同
 */
export function isSameTile(a: Tile, b: Tile): boolean {
  return a === b;
}

/**
 * 判斷三張牌是否為順子
 */
export function isSequence(t1: Tile, t2: Tile, t3: Tile): boolean {
  if (isHonor(t1) || isHonor(t2) || isHonor(t3)) return false;
  if (getSuit(t1) !== getSuit(t2) || getSuit(t2) !== getSuit(t3)) return false;

  const tiles = [t1, t2, t3].sort((a, b) => a - b);
  return tiles[1] === tiles[0] + 1 && tiles[2] === tiles[1] + 1;
}

/**
 * 判斷三張牌是否為刻子
 */
export function isTriplet(t1: Tile, t2: Tile, t3: Tile): boolean {
  return t1 === t2 && t2 === t3;
}

/**
 * 判斷兩張牌是否為對子
 */
export function isPair(t1: Tile, t2: Tile): boolean {
  return t1 === t2;
}

/**
 * 格式化牌數陣列為字串（用於除錯）
 */
export function formatCounts(counts: number[]): string {
  const tiles = countsToTiles(counts);
  return tiles.map(t => getTileName(t)).join(' ');
}
