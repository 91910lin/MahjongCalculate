import { describe, it, expect } from 'vitest'
import { checkWinning, isThirteenOrphans, countConcealedTriplets, isMenQing } from './winningDetector'
import { Meld, WinningDecomposition } from '../types/mahjong'

describe('winningDetector', () => {
  describe('checkWinning', () => {
    it('應該檢測簡單的胡牌（三順子兩刻子）', () => {
      // 111萬 123筒 456筒 789筒 111條 9條 + 9條（胡牌）
      // 16張暗牌 + 1張胡張 = 17張 = 5面子 + 1對子
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3 (刻子)
      counts[9] = 1  // 1筒x1
      counts[10] = 1 // 2筒x1
      counts[11] = 1 // 3筒x1 (順子)
      counts[12] = 1 // 4筒x1
      counts[13] = 1 // 5筒x1
      counts[14] = 1 // 6筒x1 (順子)
      counts[15] = 1 // 7筒x1
      counts[16] = 1 // 8筒x1
      counts[17] = 1 // 9筒x1 (順子)
      counts[18] = 3 // 1條x3 (刻子)
      counts[26] = 1 // 9條x1 (等對子)

      const result = checkWinning(counts, [], 26) // 胡9條
      expect(result).not.toBeNull()
      expect(result?.melds.length).toBe(5)
    })

    it('應該檢測碰碰胡', () => {
      // 111萬 444萬 777萬 111筒 444筒 7筒 + 7筒（胡牌成對子）
      // 使用不連續數字，避免被誤判為順子
      // 16張暗牌 + 1張胡張 = 17張 = 5刻子 + 1對子
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3 (刻子)
      counts[3] = 3  // 4萬x3 (刻子)
      counts[6] = 3  // 7萬x3 (刻子)
      counts[9] = 3  // 1筒x3 (刻子)
      counts[12] = 3 // 4筒x3 (刻子)
      counts[15] = 1 // 7筒x1 (等對子)

      const result = checkWinning(counts, [], 15) // 胡7筒
      expect(result).not.toBeNull()
      expect(result?.melds.every(m => m.type === 'KE')).toBe(true)
    })

    it('應該檢測七對子', () => {
      // 112233445566 + 7
      const counts = new Array(34).fill(0)
      counts[0] = 2 // 1萬x2
      counts[1] = 2 // 2萬x2
      counts[2] = 2 // 3萬x2
      counts[3] = 2 // 4萬x2
      counts[4] = 2 // 5萬x2
      counts[5] = 2 // 6萬x2
      counts[6] = 1 // 7萬x1

      const result = checkWinning(counts, [], 6) // 胡7萬
      expect(result).not.toBeNull()
    })

    it('應該支援副露（碰）', () => {
      // 暗牌：123萬 456萬 789萬 111筒 11條 (13張)
      // 副露：222筒（碰3張）
      // 總計 13 + 3 = 16張，胡1條變17張（形成對子）
      const counts = new Array(34).fill(0)
      counts[0] = 1  // 1萬
      counts[1] = 1  // 2萬
      counts[2] = 1  // 3萬
      counts[3] = 1  // 4萬
      counts[4] = 1  // 5萬
      counts[5] = 1  // 6萬
      counts[6] = 1  // 7萬
      counts[7] = 1  // 8萬
      counts[8] = 1  // 9萬
      counts[9] = 3  // 1筒x3（刻子）
      counts[18] = 1 // 1條x1（等對子）

      const openMelds: Meld[] = [
        { kind: 'PON', tiles: [10, 10, 10] } // 2筒x3（碰）
      ]

      const result = checkWinning(counts, openMelds, 18) // 胡1條
      expect(result).not.toBeNull()
      expect(result?.melds.some(m => m.isOpen)).toBe(true)
    })

    it('無法胡牌應該返回 null', () => {
      // 不成型的牌
      const counts = new Array(34).fill(0)
      counts[0] = 1
      counts[5] = 2
      counts[10] = 3
      counts[20] = 4
      counts[27] = 3

      const result = checkWinning(counts, [], 28)
      expect(result).toBeNull()
    })
  })

  describe('isThirteenOrphans', () => {
    it('應該檢測國士無雙', () => {
      // 1萬9萬1筒9筒1條9條東南西北中發白 + 1萬
      const counts = new Array(34).fill(0)
      const terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]
      terminals.forEach(t => counts[t] = 1)
      counts[0] = 2 // 1萬作為對子

      expect(isThirteenOrphans(counts)).toBe(true)
    })

    it('缺少么九應該不是國士無雙', () => {
      const counts = new Array(34).fill(0)
      const terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32]
      terminals.forEach(t => counts[t] = 1)
      counts[0] = 2

      expect(isThirteenOrphans(counts)).toBe(false)
    })
  })

  describe('countConcealedTriplets', () => {
    it('應該正確計算暗刻數量', () => {
      const decomposition: WinningDecomposition = {
        pair: [0, 0],
        melds: [
          { type: 'KE' as const, tiles: [1, 1, 1], isOpen: false },
          { type: 'KE' as const, tiles: [2, 2, 2], isOpen: false },
          { type: 'KE' as const, tiles: [3, 3, 3], isOpen: true },
          { type: 'SHUN' as const, tiles: [4, 5, 6], isOpen: false },
          { type: 'KE' as const, tiles: [7, 7, 7], isOpen: false }
        ]
      }

      expect(countConcealedTriplets(decomposition)).toBe(3)
    })
  })

  describe('isMenQing', () => {
    it('無副露應該是門清', () => {
      expect(isMenQing([])).toBe(true)
    })

    it('有碰應該不是門清', () => {
      const melds: Meld[] = [
        { kind: 'PON', tiles: [0, 0, 0] }
      ]
      expect(isMenQing(melds)).toBe(false)
    })

    it('只有暗槓應該仍是門清', () => {
      const melds: Meld[] = [
        { kind: 'AN_KONG', tiles: [0, 0, 0, 0] }
      ]
      expect(isMenQing(melds)).toBe(true)
    })
  })
})
