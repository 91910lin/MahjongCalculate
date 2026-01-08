import { useState, useEffect } from 'react'
import { Question, ScoreResult } from '../types/mahjong'
import { generateQuestion, Difficulty } from '../core/questionGenerator'
import { calculateScore } from '../core/scoring'
import TileDisplay from './TileDisplay'
import ScoreDisplay from './ScoreDisplay'
import AnswerInput from './AnswerInput'
import './PracticeMode.css'

function PracticeMode() {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY)
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

  const generateNewQuestion = () => {
    const newQuestion = generateQuestion(difficulty)
    setQuestion(newQuestion)
    setUserAnswer(null)
    setShowAnswer(false)
    setScoreResult(null)
  }

  const handleSubmit = () => {
    if (!question || userAnswer === null) return

    // 計算正確答案（已內建獨聽判定）
    const result = calculateScore(
      question.concealedCounts,
      question.openMelds,
      question.winningTile,
      question.scenario
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
