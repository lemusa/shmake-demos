import React, { useState, useRef, useEffect, useCallback } from 'react'

const STAGES = [
  { threshold: 0, label: 'Dry', color: '#8B4513', integrity: 100 },
  { threshold: 8, label: 'Slightly Damp', color: '#7a3b10', integrity: 90 },
  { threshold: 18, label: 'Nicely Soaked', color: '#6a300d', integrity: 70 },
  { threshold: 35, label: 'Dangerously Soggy', color: '#5a260a', integrity: 45 },
  { threshold: 55, label: 'Structural Failure Imminent', color: '#4a1c07', integrity: 20 },
  { threshold: 75, label: 'CRITICAL', color: '#3a1205', integrity: 5 },
]

const RESULTS = {
  dry: {
    emoji: '😐',
    title: 'Coward.',
    subtitle: 'That Tim Tam barely touched the tea. Were you even trying?',
  },
  light: {
    emoji: '🤔',
    title: 'Timid Dunker',
    subtitle: 'A brief encounter. The Tim Tam wanted more.',
  },
  perfect: {
    emoji: '🤌',
    title: 'PERFECT DUNK',
    subtitle: 'Maximum saturation. Zero casualties. You are a god among dunkers.',
  },
  risky: {
    emoji: '😰',
    title: 'Living on the Edge',
    subtitle: 'That was close. The Tim Tam gods smiled upon you today.',
  },
  disaster: {
    emoji: '💀',
    title: 'CATASTROPHIC FAILURE',
    subtitle: '',
  },
}

const DISASTER_MESSAGES = [
  "Your Tim Tam has drowned. It's gone. It's in tea heaven now.",
  "Structural integrity: zero. That Tim Tam is now tea soup.",
  "The Tim Tam has entered the shadow realm (bottom of the mug).",
  "Gone. Reduced to atoms. The tea claimed another victim.",
  "That wasn't a dunk, that was a burial at sea.",
  "RIP Tim Tam. Cause of death: hubris.",
  "The soggy bottom has claimed another. You monster.",
  "Tim Tam status: dissolved. Your dignity: also dissolved.",
]

function getResult(dunkTime, collapsed) {
  if (collapsed) {
    const msg = DISASTER_MESSAGES[Math.floor(Math.random() * DISASTER_MESSAGES.length)]
    return { ...RESULTS.disaster, subtitle: msg }
  }
  if (dunkTime < 8) return RESULTS.dry
  if (dunkTime < 20) return RESULTS.light
  if (dunkTime < 50) return RESULTS.perfect
  return RESULTS.risky
}

function getCurrentStage(progress) {
  let current = STAGES[0]
  for (const stage of STAGES) {
    if (progress >= stage.threshold) current = stage
  }
  return current
}

