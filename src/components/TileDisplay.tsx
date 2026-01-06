import { Question } from '../types/mahjong'
import { getTileName, getFlowerName, countsToTiles } from '../utils/tileUtils'
import { MahjongTileSVG } from './MahjongTileSVG'
import './TileDisplay.css'

interface TileDisplayProps {
  question: Question
}

function TileDisplay({ question }: TileDisplayProps) {
  const concealedTiles = countsToTiles(question.concealedCounts)

  const getMeldName = (kind: string) => {
    switch (kind) {
      case 'CHI': return '吃'
      case 'PON': return '碰'
      case 'MING_KONG': return '明槓'
      case 'AN_KONG': return '暗槓'
      default: return ''
    }
  }

  const getWindName = (wind: number) => {
    const winds = ['東', '南', '西', '北']
    return winds[wind - 27]
  }

  return (
    <div className="tile-display">
      <div className="section">
        <h3>暗牌（手牌）</h3>
        <div className="tiles concealed">
          {concealedTiles.map((tile, index) => (
            <MahjongTileSVG key={index} tile={tile} width={50} height={67} />
          ))}
        </div>
        <p className="tile-count">共 {concealedTiles.length} 張</p>
      </div>

      {question.openMelds.length > 0 && (
        <div className="section">
          <h3>副露（已開門）</h3>
          <div className="melds">
            {question.openMelds.map((meld, index) => (
              <div key={index} className="meld">
                <div className="meld-label">{getMeldName(meld.kind)}</div>
                <div className="tiles open">
                  {meld.tiles.map((tile, i) => (
                    <MahjongTileSVG key={i} tile={tile} width={50} height={67} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section winning-tile-section">
        <h3>胡張</h3>
        <div className="tile winning">
          <MahjongTileSVG tile={question.winningTile} width={60} height={80} />
        </div>
      </div>

      <div className="section scenario">
        <h3>場況資訊</h3>
        <div className="scenario-grid">
          <div className="scenario-item">
            <span className="label">胡牌方式：</span>
            <span className="value">{question.scenario.isSelfDraw ? '自摸' : '放槍'}</span>
          </div>
          <div className="scenario-item">
            <span className="label">圈風：</span>
            <span className="value">{getWindName(question.scenario.roundWind)}</span>
          </div>
          <div className="scenario-item">
            <span className="label">門風：</span>
            <span className="value">{getWindName(question.scenario.seatWind)}</span>
          </div>
          {question.scenario.isDealer && (
            <div className="scenario-item">
              <span className="label">莊家：</span>
              <span className="value">
                是 {question.scenario.dealerStreak > 0 && `(連${question.scenario.dealerStreak}莊)`}
              </span>
            </div>
          )}
          {question.scenario.isHaidi && (
            <div className="scenario-item highlight">
              <span className="label">特殊：</span>
              <span className="value">
                {question.scenario.isSelfDraw ? '海底撈月' : '海底撈魚'}
              </span>
            </div>
          )}
          {question.scenario.isGangShangKaiHua && (
            <div className="scenario-item highlight">
              <span className="label">特殊：</span>
              <span className="value">槓上開花</span>
            </div>
          )}
          {question.scenario.isQiangGangHu && (
            <div className="scenario-item highlight">
              <span className="label">特殊：</span>
              <span className="value">搶槓胡</span>
            </div>
          )}
          {question.scenario.flowers.length > 0 && (
            <div className="scenario-item">
              <span className="label">花牌：</span>
              <span className="value">
                {question.scenario.flowers.map(f => getFlowerName(f)).join('、')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TileDisplay
