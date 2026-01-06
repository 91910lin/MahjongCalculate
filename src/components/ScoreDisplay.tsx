import { ScoreResult } from '../types/mahjong'
import { getTileName } from '../utils/tileUtils'
import './ScoreDisplay.css'

interface ScoreDisplayProps {
  result: ScoreResult
}

function ScoreDisplay({ result }: ScoreDisplayProps) {
  if (!result.isWinning) {
    return (
      <div className="score-display">
        <div className="not-winning">
          <h3>❌ 無法胡牌</h3>
          <p>這個牌型無法組成胡牌</p>
        </div>
      </div>
    )
  }

  return (
    <div className="score-display">
      <div className="total-score">
        <h3>總台數</h3>
        <div className="score-value">{result.totalFan} 台</div>
        <div className="points">總分：{result.totalPoints} 分</div>
      </div>

      {result.fans.length > 0 && (
        <div className="fans-list">
          <h4>台型明細</h4>
          <table className="fans-table">
            <thead>
              <tr>
                <th>台型</th>
                <th>台數</th>
              </tr>
            </thead>
            <tbody>
              {result.fans.map((fan, index) => (
                <tr key={index}>
                  <td className="fan-name">{fan.name}</td>
                  <td className="fan-value">{fan.fan} 台</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.decomposition && (
        <div className="decomposition">
          <h4>胡牌拆解</h4>
          <div className="decomposition-content">
            <div className="decomposition-item">
              <span className="label">將（對子）：</span>
              <span className="tiles">
                {result.decomposition.pair.map((tile, i) => (
                  <span key={i} className="tile">
                    {getTileName(tile)}
                  </span>
                ))}
              </span>
            </div>

            {result.decomposition.melds.map((meld, index) => (
              <div key={index} className="decomposition-item">
                <span className="label">
                  {meld.type === 'SHUN' && '順子'}
                  {meld.type === 'KE' && '刻子'}
                  {meld.type === 'GANG' && '槓'}
                  {meld.isOpen ? '（明）' : '（暗）'}：
                </span>
                <span className="tiles">
                  {meld.tiles.map((tile, i) => (
                    <span key={i} className="tile">
                      {getTileName(tile)}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScoreDisplay
