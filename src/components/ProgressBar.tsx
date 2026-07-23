interface Props {
  roundName: string
  current: number
  total: number
}

export default function ProgressBar({ roundName, current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#222' }}>{roundName}</span>
        <span style={{ fontSize: 13, color: '#999' }}>
          第 <strong style={{ color: '#000', fontSize: 18, fontWeight: 800 }}>{current + 1}</strong> / {total} 组
        </span>
      </div>
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #000, #555)',
          borderRadius: 3,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}
