import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Medal, TrendingUp, Users, Zap } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

const dummyPlayers = [
  { rank: 1, name: 'Aarav', value: 'Rs. 1,28,450', change: '+12.8%', style: 'podium-card podium-card-first' },
  { rank: 2, name: 'Mira', value: 'Rs. 1,21,900', change: '+9.6%', style: 'podium-card' },
  { rank: 3, name: 'Kabir', value: 'Rs. 1,17,240', change: '+7.2%', style: 'podium-card' },
];

const tableRows = [
  ...dummyPlayers,
  { rank: 4, name: 'Isha', value: 'Rs. 1,09,120', change: '+3.4%' },
  { rank: 5, name: 'Rohan', value: 'Rs. 1,04,880', change: '+1.9%' },
  { rank: 6, name: 'Neel', value: 'Rs. 98,760', change: '-1.2%' },
];

function LeaderboardPage() {
  const { contestId } = useParams();

  return (
    <div className="app-shell page">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <Link to={`/contest/${contestId}`} className="icon-btn" aria-label="Back to dashboard"><ArrowLeft size={18} /></Link>
            <div>
              <p className="brand-subtitle">Contest leaderboard</p>
              <h1 className="brand-title">Performance board</h1>
            </div>
          </div>
          <Badge tone="warning">Preview</Badge>
        </div>
      </header>

      <main className="container page-main leaderboard-stage">
        <section className="card card-pad stack">
          <div className="spread">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h2 className="section-title" style={{ margin: 0 }}>Top performers</h2>
            </div>
            <Medal color="var(--color-warning)" />
          </div>
          <div className="podium-grid">
            <article className={dummyPlayers[1].style}>
              <Badge>#2</Badge>
              <div><h3 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>{dummyPlayers[1].name}</h3><p className="muted" style={{ margin: 0 }}>{dummyPlayers[1].value}</p></div>
              <strong style={{ color: 'var(--color-success)' }}>{dummyPlayers[1].change}</strong>
            </article>
            <article className={dummyPlayers[0].style}>
              <Badge tone="warning">Champion</Badge>
              <div><h3 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>{dummyPlayers[0].name}</h3><p className="muted" style={{ margin: 0 }}>{dummyPlayers[0].value}</p></div>
              <strong style={{ color: 'var(--color-success)' }}>{dummyPlayers[0].change}</strong>
            </article>
            <article className={dummyPlayers[2].style}>
              <Badge>#3</Badge>
              <div><h3 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>{dummyPlayers[2].name}</h3><p className="muted" style={{ margin: 0 }}>{dummyPlayers[2].value}</p></div>
              <strong style={{ color: 'var(--color-success)' }}>{dummyPlayers[2].change}</strong>
            </article>
          </div>
        </section>

        <section className="insight-grid">
          <div className="insight-card"><Users color="var(--color-accent)" /><div><strong>24 players</strong><p className="muted" style={{ margin: 0 }}>Dummy participation depth.</p></div></div>
          <div className="insight-card"><TrendingUp color="var(--color-success)" /><div><strong>Rs. 1.28L high</strong><p className="muted" style={{ margin: 0 }}>Current leading value.</p></div></div>
          <div className="insight-card"><Zap color="var(--color-warning)" /><div><strong>18 trades today</strong><p className="muted" style={{ margin: 0 }}>Activity metric placeholder.</p></div></div>
        </section>

        <section className="card card-pad stack">
          <div>
            <p className="eyebrow">All ranks</p>
            <h2 className="section-title" style={{ margin: 0 }}>Contest standings</h2>
          </div>
          <div className="leaderboard-table">
            {tableRows.map((player) => (
              <div className="compact-row" key={player.rank}>
                <span className="rank-pill">{player.rank}</span>
                <strong>{player.name}</strong>
                <div style={{ textAlign: 'right' }}>
                  <strong>{player.value}</strong>
                  <p style={{ margin: 0, color: player.change.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{player.change}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LeaderboardPage;
