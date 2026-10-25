import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, CircleHelp, Gauge, LoaderCircle, LogOut, Plus, Send, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { accountApi } from './accountApi'
import type { AccountDashboard, AccountTransaction, AccountUser, AccountBusiness, AuthResponse } from './accountApi'
import './account.css'

type Mode = 'register' | 'login'
type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string }

const SESSION_KEY = 'pelo-peloyame-session-id'
const USAGE_DAY_KEY = 'pelo-peloyame-usage-day'
const REMAINING_KEY = 'pelo-peloyame-remaining'
function syncPeloyameUsageDay(): void {
  // Backend quotas roll over at UTC midnight; keep the client counter on that same day key.
  const todayUtc = new Date().toISOString().slice(0, 10)
  if (window.sessionStorage.getItem(USAGE_DAY_KEY) !== todayUtc) {
    window.sessionStorage.setItem(USAGE_DAY_KEY, todayUtc)
    window.sessionStorage.removeItem(SESSION_KEY)
    window.sessionStorage.removeItem(REMAINING_KEY)
  }
}
function getPeloyameSessionId(): string {
  syncPeloyameUsageDay()
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing
  const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  window.sessionStorage.setItem(SESSION_KEY, created)
  return created
}

const money = (amount: number) => new Intl.NumberFormat('en-BW', {
  style: 'currency', currency: 'BWP', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount)
const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function AccountPortal() {
  const [mode, setMode] = useState<Mode>('register')
  const [checkingSession, setCheckingSession] = useState(true)
  const [token, setToken] = useState(() => window.sessionStorage.getItem('pelo-access-token') || '')
  const [user, setUser] = useState<AccountUser | null>(null)
  const [business, setBusiness] = useState<AccountBusiness | null>(null)
  const [dashboard, setDashboard] = useState<AccountDashboard | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [scenarioActive, setScenarioActive] = useState(false)
  const [authForm, setAuthForm] = useState({ owner_name: '', email: '', password: '', business_name: '', business_type: 'Retail / tuck shop', opening_balance: '0' })
  const [transactionForm, setTransactionForm] = useState({ kind: 'income' as 'income' | 'expense', amount: '', category: 'Sales', description: '', occurred_at: todayLocal() })
  const [question, setQuestion] = useState('')
  const [remainingQuestions, setRemainingQuestions] = useState(() => {
    syncPeloyameUsageDay()
    const stored = window.sessionStorage.getItem(REMAINING_KEY)
    const parsed = stored == null ? 5 : Number(stored)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : 5
  })
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about the financial summary you have entered here. I can explain the numbers and short-term outlook, but I cannot move money or provide a lending decision.' },
  ])

  const refreshDashboard = useCallback(async () => {
    const result = await accountApi.dashboard()
    setDashboard(result)
  }, [])

  const acceptAuth = useCallback((response: AuthResponse) => {
    const previousUserId = window.sessionStorage.getItem('pelo-auth-user-id')
    if (previousUserId && previousUserId !== String(response.user.id)) {
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(REMAINING_KEY)
      setRemainingQuestions(5)
      setMessages([{ id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about your recorded financial summary.' }])
    }
    window.sessionStorage.setItem('pelo-auth-user-id', String(response.user.id))
    window.sessionStorage.setItem('pelo-access-token', response.access_token)
    setToken(response.access_token)
    setUser(response.user)
    setBusiness(response.business)
  }, [])

  useEffect(() => {
    let active = true
    const saved = window.sessionStorage.getItem('pelo-access-token')
    if (!saved) {
      setCheckingSession(false)
      return () => { active = false }
    }
    accountApi.me().then(response => {
      if (!active) return
      acceptAuth(response)
    }).catch(() => {
      window.sessionStorage.removeItem('pelo-access-token')
      if (active) setToken('')
    }).finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [acceptAuth])

  useEffect(() => {
    if (!token) return
    let active = true
    accountApi.dashboard().then(result => { if (active) setDashboard(result) })
      .catch(err => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load your account.'
        if (/session has expired|401/i.test(message)) {
          window.sessionStorage.removeItem('pelo-access-token')
          setToken('')
          setUser(null)
          setBusiness(null)
        } else setError(message)
      })
    return () => { active = false }
  }, [token])

  const currentBalance = dashboard?.current_balance ?? 0
  const displayedForecast = scenarioActive ? dashboard?.lean_week_end_balance_7d : dashboard?.projected_end_balance_7d
  const runwayLabel = dashboard?.runway_days == null ? 'Not enough expense history' : `${dashboard.runway_days.toFixed(1)} days at recent average`
  const recentTransactions = useMemo(() => dashboard?.recent_transactions ?? [], [dashboard])

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthBusy(true)
    setError('')
    setNotice('')
    try {
      let result: AuthResponse
      if (mode === 'register') {
        result = await accountApi.register({
          owner_name: authForm.owner_name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
          business_name: authForm.business_name.trim(),
          business_type: authForm.business_type,
          opening_balance: Number(authForm.opening_balance || '0'),
        })
        setNotice('Your account is ready. Add a few records to make your cash summary more useful.')
      } else {
        result = await accountApi.login({ email: authForm.email.trim(), password: authForm.password })
      }
      acceptAuth(result)
      setAuthForm(previous => ({ ...previous, password: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete sign in. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  const signOut = () => {
    window.sessionStorage.removeItem('pelo-access-token')
    window.sessionStorage.removeItem('pelo-auth-user-id')
    setToken('')
    setUser(null)
    setBusiness(null)
    setDashboard(null)
    setMessages([{ id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about your recorded financial summary.' }])
    window.sessionStorage.removeItem(SESSION_KEY)
    window.sessionStorage.removeItem(REMAINING_KEY)
    setRemainingQuestions(5)
    setNotice('You have signed out.')
  }

  const submitTransaction = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const amount = Number(transactionForm.amount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.')
      await accountApi.addTransaction({
        kind: transactionForm.kind,
        amount,
        category: transactionForm.category.trim(),
        description: transactionForm.description.trim(),
        occurred_at: `${transactionForm.occurred_at}T12:00:00`,
      })
      await refreshDashboard()
      setTransactionForm(previous => ({ ...previous, amount: '', description: '' }))
      setScenarioActive(false)
      setNotice('Transaction saved. Your cash summary has been updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const removeTransaction = async (entry: AccountTransaction) => {
    if (!window.confirm(`Delete “${entry.description}” for ${money(entry.amount)}?`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await accountApi.deleteTransaction(entry.id)
      await refreshDashboard()
      setNotice('Transaction deleted and cash summary refreshed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this transaction.')
    } finally {
      setBusy(false)
    }
  }

  const askPeloyame = async (event: FormEvent) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt || prompt.length > 600 || busy || remainingQuestions <= 0) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: prompt }
    setMessages(previous => [...previous, userMessage])
    setQuestion('')
    setBusy(true)
    setError('')
    try {
      const response = await accountApi.askPeloyame({ question: prompt, session_id: getPeloyameSessionId() })
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', text: response.answer }])
      setRemainingQuestions(response.remaining_questions)
      window.sessionStorage.setItem(REMAINING_KEY, String(response.remaining_questions))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Peloyame is temporarily unavailable. Your records are unaffected.'
      if (/five-question limit|daily question allowance/i.test(message)) {
        setRemainingQuestions(0)
        window.sessionStorage.setItem(REMAINING_KEY, '0')
      } else if (/Peloyame could not respond just now|provider.s free-tier limit/i.test(message)) {
        setRemainingQuestions(previous => {
          const next = Math.max(0, previous - 1)
          window.sessionStorage.setItem(REMAINING_KEY, String(next))
          return next
        })
      }
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  if (checkingSession) return <main className="account-page account-loading"><LoaderCircle className="account-spin" size={26} /><p>Checking your Pelo session…</p></main>

  if (!token || !user || !business) {
    return <main className="account-page">
      <div className="account-topbar">
        <a className="account-brand" href="/" onClick={event => { event.preventDefault(); window.location.assign('/') }}><img src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span></a>
        <a className="account-demo-link" href="/app/overview">Explore the synthetic demo <ArrowRight size={15} /></a>
      </div>
      <section className="account-auth-layout">
        <div className="account-auth-story">
          <p className="account-eyebrow">YOUR MONEY, IN CONTEXT</p>
          <h1>See where your cash stands. <em>Plan what comes next.</em></h1>
          <p className="account-lede">Start with the numbers you know. Pelo helps you organise recorded activity, review a simple outlook and test a quieter week—without connecting a bank account.</p>
          <div className="account-trust-note"><ShieldCheck size={18} /><span>Your financial records are kept separate from public synthetic demo profiles.</span></div>
          <div className="account-preview-card"><span className="account-preview-icon"><Wallet size={19} /></span><div><small>BUILT AROUND YOUR RECORDS</small><strong>Manual entry. Clear summaries. Transparent assumptions.</strong></div></div>
        </div>
        <div className="account-auth-card">
          <div className="account-auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setNotice('') }}>Create account</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }}>Sign in</button>
          </div>
          <p className="account-eyebrow">{mode === 'register' ? 'A CLEARER START' : 'WELCOME BACK'}</p>
          <h2>{mode === 'register' ? 'Set up your business' : 'Sign in to Pelo'}</h2>
          <p className="account-muted">{mode === 'register' ? 'Create a private account to record your own activity.' : 'Use the email and password you registered with.'}</p>
          <form className="account-form" onSubmit={submitAuth}>
            {mode === 'register' && <>
              <label>Full name<input required minLength={2} maxLength={80} autoComplete="name" value={authForm.owner_name} onChange={event => setAuthForm({ ...authForm, owner_name: event.target.value })} /></label>
              <label>Business name<input required minLength={2} maxLength={100} autoComplete="organization" value={authForm.business_name} onChange={event => setAuthForm({ ...authForm, business_name: event.target.value })} /></label>
              <label>Business type<select value={authForm.business_type} onChange={event => setAuthForm({ ...authForm, business_type: event.target.value })}><option>Retail / tuck shop</option><option>Food vendor</option><option>Market trader</option><option>Personal services</option><option>Transport</option><option>Other microbusiness</option></select></label>
              <label>Opening cash balance (P)<input type="number" min="0" max="10000000" step="0.01" inputMode="decimal" value={authForm.opening_balance} onChange={event => setAuthForm({ ...authForm, opening_balance: event.target.value })} /><span className="account-field-help">Optional. Enter the cash you have available to start tracking.</span></label>
            </>}
            <label>Email address<input required type="email" autoComplete="email" maxLength={254} value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} /></label>
            <label>Password<input required type="password" minLength={mode === 'register' ? 10 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} />{mode === 'register' && <span className="account-field-help">Use at least 10 characters. Do not reuse a password from another account.</span>}</label>
            {error && <div className="account-alert error" role="alert">{error}</div>}
            {notice && <div className="account-alert success" role="status">{notice}</div>}
            <button className="account-primary-button" disabled={authBusy} type="submit">{authBusy ? <LoaderCircle size={17} className="account-spin" /> : mode === 'register' ? <Plus size={17} /> : <ArrowRight size={17} />}{authBusy ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in securely'}</button>
          </form>
          <p className="account-disclaimer"><CircleHelp size={14} /> Hackathon MVP. No bank or mobile-money account is connected. Forecasts are estimates.</p>
        </div>
      </section>
    </main>
  }

  return <main className="account-page account-dashboard-page">
    <header className="account-topbar">
      <a className="account-brand" href="/account"><img src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span></a>
      <div className="account-user-menu"><span className="account-user-label">{user.owner_name}<small>{business.business_name}</small></span><button className="account-outline-button" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>
    </header>
    <section className="account-dashboard-heading"><div><p className="account-eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Good to see you, {user.owner_name.split(' ')[0]}.</h1><p>Here is the picture from the financial activity you have recorded so far.</p></div><span className="account-live-badge"><CheckCircle2 size={15} /> Private account</span></section>
    {error && <div className="account-alert error" role="alert">{error}</div>}
    {notice && <div className="account-alert success" role="status">{notice}</div>}
    {!dashboard ? <div className="account-panel account-center-panel"><LoaderCircle className="account-spin" size={24} /><p>Loading your cash summary…</p></div> : <>
      <section className="account-metrics-grid">
        <article className="account-metric-card account-balance-metric"><span>Current recorded cash</span><strong>{money(currentBalance)}</strong><small>Opening balance + income − expenses</small></article>
        <article className="account-metric-card"><span>Income · last 30 days</span><strong>{money(dashboard.income_last_30d)}</strong><small>Based on records you entered</small></article>
        <article className="account-metric-card"><span>Expenses · last 30 days</span><strong>{money(dashboard.expenses_last_30d)}</strong><small>Based on records you entered</small></article>
        <article className="account-metric-card"><span>Estimated cash runway</span><strong>{dashboard.runway_days == null ? '—' : `${dashboard.runway_days.toFixed(1)} days`}</strong><small>{runwayLabel}</small></article>
      </section>
      <section className="account-work-grid">
        <article className="account-panel account-ledger-panel">
          <div className="account-panel-heading"><div><p className="account-eyebrow">YOUR RECORDS</p><h2>Add financial activity</h2><p>These entries are stored under your account, not the synthetic demo.</p></div></div>
          <form className="account-entry-form" onSubmit={submitTransaction}>
            <label>Type<select value={transactionForm.kind} onChange={event => setTransactionForm({ ...transactionForm, kind: event.target.value as 'income' | 'expense', category: event.target.value === 'income' ? 'Sales' : 'Stock' })}><option value="income">Money in</option><option value="expense">Money out</option></select></label>
            <label>Amount (P)<input required type="number" min="0.01" max="10000000" step="0.01" inputMode="decimal" value={transactionForm.amount} onChange={event => setTransactionForm({ ...transactionForm, amount: event.target.value })} /></label>
            <label>Category<select value={transactionForm.category} onChange={event => setTransactionForm({ ...transactionForm, category: event.target.value })}>{(transactionForm.kind === 'income' ? ['Sales', 'Service income', 'Customer payment', 'Other income'] : ['Stock', 'Supplier payment', 'Rent / stall costs', 'Transport / fuel', 'Utilities / data', 'Wages', 'Household / owner draw', 'Other expense']).map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Date<input required type="date" max={todayLocal()} value={transactionForm.occurred_at} onChange={event => setTransactionForm({ ...transactionForm, occurred_at: event.target.value })} /></label>
            <label className="account-entry-wide">Description<input required minLength={2} maxLength={160} value={transactionForm.description} onChange={event => setTransactionForm({ ...transactionForm, description: event.target.value })} placeholder="e.g. Morning sales or supplier payment" /></label>
            <button className="account-primary-button account-entry-wide" disabled={busy} type="submit">{busy ? <LoaderCircle size={16} className="account-spin" /> : <Plus size={16} />} Save transaction</button>
          </form>
          <div className="account-transactions-heading"><div><p className="account-eyebrow">RECENT ACTIVITY</p><h2>Your ledger</h2></div><span>{recentTransactions.length} entries shown</span></div>
          {recentTransactions.length === 0 ? <div className="account-empty-state"><img src="/assets/pelo-empty-ledger.svg" alt="" /><strong>Your first record starts here.</strong><p>Add income or an expense above to see your cash picture begin to take shape.</p></div> : <div className="account-transactions-list">{recentTransactions.map(entry => <div className="account-transaction-row" key={entry.id}><span className={`account-transaction-icon ${entry.kind}`} aria-hidden="true">{entry.kind === 'income' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div className="account-transaction-main"><strong>{entry.description}</strong><small>{entry.category} · {new Date(entry.occurred_at).toLocaleDateString('en-BW', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><strong className={`account-transaction-amount ${entry.kind}`}>{entry.kind === 'income' ? '+' : '−'}{money(entry.amount)}</strong><button className="account-delete-button" type="button" aria-label={`Delete ${entry.description}`} title="Delete transaction" onClick={() => void removeTransaction(entry)} disabled={busy}><Trash2 size={15} /></button></div>)}</div>}
        </article>
        <div className="account-side-stack">
          <article className="account-panel account-score-panel">
            <div className="account-score-heading"><div><p className="account-eyebrow">PELOSCORE · EARLY INDICATOR</p><h2>A signal, not a verdict.</h2></div><span className="account-score-icon"><Gauge size={20} /></span></div>
            <div className="account-score-value-row"><strong>{dashboard.peloscore == null ? '—' : dashboard.peloscore}</strong><span>/ 100</span><small>{dashboard.peloscore == null ? 'More records needed' : 'Illustrative score'}</small></div>
            <p className="account-panel-copy">{dashboard.peloscore_status}</p>
            {dashboard.peloscore_factors.length > 0 && <div className="account-score-factors">{dashboard.peloscore_factors.map(factor => <div className="account-score-factor" key={factor.label}><div className="account-score-factor-top"><strong>{factor.label}</strong><span>{factor.value}</span></div><p>{factor.explanation}</p></div>)}</div>}
            <p className="account-small-note">PeloScore is an explainable prototype indicator based on records you enter. It is not a credit score, lending decision or guarantee.</p>
          </article>
          <article className="account-panel account-forecast-panel">
            <p className="account-eyebrow">A SIMPLE OUTLOOK</p><h2>{scenarioActive ? 'A quieter week, modelled.' : 'What might next week look like?'}</h2>
            <p className="account-panel-copy">A transparent average-based estimate from your recorded activity. {dashboard.signal_quality} evidence: {dashboard.observed_days} calendar day(s) with recorded activity.</p>
            <span className="account-forecast-label">PROJECTED ENDING CASH</span><strong className="account-forecast-value">{money(displayedForecast ?? 0)}</strong>
            <div className="account-forecast-pair"><span>Baseline estimate</span><strong>{money(dashboard.projected_end_balance_7d)}</strong></div><div className="account-forecast-pair"><span>Lean-week estimate</span><strong>{money(dashboard.lean_week_end_balance_7d)}</strong></div><div className="account-forecast-pair"><span>Illustrative 3-day reserve</span><strong>{money(dashboard.reserve_floor)}</strong></div>
            {dashboard.shortfall_risk && <div className="account-forecast-alert">Your current baseline estimate sits below the illustrative reserve. Verify upcoming payments and expenses before committing cash.</div>}
            <button className="account-primary-button" type="button" onClick={() => setScenarioActive(value => !value)}>{scenarioActive ? 'Return to baseline' : 'Test a lean week' } <ArrowRight size={16} /></button>
            <p className="account-small-note">The scenario is a calculation only. It does not change your recorded transactions. This is not a validated forecast.</p>
          </article>
          <article className="account-panel account-ai-panel">
            <div className="account-ai-heading"><span><img src="/assets/peloyame-mark.svg" alt="" /></span><div><p className="account-eyebrow">PELOYAME LITE</p><h2>Ask about your cash</h2></div></div>
            <p className="account-panel-copy">Answers use a minimal summary of your records. Peloyame is read-only and cannot move money or access other accounts.</p>
            <div className="account-chat-log" aria-live="polite">{messages.map(message => <div key={message.id} className={`account-chat-message ${message.role}`}><span>{message.role === 'assistant' ? 'Peloyame' : 'You'}</span><p>{message.text}</p></div>)}</div>
            <form className="account-chat-form" onSubmit={askPeloyame}><label htmlFor="peloyame-question" className="sr-only">Ask Peloyame a question</label><textarea id="peloyame-question" maxLength={600} rows={3} value={question} onChange={event => setQuestion(event.target.value)} placeholder="e.g. What should I pay attention to this week?" disabled={busy || remainingQuestions <= 0} /><button type="submit" aria-label="Send question" disabled={busy || !question.trim() || remainingQuestions <= 0}>{busy ? <LoaderCircle size={17} className="account-spin" /> : <Send size={17} />}</button></form>
            <div className="account-chat-footer"><span>{remainingQuestions} questions left this session</span><span>Read-only · AI may be wrong</span></div>
          </article>
        </div>
      </section>
      <p className="account-data-note"><ShieldCheck size={15} /> Your account uses manually entered information. No bank, mobile-money, tax or credit-verification provider is connected. Share only data you are comfortable recording.</p>
    </>}
    <footer className="account-footer"><span>© Pelo Finance · Kgottla Data Labs</span><a href="/app/overview">View the synthetic demo <ArrowRight size={14} /></a></footer>
  </main>
}
