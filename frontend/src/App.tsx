import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp,
  Clock3, CreditCard, Leaf, LoaderCircle, RefreshCw, ShieldCheck, Sparkles,
  TrendingDown, TrendingUp, Wallet, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from './api'
import type { Dashboard, Persona, Transaction } from './types'

const CURRENCY = import.meta.env.VITE_CURRENCY || 'BWP'
const LOCALE = CURRENCY === 'ZAR' ? 'en-ZA' : 'en-BW'
const money = (value: number) => new Intl.NumberFormat(LOCALE, {
  style: 'currency', currency: CURRENCY, maximumFractionDigits: 0,
}).format(value)
const preciseMoney = (value: number) => new Intl.NumberFormat(LOCALE, {
  style: 'currency', currency: CURRENCY, maximumFractionDigits: 2,
}).format(value)

function App() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    let active = true
    api.personas()
      .then((items) => {
        if (!active) return
        setPersonas(items)
        setSelectedId((current) => items.some((item) => item.id === current) ? current : (items[0]?.id ?? ''))
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load demo personas.')
      })
      .finally(() => { if (active) setLoadingPeople(false) })
    return () => { active = false }
  }, [])

  const loadDashboard = useCallback(async (id: string) => {
    if (!id) return
    setLoadingDashboard(true)
    setError('')
    try {
      const result = await api.dashboard(id)
      setDashboard(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dashboard.')
    } finally {
      setLoadingDashboard(false)
    }
  }, [])

  useEffect(() => { void loadDashboard(selectedId) }, [selectedId, loadDashboard])

  const runScenario = async () => {
    if (!selectedId) return
    setActing(true)
    setError('')
    try {
      setDashboard(await api.simulate(selectedId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not run the lean-week scenario.')
    } finally { setActing(false) }
  }

  const resetScenario = async () => {
    if (!selectedId) return
    setActing(true)
    setError('')
    try {
      setDashboard(await api.reset(selectedId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the scenario.')
    } finally { setActing(false) }
  }

  const currentPersona = useMemo(() => personas.find((item) => item.id === selectedId) ?? null, [personas, selectedId])
  const scenarioActive = dashboard?.forecast.scenario_active ?? false
  const chartData = dashboard?.weekly_history ?? []

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Pelo Finance home">
          <img className="brand-mark-image" src="/assets/pelo-mark.svg" alt="" />
          <span className="brand-word">pelo-finance</span>
        </a>
        <div className="topbar-right">
          <span className="demo-pill"><span className="status-dot" /> SYNTHETIC DEMO DATA</span>
          <button className="icon-button help-button" type="button" title="About this demo" onClick={() => window.alert('Pelo Finance is a hackathon prototype using synthetic transactions. PeloFinanceScore is an illustrative financial-consistency signal, not a validated credit score or lending decision.')}>
            <CircleHelp size={18} /> <span>About</span>
          </button>
        </div>
      </header>

      <main id="top" className="page-wrap">
        <section className="welcome-row">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> FINANCIAL CONFIDENCE, REIMAGINED</p>
            <h1>Make your financial<br className="desktop-break" /> <span className="headline-soft">story visible.</span></h1>
            <p className="welcome-copy">Pelo Finance helps irregular earners understand their income rhythm, prepare for lean weeks, and make consistency easier to see.</p>
          </div>
          <div className="persona-control">
            <span className="field-label">EXPLORING AS</span>
            <Listbox value={selectedId} onChange={setSelectedId} disabled={loadingPeople || personas.length === 0}>
              <div className="listbox-wrap">
                <ListboxButton className="persona-select">
                  <span className="persona-avatar">{currentPersona?.name.slice(0, 1) ?? '—'}</span>
                  <span className="persona-copy">
                    <span className="persona-name">{currentPersona?.name ?? (loadingPeople ? 'Loading people…' : 'Choose a persona')}</span>
                    <span className="persona-role">{currentPersona?.occupation ?? 'Demo profile'}</span>
                  </span>
                  <ChevronDown className="select-chevron" size={17} />
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-1">
                  <ListboxOptions className="persona-options">
                    {personas.map((persona) => (
                      <ListboxOption key={persona.id} value={persona.id} className={({ active }) => `persona-option ${active ? 'option-active' : ''}`}>
                        {({ selected }) => <>
                          <span className="option-avatar">{persona.name.slice(0, 1)}</span>
                          <span className="option-copy"><strong>{persona.name}</strong><small>{persona.occupation}</small></span>
                          {selected && <Check size={17} className="option-check" />}
                        </>}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>
        </section>

        {error && <div className="error-banner" role="alert">
          <CircleHelp size={18} />
          <div><strong>The dashboard needs a connection.</strong><span>{error} Start the FastAPI server on port 8000, then retry.</span></div>
          <button type="button" className="text-button" onClick={() => void loadDashboard(selectedId)}>Retry</button>
        </div>}

        {loadingDashboard && !dashboard ? <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>Reading the income rhythm…</span></div> : dashboard ? <>
          <section className="kippascore-strip" aria-label="PeloScore financial consistency signal">
            <div className="score-main">
              <div className="score-kicker"><span className="score-symbol">P</span><div><p className="eyebrow">INTRODUCING</p><h2>PeloFinanceScore</h2></div></div>
              <p className="score-description">A transparent view of financial consistency — designed for people whose income doesn't arrive on a schedule.</p>
              <span className="score-disclaimer"><ShieldCheck size={14} /> Illustrative demo signal · not a credit score</span>
            </div>
            <div className="score-value-wrap"><span className="score-label">DEMO SCORE</span><div className="score-value">{getKippaScore(dashboard)}<small>/100</small></div><div className="score-meter"><span style={{ width: `${getKippaScore(dashboard)}%` }} /></div><span className="score-confidence">Synthetic data · unvalidated</span></div>
            <div className="score-factors"><ScoreFactor label="Cash-flow resilience" value={dashboard.forecast.shortfall_risk ? 'Needs attention' : 'Holding steady'} tone={dashboard.forecast.shortfall_risk ? 'warning' : 'positive'} /><ScoreFactor label="Income pattern" value={dashboard.income_last_7d > 0 ? 'Activity observed' : 'Limited evidence'} tone="neutral" /><ScoreFactor label="Evidence quality" value="Synthetic feed" tone="neutral" /></div>
          </section>
          <section className="metrics-grid" aria-label="Financial overview">
            <MetricCard label="Available balance" value={money(dashboard.balance)} helper="Based on the demo feed" icon={<Wallet size={18} />} trend="neutral" />
            <MetricCard label="Income · next 7 days" value={money(dashboard.forecast.projected_income_7d)} helper="Model estimate, not a guarantee" icon={<ArrowDownRight size={18} />} trend="positive" />
            <MetricCard label="Outgoings · next 7 days" value={money(dashboard.forecast.projected_expenses_7d)} helper="Expected cash leaving" icon={<ArrowUpRight size={18} />} trend="neutral" />
            <MetricCard label="Illustrative cushion" value={money(dashboard.forecast.buffer_estimate)} helper="Not a loan or credit offer" icon={<ShieldCheck size={18} />} trend={dashboard.forecast.buffer_estimate > 0 ? 'positive' : 'warning'} />
          </section>

          <section className="content-grid">
            <article className="panel rhythm-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">THE BIGGER PICTURE</p><h2>Your income rhythm</h2><p className="panel-subtitle">Weekly money in vs. money out</p></div>
                <span className="mini-icon"><Activity size={18} /></span>
              </div>
              <div className="chart-legend"><span><i className="legend-dot income-dot" /> Income</span><span><i className="legend-dot expense-dot" /> Outgoings</span></div>
              <div className="chart-area" aria-label="Weekly income and outgoings chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#187653" stopOpacity={0.17} /><stop offset="100%" stopColor="#187653" stopOpacity={0.01} /></linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D8A14B" stopOpacity={0.15} /><stop offset="100%" stopColor="#D8A14B" stopOpacity={0.01} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E9ECE7" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="week_label" axisLine={false} tickLine={false} tick={{ fill: '#7B847D', fontSize: 11 }} dy={9} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7B847D', fontSize: 10 }} tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`} />
                    <Tooltip formatter={(value) => preciseMoney(Number(value))} labelStyle={{ color: '#17221D', fontWeight: 700 }} contentStyle={{ border: '1px solid #E4E8E2', borderRadius: 12, boxShadow: '0 10px 30px #17221D12' }} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#187653" strokeWidth={2.5} fill="url(#incomeFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="expenses" name="Outgoings" stroke="#D8A14B" strokeWidth={2.2} fill="url(#expenseFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer"><span><Clock3 size={14} /> Last 8 weeks of simulated activity</span><span className="synthetic-caption">Illustrative only</span></div>
            </article>

            <article className={`panel forecast-panel ${scenarioActive ? 'scenario-on' : ''}`}>
              <div className="forecast-topline"><span className="forecast-symbol"><Sparkles size={18} /></span><span className={`quality-pill quality-${dashboard.forecast.signal_quality.toLowerCase()}`}>{dashboard.forecast.signal_quality} signal</span></div>
              <p className="eyebrow">LOOKING AHEAD</p>
              <h2>{scenarioActive ? 'A lean week, modelled.' : 'What might next week bring?'}</h2>
              <p className="forecast-summary">{scenarioActive ? 'Incoming payments are reduced by 45% in this scenario. Your transaction history remains unchanged.' : 'Your recent patterns suggest this cash position for the next seven days.'}</p>
              <div className="forecast-balance-label">PROJECTED ENDING BALANCE</div>
              <div className={`forecast-balance ${dashboard.forecast.projected_end_balance < dashboard.forecast.reserve_floor ? 'balance-risk' : ''}`}>{money(dashboard.forecast.projected_end_balance)}</div>
              <div className="forecast-breakdown">
                <div><span><i className="legend-dot income-dot" /> Income expected</span><strong>{money(dashboard.forecast.projected_income_7d)}</strong></div>
                <div><span><i className="legend-dot expense-dot" /> Outgoings expected</span><strong>{money(dashboard.forecast.projected_expenses_7d)}</strong></div>
                <div><span><ShieldCheck size={14} /> Protected reserve</span><strong>{money(dashboard.forecast.reserve_floor)}</strong></div>
              </div>
              <button className={`scenario-button ${scenarioActive ? 'reset-button' : ''}`} type="button" onClick={scenarioActive ? resetScenario : runScenario} disabled={acting || loadingDashboard}>
                {acting ? <LoaderCircle size={17} className="spin" /> : scenarioActive ? <RefreshCw size={17} /> : <Zap size={17} />}
                {acting ? 'Updating forecast…' : scenarioActive ? 'Reset to baseline' : 'Simulate a lean week'}
              </button>
              <p className="scenario-footnote">{scenarioActive ? 'Stress test active · 45% lower inflows' : 'One click · no typing · no real account needed'}</p>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel insight-panel">
              <div className="panel-heading compact-heading"><div><p className="eyebrow">YOUR NEXT MOVE</p><h2>A little clarity goes a long way.</h2></div><span className="mini-icon mint-icon"><Leaf size={18} /></span></div>
              {dashboard.forecast.shortfall_risk && <div className="reserve-alert"><TrendingDown size={17} /><span>The cautious forecast falls below your protected reserve.</span></div>}
              <div className="insights-list">
                {dashboard.insights.map((insight, index) => <div className="insight-row" key={`${insight.title}-${index}`}>
                  <span className={`insight-mark ${insight.tone === 'warning' ? 'mark-warning' : insight.tone === 'positive' ? 'mark-positive' : ''}`}>{insight.tone === 'warning' ? <TrendingDown size={17} /> : <Leaf size={17} />}</span>
                  <div><strong>{insight.title}</strong><p>{insight.body}</p></div>
                </div>)}
              </div>
              <div className="model-note"><CreditCard size={15} /><span>{dashboard.forecast.model}. Scenario output is illustrative and is not a credit decision.</span></div>
            </article>

            <article className="panel transactions-panel">
              <div className="panel-heading compact-heading"><div><p className="eyebrow">FROM THE FEED</p><h2>Recent activity</h2></div><span className="mini-icon"><Wallet size={18} /></span></div>
              <div className="transaction-list">
                {dashboard.recent_transactions.map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}
              </div>
              <div className="feed-footer"><span className="feed-status"><span className="status-dot" /> Synthetic transaction feed</span><span>{dashboard.recent_transactions.length} latest entries</span></div>
            </article>
          </section>
          <footer className="page-footer"><span><ShieldCheck size={15} /> Built to make financial consistency visible.</span><span>Demo currency: {CURRENCY} · Synthetic data only.</span></footer>
        </> : !loadingPeople && !error ? <div className="empty-state">No demo persona was found. Check that the API has seeded its synthetic data.</div> : null}
      </main>
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      {showWelcome && (loadingPeople ? <div className="brand-splash" role="status" aria-label="Loading Kippa"><div className="glass-k-wrap"><img src="/assets/kippa-glass-k.svg" alt="Kippa" /></div><span className="splash-wordmark">kippa</span><span className="splash-caption">MAKING YOUR FINANCIAL STORY VISIBLE</span><span className="splash-loader" /></div> : <div className="welcome-overlay"><div className="welcome-orb orb-a" /><div className="welcome-orb orb-b" /><div className="welcome-content"><div className="glass-k-wrap welcome-k"><img src="/assets/kippa-glass-k.svg" alt="" /></div><img className="welcome-wordmark" src="/assets/kippa-wordmark.svg" alt="kippa" /><p className="welcome-eyebrow">FINANCIAL CONFIDENCE, REIMAGINED</p><h1>Your income is a story.<br /><span>Let's make it visible.</span></h1><p className="welcome-body">A clearer way for irregular earners to understand their cash flow, prepare for lean weeks, and show the consistency behind their hustle.</p><div className="welcome-points"><span><i /> See your rhythm</span><span><i /> Prepare for lean weeks</span><span><i /> Build a clearer financial picture</span></div><button className="welcome-cta" type="button" onClick={() => setShowWelcome(false)}>Explore the demo <ArrowUpRight size={17} /></button><p className="welcome-footnote"><ShieldCheck size={13} /> Demo environment · all financial data is synthetic</p></div><div className="welcome-side-note">A BETTER SIGNAL FOR EVERYDAY EARNERS <span>01 / 03</span></div></div>)}
    </div>
  )
}

function MetricCard({ label, value, helper, icon, trend }: { label: string; value: string; helper: string; icon: ReactNode; trend: 'neutral' | 'positive' | 'warning' }) {
  return <article className="metric-card">
    <div className={`metric-icon metric-${trend}`}>{icon}</div>
    <p className="metric-label">{label}</p>
    <div className="metric-value">{value}</div>
    <p className="metric-helper">{helper}</p>
  </article>
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const incoming = transaction.kind === 'income'
  const dateLabel = new Date(transaction.occurred_at).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
  return <div className="transaction-row">
    <span className={`transaction-icon ${incoming ? 'transaction-income' : 'transaction-expense'}`}>{incoming ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span>
    <div className="transaction-main"><strong>{transaction.description}</strong><span>{transaction.category} · {dateLabel}</span></div>
    <div className={`transaction-amount ${incoming ? 'amount-in' : 'amount-out'}`}>{incoming ? '+' : '−'}{money(transaction.amount)}</div>
  </div>
}

function getKippaScore(dashboard: Dashboard): number {
  // Explicitly illustrative demo heuristic; not trained or validated for lending decisions.
  const expense = Math.max(dashboard.forecast.projected_expenses_7d, 1)
  const coverage = dashboard.forecast.projected_end_balance / expense
  const resilience = Math.max(0, Math.min(30, Math.round(15 + coverage * 5)))
  const activity = dashboard.income_last_7d > 0 ? 22 : 8
  const forecast = dashboard.forecast.signal_quality.toLowerCase() === 'steadier' ? 18 : dashboard.forecast.signal_quality.toLowerCase() === 'limited' ? 9 : 14
  const risk = dashboard.forecast.shortfall_risk ? 14 : 22
  return Math.max(0, Math.min(100, resilience + activity + forecast + risk))
}

function ScoreFactor({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'warning' | 'neutral' }) {
  return <div className="score-factor"><span className={`factor-dot factor-${tone}`} /><div><span>{label}</span><strong>{value}</strong></div></div>
}

export default App
