import { useState } from 'react'
import { RulesConfig, DEFAULT_RULES_CONFIG } from '../types/rulesConfig'
import './RulesConfigPanel.css'

interface RulesConfigPanelProps {
  config: RulesConfig
  onChange: (config: RulesConfig) => void
}

type RuleKey = keyof Omit<RulesConfig, 'jianHuaJianZi'>

interface RuleItem {
  key: RuleKey
  label: string
}

const RULE_GROUPS: { title: string; rules: RuleItem[] }[] = [
  {
    title: '十六台',
    rules: [
      { key: 'tianHu', label: '天胡' },
      { key: 'diHu', label: '地胡' },
      { key: 'daSiXi', label: '大四喜' },
    ]
  },
  {
    title: '八台',
    rules: [
      { key: 'guoShiWuShuang', label: '國士無雙' },
      { key: 'daSanYuan', label: '大三元' },
      { key: 'xiaoSiXi', label: '小四喜' },
      { key: 'ziYiSe', label: '字一色' },
      { key: 'qingYiSe', label: '清一色' },
      { key: 'wuAnKe', label: '五暗刻' },
      { key: 'baXianGuoHai', label: '八仙過海' },
    ]
  },
  {
    title: '五台',
    rules: [
      { key: 'siAnKe', label: '四暗刻' },
    ]
  },
  {
    title: '四台',
    rules: [
      { key: 'hunYiSe', label: '混一色' },
      { key: 'pengPengHu', label: '碰碰胡' },
      { key: 'xiaoSanYuan', label: '小三元' },
      { key: 'qiDuiZi', label: '七對子' },
    ]
  },
  {
    title: '二台',
    rules: [
      { key: 'pingHu', label: '平胡' },
      { key: 'quanQiuRen', label: '全求人' },
      { key: 'sanAnKe', label: '三暗刻' },
    ]
  },
  {
    title: '一台',
    rules: [
      { key: 'menQing', label: '門清' },
      { key: 'buQiu', label: '不求' },
      { key: 'ziMo', label: '自摸' },
      { key: 'zhuangJia', label: '莊家' },
      { key: 'quanFeng', label: '圈風' },
      { key: 'menFeng', label: '門風' },
      { key: 'sanYuanPai', label: '三元牌' },
      { key: 'huaPai', label: '花牌' },
      { key: 'duTing', label: '獨聽' },
      { key: 'haiDi', label: '海底/河底' },
      { key: 'gangShangKaiHua', label: '槓上開花' },
      { key: 'qiangGang', label: '搶槓' },
      { key: 'lianZhuang', label: '連莊' },
      { key: 'laZhuang', label: '拉莊' },
      { key: 'huaGang', label: '花槓' },
    ]
  }
]

// 見花見字啟用時強制停用的規則
const JIAN_HUA_DISABLED_KEYS: RuleKey[] = ['quanFeng', 'menFeng']

function RulesConfigPanel({ config, onChange }: RulesConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleRule = (key: RuleKey) => {
    onChange({ ...config, [key]: !config[key] })
  }

  const handleToggleJianHua = () => {
    const newJianHua = !config.jianHuaJianZi
    const newConfig = { ...config, jianHuaJianZi: newJianHua }

    // 見花見字啟用時，強制停用圈風和門風
    if (newJianHua) {
      JIAN_HUA_DISABLED_KEYS.forEach(key => {
        newConfig[key] = false
      })
    }

    onChange(newConfig)
  }

  const handleReset = () => {
    onChange({ ...DEFAULT_RULES_CONFIG })
  }

  const isRuleDisabled = (key: RuleKey): boolean => {
    return config.jianHuaJianZi && JIAN_HUA_DISABLED_KEYS.includes(key)
  }

  return (
    <div className="rules-config-panel">
      <button
        className="rules-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`arrow ${isOpen ? 'open' : ''}`}>&#9654;</span>
        規則設定
      </button>

      {isOpen && (
        <div className="rules-panel-content">
          <div className="rules-special-mode">
            <label>
              <input
                type="checkbox"
                checked={config.jianHuaJianZi}
                onChange={handleToggleJianHua}
              />
              見花見字
            </label>
            <div className="mode-description">
              每朵花牌 1 台、每組字牌刻子 1 台（不區分門風/圈風）
            </div>
          </div>

          {RULE_GROUPS.map(group => (
            <div key={group.title} className="rules-group">
              <div className="rules-group-title">{group.title}</div>
              <div className="rules-group-items">
                {group.rules.map(rule => {
                  const disabled = isRuleDisabled(rule.key)
                  return (
                    <label
                      key={rule.key}
                      className={`rule-item ${disabled ? 'disabled' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={config[rule.key]}
                        disabled={disabled}
                        onChange={() => handleToggleRule(rule.key)}
                      />
                      {rule.label}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="rules-actions">
            <button className="reset-button" onClick={handleReset}>
              恢復預設
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RulesConfigPanel