export default function Landing() {
  const [gameState, setGameState] = useState('idle')
  const [dunkProgress, setDunkProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [biscuitY, setBiscuitY] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [wobble, setWobble] = useState(0)
  const [crumbs, setCrumbs] = useState([])
  const [splashActive, setSplashActive] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const animRef = useRef(null)
  const startTimeRef = useRef(null)
  const collapseChanceRef = useRef(0)
  const dunkProgressRef = useRef(0)

  const resetGame = useCallback(() => {
    setGameState('idle')
    setDunkProgress(0)
    dunkProgressRef.current = 0
    setBiscuitY(0)
    setCollapsed(false)
    setWobble(0)
    setCrumbs([])
    setSplashActive(false)
    setResult(null)
    collapseChanceRef.current = 0
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }, [])

  const endDunk = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null

    const progress = dunkProgressRef.current
    const finalResult = getResult(progress, false)
    setGameState('result')
    setAttempts(a => a + 1)
    setResult(finalResult)

    if (progress > 0 && progress >= 20) {
      setHighScore(prev => Math.max(prev, Math.round(progress)))
    }
  }, [])

  const startDunk = useCallback(() => {
    if (gameState !== 'idle') return
    setGameState('dunking')
    startTimeRef.current = Date.now()
    collapseChanceRef.current = 0
    dunkProgressRef.current = 0
    setSplashActive(true)
    setTimeout(() => setSplashActive(false), 300)

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min((elapsed / 5000) * 100, 100)
      setDunkProgress(progress)
      dunkProgressRef.current = progress
      setBiscuitY(Math.min(progress * 0.6, 55))

      if (progress > 35) {
        setWobble(Math.sin(elapsed / 80) * (progress - 35) * 0.08)
      }

      if (progress > 45 && Math.random() < 0.03) {
        setCrumbs(prev => [
          ...prev.slice(-8),
          {
            id: Date.now() + Math.random(),
            x: 45 + Math.random() * 10,
            delay: Math.random() * 0.2,
          },
        ])
      }

      if (progress > 55) {
        collapseChanceRef.current += 0.001 * ((progress - 55) / 10)
        if (Math.random() < collapseChanceRef.current) {
          setCollapsed(true)
          setGameState('result')
          setAttempts(a => a + 1)
          setResult(getResult(progress, true))
          return
        }
      }

      if (progress >= 100) {
        setCollapsed(true)
        setGameState('result')
        setAttempts(a => a + 1)
        setResult(getResult(100, true))
        return
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
  }, [gameState])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // Listen for release anywhere on the page while dunking
  useEffect(() => {
    if (gameState !== 'dunking') return

    const handleRelease = (e) => {
      e.preventDefault()
      endDunk()
    }

    const preventScroll = (e) => {
      e.preventDefault()
    }

    window.addEventListener('mouseup', handleRelease)
    window.addEventListener('touchend', handleRelease)
    window.addEventListener('touchcancel', handleRelease)
    window.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      window.removeEventListener('mouseup', handleRelease)
      window.removeEventListener('touchend', handleRelease)
      window.removeEventListener('touchcancel', handleRelease)
      window.removeEventListener('touchmove', preventScroll)
    }
  }, [gameState, endDunk])

  const stage = getCurrentStage(dunkProgress)
  const isCritical = dunkProgress > 55

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.gameArea}>
          <h1 style={styles.title}>Tim Tam Dunk Simulator</h1>
          <p style={styles.subtitle}>
            Hold to dunk. Release before structural failure. Simple.
          </p>

          <div style={styles.scene}>
            <div style={styles.steamContainer}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    ...styles.steam,
                    left: `${35 + i * 15}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>

            {!collapsed && (
              <div
                style={{
                  ...styles.biscuitContainer,
                  transform: `translateY(${biscuitY}px) rotate(${wobble}deg)`,
                }}
              >
                <div
                  style={{
                    ...styles.biscuit,
                    background: stage.color,
                    boxShadow: isCritical
                      ? `0 0 ${dunkProgress - 45}px rgba(139, 69, 19, 0.3)`
                      : 'none',
                  }}
                >
                  <div style={styles.biscuitCoating} />
                  <div style={styles.biscuitCoating2} />
                  <div
                    style={{
                      ...styles.sogginess,
                      height: `${Math.min(dunkProgress * 1.2, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {collapsed && (
              <div style={styles.fallingBiscuit}>
                <div style={{ ...styles.biscuit, background: '#3a1205', opacity: 0.7 }}>
                  <div style={styles.biscuitCoating} />
                </div>
              </div>
            )}

            {crumbs.map(crumb => (
              <div
                key={crumb.id}
                style={{
                  ...styles.crumb,
                  left: `${crumb.x}%`,
                  animationDelay: `${crumb.delay}s`,
                }}
              />
            ))}

            {/* Mug back layer - tea visible behind biscuit */}
            <div style={styles.mugBack}>
              <div style={styles.mugBackInner}>
                <div
                  style={{
                    ...styles.tea,
                    ...(splashActive ? styles.teaSplash : {}),
                  }}
                >
                  <div style={styles.teaShine} />
                </div>
              </div>
            </div>

            {/* Mug front rim - renders on top of biscuit */}
            <div style={styles.mugFront}>
              <div style={styles.mugHandle} />
            </div>
          </div>

          {/* Fixed-height area so button doesn't jump */}
          <div style={styles.statusResultArea}>
            {gameState === 'dunking' && (
              <div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${dunkProgress}%`,
                      background:
                        dunkProgress > 55
                          ? 'linear-gradient(90deg, #b45309, #dc2626)'
                          : dunkProgress > 35
                          ? 'linear-gradient(90deg, #b45309, #f59e0b)'
                          : 'linear-gradient(90deg, #78350f, #b45309)',
                    }}
                  />
                </div>
                <div
                  style={{
                    ...styles.stageLabel,
                    color: isCritical ? '#ef4444' : '#a3a3a3',
                    ...(isCritical
                      ? { animation: 'pulse 0.3s ease-in-out infinite alternate' }
                      : {}),
                  }}
                >
                  {stage.label}
                  {isCritical && ' ⚠️'}
                </div>
                <div style={styles.integrityLabel}>
                  Structural Integrity: {Math.max(0, Math.round(stage.integrity - (dunkProgress - stage.threshold)))}%
                </div>
              </div>
            )}

            {gameState === 'result' && result && (
              <div>
                <div style={styles.resultEmoji}>{result.emoji}</div>
                <div style={styles.resultTitle}>{result.title}</div>
                <div style={styles.resultSubtitle}>{result.subtitle}</div>
                {!collapsed && dunkProgress >= 20 && (
                  <div style={styles.scoreLabel}>
                    Saturation: {Math.round(dunkProgress)}%
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.controls}>
            {gameState === 'idle' && (
              <button
                style={styles.dunkButton}
                onMouseDown={startDunk}
                onTouchStart={(e) => { e.preventDefault(); startDunk() }}
              >
                🍫 Hold to Dunk
              </button>
            )}
            {gameState === 'dunking' && (
              <button
                style={{
                  ...styles.dunkButton,
                  ...styles.dunkButtonActive,
                  ...(isCritical ? styles.dunkButtonCritical : {}),
                }}
              >
                {isCritical ? '🫣 RELEASE NOW?!' : '☕ Dunking...'}
              </button>
            )}
            {gameState === 'result' && (
              <button style={styles.dunkButton} onClick={resetGame}>
                🍫 Another Tim Tam
              </button>
            )}
          </div>

          {(highScore > 0 || attempts > 0) && (
            <div style={styles.stats}>
              {highScore > 0 && <span>Best dunk: {highScore}%</span>}
              {highScore > 0 && attempts > 0 && <span style={styles.statDot}>·</span>}
              {attempts > 0 && <span>Tim Tams consumed: {attempts}</span>}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes steam {
          0% { opacity: 0; transform: translateY(0) scaleX(1); }
          50% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-40px) scaleX(2); }
        }
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(60px) rotate(25deg); opacity: 0; }
        }
        @keyframes crumbFall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    background: '#0a0a0a',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  container: {
    width: '100%',
    maxWidth: '460px',
  },
  gameArea: {
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '12px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  },
  title: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '1.15rem',
    fontWeight: 500,
    color: '#e5e5e5',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#737373',
    margin: '0 0 2rem',
  },
  scene: {
    position: 'relative',
    height: '260px',
    margin: '0 auto 1.5rem',
    maxWidth: '200px',
    userSelect: 'none',
  },
  steamContainer: {
    position: 'absolute',
    top: '95px',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  steam: {
    position: 'absolute',
    width: '8px',
    height: '20px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '50%',
    animation: 'steam 2s ease-in-out infinite',
  },
  biscuitContainer: {
    position: 'absolute',
    top: '95px',
    left: '50%',
    marginLeft: '-16px',
    zIndex: 5,
    transition: 'transform 0.05s linear',
  },
  biscuit: {
    width: '32px',
    height: '80px',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.3)',
  },
  biscuitCoating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background:
      'repeating-linear-gradient(180deg, transparent, transparent 18px, rgba(0,0,0,0.15) 18px, rgba(0,0,0,0.15) 20px)',
  },
  biscuitCoating2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: 'linear-gradient(180deg, rgba(92,50,18,0.5), transparent)',
  },
  sogginess: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(0deg, rgba(30,15,5,0.9), rgba(60,30,10,0.4))',
    transition: 'height 0.3s ease',
  },
  fallingBiscuit: {
    position: 'absolute',
    top: '145px',
    left: '50%',
    marginLeft: '-16px',
    zIndex: 5,
    animation: 'fall 0.8s ease-in forwards',
  },
  crumb: {
    position: 'absolute',
    top: '150px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#5a3a1a',
    animation: 'crumbFall 0.8s ease-in forwards',
  },
  mugBack: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    marginLeft: '-50px',
    width: '100px',
    height: '100px',
    background: 'linear-gradient(180deg, #d4d4d4, #a3a3a3)',
    borderRadius: '6px 6px 16px 16px',
    zIndex: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  mugBackInner: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    right: '6px',
    bottom: '10px',
    background: '#1a1a1a',
    borderRadius: '2px 2px 12px 12px',
    overflow: 'hidden',
  },
  mugFront: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    marginLeft: '-50px',
    width: '100px',
    height: '100px',
    borderRadius: '6px 6px 16px 16px',
    border: '6px solid #a3a3a3',
    borderTop: '6px solid #d4d4d4',
    background: 'transparent',
    zIndex: 6,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  },
  tea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    background: 'linear-gradient(180deg, #78350f, #5c2d0e)',
    transition: 'transform 0.3s ease',
  },
  teaSplash: {
    transform: 'scaleY(1.05)',
  },
  teaShine: {
    position: 'absolute',
    top: 0,
    left: '10%',
    width: '40%',
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
  },
  mugHandle: {
    position: 'absolute',
    right: '-22px',
    top: '20px',
    width: '22px',
    height: '50px',
    border: '8px solid #a3a3a3',
    borderLeft: 'none',
    borderRadius: '0 14px 14px 0',
  },
  statusResultArea: {
    minHeight: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  progressBar: {
    height: '8px',
    background: '#262626',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.1s linear',
  },
  stageLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
  },
  integrityLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.7rem',
    color: '#525252',
  },
  resultEmoji: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  resultTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#e5e5e5',
    marginBottom: '0.5rem',
  },
  resultSubtitle: {
    fontSize: '0.85rem',
    color: '#737373',
    lineHeight: 1.5,
    maxWidth: '320px',
    margin: '0 auto',
  },
  scoreLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    color: '#b45309',
    marginTop: '0.75rem',
  },
  controls: {
    marginBottom: '1rem',
  },
  dunkButton: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    border: '1px solid #362312',
    background: 'linear-gradient(180deg, #78350f, #5c2d0e)',
    color: '#fed7aa',
    cursor: 'pointer',
    transition: 'all 0.15s',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  },
  dunkButtonActive: {
    background: 'linear-gradient(180deg, #92400e, #78350f)',
    transform: 'scale(0.97)',
    boxShadow: '0 0 20px rgba(180, 83, 9, 0.2)',
  },
  dunkButtonCritical: {
    background: 'linear-gradient(180deg, #b91c1c, #991b1b)',
    borderColor: '#7f1d1d',
    animation: 'pulse 0.3s ease-in-out infinite alternate',
  },
  stats: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.7rem',
    color: '#525252',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  statDot: {
    color: '#333',
  },
}
