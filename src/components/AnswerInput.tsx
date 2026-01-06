import { useState } from 'react'
import './AnswerInput.css'

interface AnswerInputProps {
  value: number | null
  onChange: (value: number | null) => void
  onSubmit: () => void
}

function AnswerInput({ value, onChange, onSubmit }: AnswerInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= 0) {
      onChange(num)
    } else {
      onChange(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value !== null) {
      onSubmit()
    }
  }

  return (
    <div className="answer-input">
      <h3>請計算總台數</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="number"
            min="0"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="輸入台數..."
            autoFocus
          />
          <span className="unit">台</span>
        </div>
        <button
          type="submit"
          disabled={value === null}
          className="submit-button"
        >
          送出答案
        </button>
      </form>
      <p className="hint">提示：請計算所有符合的台型總和</p>
    </div>
  )
}

export default AnswerInput
