import { useState, useEffect } from 'react'
import { Question, ScoreResult } from '../types/mahjong'
import { RulesConfig, DEFAULT_RULES_CONFIG } from '../types/rulesConfig'
import { generateQuestion, Difficulty } from '../core/questionGenerator'
import { calculateScore } from '../core/scoring'
import TileDisplay from './TileDisplay'
import ScoreDisplay from './ScoreDisplay'
import AnswerInput from './AnswerInput'
import RulesConfigPanel from './RulesConfigPanel'
import './PracticeMode.css'

const STORAGE_KEY = 'mahjong-rules-config'

function loadRulesConfig(): RulesConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 合併預設值，確保新增的欄位有預設值
      return { ...DEFAULT_RULES_CONFIG, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_RULES_CONFIG }
}

function PracticeMode() {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY)
  const [rulesConfig, setRulesConfig] = useState<RulesConfig>(loadRulesConfig)
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [statistics, setStatistics] = useState({
    total: 0,
    correct: 0,
    wrong: 0
  })

  // 初始化第一題
  useEffect(() => {
    generateNewQuestion()
  }, [])

  // 持久化規則設定
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rulesConfig))
  }, [rulesConfig])

  const generateNewQuestion = () => {
    const newQuestion = generateQuestion(difficulty)
    setQuestion(newQuestion)
    setUserAnswer(null)
    setShowAnswer(false)
    setScoreResult(null)
  }

  const handleRulesChange = (newConfig: RulesConfig) => {
    setRulesConfig(newConfig)
    // 切換規則時自動出新題
    setUserAnswer(null)
    setShowAnswer(false)
    setScoreResult(null)
    const newQuestion = generateQuestion(difficulty)
    setQuestion(newQuestion)
  }

  const handleSubmit = () => {
    if (!question || userAnswer === null) return

    // 計算正確答案
    const result = calculateScore(
      question.concealedCounts,
      question.openMelds,
      question.winningTile,
      question.scenario,
      rulesConfig
    )

    setScoreResult(result)
    setShowAnswer(true)

    // 更新統計
    const isCorrect = userAnswer === result.totalFan
    setStatistics(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1)
    }))
  }

  const handleNext = () => {
    generateNewQuestion()
  }

  const isCorrect = scoreResult && userAnswer === scoreResult.totalFan

  return (
    <div className="practice-mode">
      <div className="controls">
        <div className="difficulty-selector">
          <label>難度：</label>
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as Difficulty)
              generateNewQuestion()
            }}
          >
            <option value={Difficulty.EASY}>簡單</option>
            <option value={Difficulty.MEDIUM}>中等</option>
            <option value={Difficulty.HARD}>困難</option>
          </select>
        </div>

        <div className="statistics">
          <span>總題數: {statistics.total}</span>
          <span className="correct">正確: {statistics.correct}</span>
          <span className="wrong">錯誤: {statistics.wrong}</span>
          <span>
            正確率: {statistics.total > 0
              ? Math.round((statistics.correct / statistics.total) * 100)
              : 0}%
          </span>
        </div>
      </div>

      <RulesConfigPanel config={rulesConfig} onChange={handleRulesChange} />

      {question && (
        <div className="question-container">
          <TileDisplay question={question} />

          {!showAnswer && (
            <AnswerInput
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={handleSubmit}
            />
          )}

          {showAnswer && scoreResult && (
            <>
              <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
                {isCorrect ? '✓ 正確！' : '✗ 錯誤'}
                {!isCorrect && userAnswer !== null && (
                  <span>你的答案：{userAnswer}台</span>
                )}
              </div>

              <ScoreDisplay result={scoreResult} />

              <button className="next-button" onClick={handleNext}>
                下一題
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PracticeMode
