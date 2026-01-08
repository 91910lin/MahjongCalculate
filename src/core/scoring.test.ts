import { describe, it, expect } from 'vitest'
import { calculateScore, calculateTingSet } from './scoring'
import { Wind } from '../types/mahjong'

describe('scoring', () => {
  describe('calculateScore', () => {
    it('應該計算門清自摸', () => {
      // 111萬 123筒 456筒 789筒 111條 9條 + 9條（16張）
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3
      counts[9] = 1  // 1筒
      counts[10] = 1 // 2筒
      counts[11] = 1 // 3筒
      counts[12] = 1 // 4筒
      counts[13] = 1 // 5筒
      counts[14] = 1 // 6筒
      counts[15] = 1 // 7筒
      counts[16] = 1 // 8筒
      counts[17] = 1 // 9筒
      counts[18] = 3 // 1條x3
      counts[26] = 1 // 9條

      const scenario = {
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

      const result = calculateScore(counts, [], 26, scenario)
      expect(result.isWinning).toBe(true)
      // 依據中華民國麻將競技協會規則，門清、不求、自摸分開計算
      expect(result.fans.some(f => f.name === '門清')).toBe(true)
      expect(result.fans.some(f => f.name === '不求')).toBe(true)
      expect(result.fans.some(f => f.name === '自摸')).toBe(true)
    })

    it('應該計算碰碰胡', () => {
      // 111萬 444萬 777萬 111筒 444筒 7筒 + 7筒（16張）
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3
      counts[3] = 3  // 4萬x3
      counts[6] = 3  // 7萬x3
      counts[9] = 3  // 1筒x3
      counts[12] = 3 // 4筒x3
      counts[15] = 1 // 7筒x1

      const scenario = {
        isSelfDraw: false,
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

      const result = calculateScore(counts, [], 15, scenario)
      expect(result.isWinning).toBe(true)
      expect(result.fans.some(f => f.name === '碰碰胡')).toBe(true)
    })

    it('應該計算清一色', () => {
      // 全部萬子：111萬 222萬 333萬 444萬 555萬 6萬 + 6萬（16張）
      const counts = new Array(34).fill(0)
      counts[0] = 3
      counts[1] = 3
      counts[2] = 3
      counts[3] = 3
      counts[4] = 3
      counts[5] = 1

      const scenario = {
        isSelfDraw: false,
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

      const result = calculateScore(counts, [], 5, scenario)
      expect(result.isWinning).toBe(true)
      expect(result.fans.some(f => f.name === '清一色')).toBe(true)
    })

    it('應該計算花牌（本花）', () => {
      // 111萬 222萬 333萬 444萬 555萬 6萬 + 6萬（16張）
      const counts = new Array(34).fill(0)
      counts[0] = 3
      counts[1] = 3
      counts[2] = 3
      counts[3] = 3
      counts[4] = 3
      counts[5] = 1

      const scenario = {
        isSelfDraw: false,
        isDealer: false,
        dealerStreak: 0,
        roundWind: Wind.EAST,
        seatWind: Wind.EAST, // 東家
        isHaidi: false,
        isGangShangKaiHua: false,
        isQiangGangHu: false,
        isTianHu: false,
        isDiHu: false,
        flowers: [0, 4] // 春（對應東）、梅（對應東）
      }

      const result = calculateScore(counts, [], 5, scenario)
      expect(result.isWinning).toBe(true)
      // 依據中華民國麻將競技協會規則，花牌台數
      expect(result.fans.some(f => f.name === '花牌' && f.fan === 2)).toBe(true)
    })

    it('應該計算三暗刻', () => {
      // 111萬 222萬 333萬 456萬 789萬 1萬 + 1萬（16張）
      const counts = new Array(34).fill(0)
      counts[0] = 1  // 1萬x1 (等對子)
      counts[1] = 3  // 2萬x3 (暗刻)
      counts[2] = 3  // 3萬x3 (暗刻)
      counts[3] = 1  // 4萬
      counts[4] = 1  // 5萬
      counts[5] = 1  // 6萬 (順子)
      counts[6] = 1  // 7萬
      counts[7] = 1  // 8萬
      counts[8] = 1  // 9萬 (順子)
      counts[9] = 3  // 1筒x3 (暗刻)

      const scenario = {
        isSelfDraw: false,
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

      const result = calculateScore(counts, [], 0, scenario)
      expect(result.isWinning).toBe(true)
      // 應該有三暗刻
      const sanAnKe = result.fans.find(f => f.name === '三暗刻')
      expect(sanAnKe).toBeDefined()
      expect(sanAnKe?.fan).toBe(2)
    })
  })

  describe('calculateTingSet', () => {
    it('應該計算聽牌集合', () => {
      // 111萬 222萬 333萬 444萬 555萬 6萬（16張，聽6萬）
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3
      counts[1] = 3  // 2萬x3
      counts[2] = 3  // 3萬x3
      counts[3] = 3  // 4萬x3
      counts[4] = 3  // 5萬x3
      counts[5] = 1  // 6萬x1（等對子）

      const tingSet = calculateTingSet(counts, [])
      expect(tingSet.size).toBeGreaterThan(0)
      expect(tingSet.has(5)).toBe(true) // 應該聽6萬
    })

    it('獨聽應該只有一張牌', () => {
      // 111萬 444萬 777萬 111筒 444筒 7筒（16張，單吊7筒）
      const counts = new Array(34).fill(0)
      counts[0] = 3  // 1萬x3
      counts[3] = 3  // 4萬x3
      counts[6] = 3  // 7萬x3
      counts[9] = 3  // 1筒x3
      counts[12] = 3 // 4筒x3
      counts[15] = 1 // 7筒x1（單吊）

      const tingSet = calculateTingSet(counts, [])
      expect(tingSet.size).toBe(1)
      expect(tingSet.has(15)).toBe(true) // 聽7筒
    })
  })
})
