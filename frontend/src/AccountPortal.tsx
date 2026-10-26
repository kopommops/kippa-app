import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowLeftRight, ArrowRight, ArrowUpRight, Bell,
  Building2, CheckCircle2, CircleHelp, Download, Gauge, LayoutDashboard,
  LoaderCircle, LogOut, MessageCircle, Moon, Plus, Save, Settings, ShieldCheck,
  Sun, Trash2, TrendingUp, Wallet, Send, Link2,
} from 'lucide-react'
import { accountApi } from './accountApi'
import type {
  AccountBusiness, AccountDashboard, AccountNotification, AccountSettings,
  AccountTransaction, AccountUser, AuthResponse, BankConnection,
} from './accountApi'
import './account.css'

type AuthMode = 'register' | 'login'
type Theme = 'light' | 'dark'
type AccountSection = 'overview' | 'activity' | 'forecast' | 'peloscore' | 'peloyame' | 'settings'
type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string }

const SESSION_KEY = 'pelo-peloyame-session-id'
const USAGE_DAY_KEY = 'pelo-peloyame-usage-day'
const REMAINING_KEY = 'pelo-peloyame-remaining'
const TOKEN_KEY = 'pelo-access-token'
const USER_ID_KEY = 'pelo-auth-user-id'
const THEME_KEY = 'pelo-theme'

const NAV_ITEMS: { id: AccountSection; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'activity', label: 'Activity', Icon: ArrowLeftRight },
  { id: 'forecast', label: 'Forecast', Icon: TrendingUp },
  { id: 'peloscore', label: 'PeloScore', Icon: Gauge },
  { id: 'peloyame', label: 'Peloyame', Icon: MessageCircle },
  { id: 'settings', label: 'Settings', Icon: Settings },
]
const BUSINESS_TYPES = ['Retail / tuck shop', 'Food vendor', 'Market trader', 'Personal services', 'Transport', 'Other microbusiness']
const INCOME_CATEGORIES = ['Sales', 'Service income', 'Customer payment', 'Other income']
const EXPENSE_CATEGORIES = ['Stock', 'Supplier payment', 'Rent / stall costs', 'Transport / fuel', 'Utilities / data', 'Wages', 'Household / owner draw', 'Other expense']

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* Storage may be blocked; use the current app theme if present. */ }
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try { window.localStorage.setItem(THEME_KEY, theme) } catch { /* Theme still applies for this page. */ }
}
function syncPeloyameUsageDay(): void {
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
  const [mode, setMode] = useState<AuthMode>('register')
  const [section, setSection] = useState<AccountSection>('overview')
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [checkingSession, setCheckingSession] = useState(true)
  const [token, setToken] = useState(() => window.sessionStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState<AccountUser | null>(null)
  const [business, setBusiness] = useState<AccountBusiness | null>(null)
  const [dashboard, setDashboard] = useState<AccountDashboard | null>(null)
  const [settings, setSettings] = useState<AccountSettings | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [notifications, setNotifications] = useState<AccountNotification[]>([])
  const [authBusy, setAuthBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [scenarioActive, setScenarioActive] = useState(false)
  const [authForm, setAuthForm] = useState({ owner_name: '', email: '', password: '', business_name: '', business_type: 'Retail / tuck shop', opening_balance: '0' })
  const [transactionForm, setTransactionForm] = useState({ kind: 'income' as 'income' | 'expense', amount: '', category: 'Sales', description: '', occurred_at: todayLocal() })
  const [bankConnectForm, setBankConnectForm] = useState({ provider_code: 'demo_fnb' as 'demo_fnb' | 'demo_mobile_money' | 'demo_savings', account_label: 'Main demo account' })
  const [bankEventForm, setBankEventForm] = useState({ connection_id: '', kind: 'income' as 'income' | 'expense', amount: '250.00', category: 'Sales', description: 'Simulated customer payment' })
  const [question, setQuestion] = useState('')
  const [remainingQuestions, setRemainingQuestions] = useState(20)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false)
  const [aiConsent, setAiConsent] = useState(false)
  const [consentLoaded, setConsentLoaded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about the financial summary you have entered here. I can explain the numbers and short-term outlook, but I cannot move money or provide a lending decision.' },
  ])

  const acceptAuth = useCallback((response: AuthResponse) => {
    const previousUserId = window.sessionStorage.getItem(USER_ID_KEY)
    if (previousUserId && previousUserId !== String(response.user.id)) {
      window.sessionStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(REMAINING_KEY)
      setRemainingQuestions(5)
      setMessages([{ id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about your recorded financial summary.' }])
    }
    window.sessionStorage.setItem(USER_ID_KEY, String(response.user.id))
    window.sessionStorage.setItem(TOKEN_KEY, response.access_token)
    setToken(response.access_token)
    setUser(response.user)
    setBusiness(response.business)
  }, [])

  const refreshDashboard = useCallback(async () => {
    const result = await accountApi.dashboard()
    setDashboard(result)
  }, [])
  const refreshSupportingData = useCallback(async () => {
    const [nextSettings, nextConnections, nextNotifications] = await Promise.all([
      accountApi.settings(), accountApi.bankConnections(), accountApi.notifications(),
    ])
    setSettings(nextSettings)
    try { const consent = await accountApi.consent(); setAiConsent(consent.peloyame_ai_consent); setConsentLoaded(true); } catch { setConsentLoaded(false) }
    try { const usage = await accountApi.peloyameUsage(); setRemainingQuestions(usage.remaining_questions); } catch { /* The chat endpoint remains authoritative if usage status is unavailable. */ }
    setConnections(nextConnections)
    setNotifications(nextNotifications)
    setBankEventForm(previous => ({ ...previous, connection_id: previous.connection_id || String(nextConnections[0]?.id ?? '') }))
  }, [])
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshDashboard(), refreshSupportingData()])
  }, [refreshDashboard, refreshSupportingData])

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) setTheme(event.newValue)
    }
    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  useEffect(() => {
    let active = true
    const saved = window.sessionStorage.getItem(TOKEN_KEY)
    if (!saved) { setCheckingSession(false); return () => { active = false } }
    accountApi.me().then(response => { if (active) acceptAuth(response) })
      .catch(() => { window.sessionStorage.removeItem(TOKEN_KEY); if (active) setToken('') })
      .finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [acceptAuth])

  useEffect(() => {
    if (!token) return
    let active = true
    refreshAll().catch(err => {
      if (!active) return
      const message = err instanceof Error ? err.message : 'Unable to load your account.'
      if (/session has expired|401/i.test(message)) {
        window.sessionStorage.removeItem(TOKEN_KEY)
        setToken(''); setUser(null); setBusiness(null)
      } else setError(message)
    })
    return () => { active = false }
  }, [token, refreshAll])

  const currentBalance = dashboard?.current_balance ?? 0
  const displayedForecast = scenarioActive ? dashboard?.lean_week_end_balance_7d : dashboard?.projected_end_balance_7d
  const runwayLabel = dashboard?.runway_days == null ? 'Not enough expense history' : `${dashboard.runway_days.toFixed(1)} days at recent average`
  const recentTransactions = useMemo(() => dashboard?.recent_transactions ?? [], [dashboard])
  const unreadCount = notifications.filter(item => !item.is_read).length

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setAuthBusy(true); setError(''); setNotice('')
    try {
      let result: AuthResponse
      if (mode === 'register') {
        result = await accountApi.register({
          owner_name: authForm.owner_name.trim(), email: authForm.email.trim(), password: authForm.password,
          business_name: authForm.business_name.trim(), business_type: authForm.business_type,
          opening_balance: Number(authForm.opening_balance || '0'), accepted_terms: acceptedTerms, acknowledged_privacy: acknowledgedPrivacy, peloyame_ai_consent: aiConsent,
        })
        setNotice('Your account is ready. Add a few records to make your cash summary more useful.')
      } else result = await accountApi.login({ email: authForm.email.trim(), password: authForm.password })
      acceptAuth(result)
      setRemainingQuestions(20)
      setAuthForm(previous => ({ ...previous, password: '' }))
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete sign in. Please try again.') }
    finally { setAuthBusy(false) }
  }

  const signOut = () => {
    window.sessionStorage.removeItem(TOKEN_KEY); window.sessionStorage.removeItem(USER_ID_KEY)
    window.sessionStorage.removeItem(SESSION_KEY); window.sessionStorage.removeItem(REMAINING_KEY)
    setToken(''); setUser(null); setBusiness(null); setDashboard(null); setSettings(null)
    setConnections([]); setNotifications([]); setRemainingQuestions(5)
    setMessages([{ id: 'welcome', role: 'assistant', text: 'Hi, I’m Peloyame. Ask me about your recorded financial summary.' }])
    window.location.assign('/')
  }

  const submitTransaction = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const amount = Number(transactionForm.amount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.')
      await accountApi.addTransaction({ kind: transactionForm.kind, amount, category: transactionForm.category.trim(), description: transactionForm.description.trim(), occurred_at: `${transactionForm.occurred_at}T12:00:00` })
      await refreshDashboard()
      setTransactionForm(previous => ({ ...previous, amount: '', description: '' }))
      setScenarioActive(false); setNotice('Transaction saved. Your cash summary has been updated.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Transaction could not be saved.') }
    finally { setBusy(false) }
  }

  const removeTransaction = async (entry: AccountTransaction) => {
    if (!window.confirm(`Delete “${entry.description}” for ${money(entry.amount)}?`)) return
    setBusy(true); setError(''); setNotice('')
    try { await accountApi.deleteTransaction(entry.id); await refreshDashboard(); setNotice('Transaction deleted and cash summary refreshed.') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this transaction.') }
    finally { setBusy(false) }
  }

  const askPeloyame = async (event: FormEvent) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt || prompt.length > 600 || busy || remainingQuestions <= 0) return
    setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', text: prompt }])
    setQuestion(''); setBusy(true); setError('')
    try {
      if (!aiConsent) throw new Error('Enable Peloyame AI processing in Settings before asking a question.')
      const response = await accountApi.askPeloyame({ question: prompt, session_id: getPeloyameSessionId() })
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', text: response.answer }])
      setRemainingQuestions(response.daily_questions_remaining)
      window.sessionStorage.setItem(REMAINING_KEY, String(response.daily_questions_remaining))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Peloyame is temporarily unavailable. Your records are unaffected.'
      if (/daily question allowance|daily limit/i.test(message)) { setRemainingQuestions(0); window.sessionStorage.setItem(REMAINING_KEY, '0') }
      else if (/Peloyame could not respond just now|provider.s free-tier limit/i.test(message)) {
        setRemainingQuestions(previous => { const next = Math.max(0, previous - 1); window.sessionStorage.setItem(REMAINING_KEY, String(next)); return next })
      }
      setError(message)
    } finally { setBusy(false) }
  }

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault(); if (!settings) return
    setBusy(true); setError(''); setNotice('')
    try {
      const updated = await accountApi.updateSettings({ owner_name: settings.owner_name.trim(), business_name: settings.business_name.trim(), business_type: settings.business_type })
      setSettings(updated); setUser(previous => previous ? { ...previous, owner_name: updated.owner_name } : previous)
      setBusiness({ business_name: updated.business_name, business_type: updated.business_type })
      setNotice('Your account details have been updated.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update account settings.') }
    finally { setBusy(false) }
  }

  const exportData = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await accountApi.exportData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = 'pelo-finance-account-export.json'; link.click(); URL.revokeObjectURL(url)
      setNotice('Your account export has been prepared.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not export account data.') }
    finally { setBusy(false) }
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm('Permanently delete your Pelo account, profile, transactions, simulated connections and notifications? This cannot be undone.')
    if (!confirmed) return
    const typed = window.prompt('Type DELETE to confirm account deletion.')
    if (typed !== 'DELETE') { setNotice('Account deletion cancelled.'); return }
    setBusy(true); setError('')
    try { await accountApi.deleteAccount(); signOut() }
    catch (err) { setError(err instanceof Error ? err.message : 'Account deletion failed. Your data has not been intentionally altered by this screen.') }
    finally { setBusy(false) }
  }

  const connectDemoBank = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const connection = await accountApi.connectDemoBank(bankConnectForm)
      setConnections(await accountApi.bankConnections())
      setBankEventForm(previous => ({ ...previous, connection_id: String(connection.id) }))
      setNotice(`${connection.provider_name} is ready. This is a simulation; no real bank was contacted.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create the demo connection.') }
    finally { setBusy(false) }
  }

  const simulateBankEvent = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (!bankEventForm.connection_id) throw new Error('Connect a demo account first.')
      const amount = Number(bankEventForm.amount)
      if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) throw new Error('Enter a valid amount up to P10,000,000.')
      await accountApi.simulateBankEvent(Number(bankEventForm.connection_id), {
        kind: bankEventForm.kind, amount, category: bankEventForm.category.trim(), description: bankEventForm.description.trim(),
      })
      await Promise.all([refreshDashboard(), refreshSupportingData()])
      setScenarioActive(false)
      setNotice(`Simulated ${bankEventForm.kind === 'income' ? 'incoming' : 'outgoing'} money event added. Activity, cash summary and notification feed updated; no real bank activity occurred.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create the simulated bank event.') }
    finally { setBusy(false) }
  }

  const markRead = async (item: AccountNotification) => {
    if (item.is_read) return
    try {
      const updated = await accountApi.markNotificationRead(item.id)
      setNotifications(previous => previous.map(entry => entry.id === updated.id ? updated : entry))
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not mark this notification as read.') }
  }

  if (checkingSession) return <main className="account-page account-loading"><LoaderCircle className="account-spin" size={26} /><p>Checking your Pelo session…</p></main>

  if (!token || !user || !business) {
    return <main className="account-page account-auth-page">
      <header className="account-topbar">
        <a className="account-brand" href="/" onClick={event => { event.preventDefault(); window.location.assign('/') }}><img src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span></a>
        <div className="account-topbar-actions">
          <button className="account-theme-button" type="button" onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span></button>
          <a className="account-demo-link" href="/app/overview">Explore the synthetic demo <ArrowRight size={15} /></a>
        </div>
      </header>
      <section className="account-auth-layout">
        <div className="account-auth-story">
          <p className="account-eyebrow">YOUR MONEY, IN CONTEXT</p>
          <h1>See where your cash stands. <em>Plan what comes next.</em></h1>
          <p className="account-lede">Start with the numbers you know. Pelo helps you organise recorded activity, review a simple outlook and test a quieter week. You can also explore a clearly labelled simulated bank feed.</p>
          <div className="account-trust-note"><ShieldCheck size={18} /><span>Your financial records are stored under your own account and kept separate from public synthetic demo profiles.</span></div>
          <div className="account-preview-card"><span className="account-preview-icon"><Wallet size={19} /></span><div><small>BUILT AROUND YOUR RECORDS</small><strong>Manual entry. Clear summaries. Transparent assumptions.</strong></div></div>
        </div>
        <div className="account-auth-card">
          <div className="account-auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setNotice('') }}>Create account</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }}>Sign in</button>
          </div>
          <p className="account-eyebrow">{mode === 'register' ? 'A CLEARER START' : 'WELCOME BACK'}</p>
          <h2>{mode === 'register' ? 'Set up your business' : 'Sign in to Pelo'}</h2>
          <p className="account-muted">{mode === 'register' ? 'Create a private account to record your own activity.' : 'Use the email and password you registered with. You can sign in from another device.'}</p>
          <form className="account-form" onSubmit={submitAuth}>
            {mode === 'register' && <>
              <label>Full name<input required minLength={2} maxLength={80} autoComplete="name" value={authForm.owner_name} onChange={event => setAuthForm({ ...authForm, owner_name: event.target.value })} /></label>
              <label>Business name<input required minLength={2} maxLength={100} autoComplete="organization" value={authForm.business_name} onChange={event => setAuthForm({ ...authForm, business_name: event.target.value })} /></label>
              <label>Business type<select value={authForm.business_type} onChange={event => setAuthForm({ ...authForm, business_type: event.target.value })}>{BUSINESS_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
              <label>Opening cash balance (P)<input type="number" min="0" max="10000000" step="0.01" inputMode="decimal" value={authForm.opening_balance} onChange={event => setAuthForm({ ...authForm, opening_balance: event.target.value })} /><span className="account-field-help">Optional. Enter the cash you have available to start tracking.</span></label>
            </>}
            <label>Email address<input required type="email" autoComplete="email" maxLength={254} value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} /></label>
            <label>Password<input required type="password" minLength={mode === 'register' ? 10 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} />{mode === 'register' && <span className="account-field-help">Use at least 10 characters. Do not reuse a password from another account.</span>}</label>
            {mode === 'register' && <div className="account-consent-fields">
              <label className="account-consent-check"><input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} required /> <span>I agree to the <button type="button" className="account-inline-policy" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'terms' } }))}>Terms of Use</button>.</span></label>
              <label className="account-consent-check"><input type="checkbox" checked={acknowledgedPrivacy} onChange={event => setAcknowledgedPrivacy(event.target.checked)} required /> <span>I have read the <button type="button" className="account-inline-policy" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'privacy' } }))}>Privacy Notice</button>.</span></label>
              <label className="account-consent-check"><input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)} /> <span>Optional: I consent to Peloyame sending a limited financial summary and my question to Groq to generate an answer. <button type="button" className="account-inline-policy" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'ai' } }))}>How AI uses data</button></span></label>
            </div>}
            {error && <div className="account-alert error" role="alert">{error}</div>}
            {notice && <div className="account-alert success" role="status">{notice}</div>}
            <button className="account-primary-button" disabled={authBusy} type="submit">{authBusy ? <LoaderCircle size={17} className="account-spin" /> : mode === 'register' ? <Plus size={17} /> : <ArrowRight size={17} />}{authBusy ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in securely'}</button>
          </form>
          <p className="account-disclaimer"><CircleHelp size={14} /> Hackathon MVP. No OTP is required for this prototype. Simulated bank events are not real bank data.</p>
        </div>
      </section>
      <footer className="account-footer"><span>© Pelo Finance · Kgottla Data Labs</span><span className="account-policy-links"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'terms' } }))}>Terms</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'privacy' } }))}>Privacy</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'security' } }))}>Data & Security</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'ai' } }))}>Peloyame AI</button></span><a href="/">Back to landing page <ArrowRight size={14} /></a></footer>
    </main>
  }

  return <div className="account-page account-app-page">
    <header className="account-topbar">
      <a className="account-brand" href="/" onClick={event => { event.preventDefault(); window.location.assign('/') }}><img src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span></a>
      <div className="account-topbar-actions">
        <span className="account-user-label">{user.owner_name}<small>{business.business_name}</small></span>
        <button className="account-theme-button" type="button" onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span></button>
        <a className="account-outline-button" href="/" onClick={event => { event.preventDefault(); window.location.assign('/') }}>Landing page <ArrowRight size={15} /></a>
        <button className="account-outline-button" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
      </div>
    </header>

    <section className="account-dashboard-heading"><div><p className="account-eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>{section === 'overview' ? `Good to see you, ${user.owner_name.split(' ')[0]}.` : NAV_ITEMS.find(item => item.id === section)?.label}</h1><p>{section === 'overview' ? 'Use your recorded activity to understand where your cash stands and what might come next.' : section === 'peloyame' ? 'Ask Peloyame to explain your permitted financial summary.' : 'Your private business workspace. Your records are separate from the synthetic demo.'}</p></div><span className="account-live-badge"><CheckCircle2 size={15} /> Private account</span></section>
    {error && <div className="account-alert error" role="alert">{error}</div>}
    {notice && <div className="account-alert success" role="status">{notice}</div>}

    <div className="account-workspace">
      <aside className="account-sidebar" aria-label="Private account navigation">
        <p className="account-sidebar-label">YOUR WORKSPACE</p>
        <nav>{NAV_ITEMS.map(item => { const Icon = item.Icon; return <button key={item.id} type="button" className={`account-nav-item ${section === item.id ? 'active' : ''}`} aria-current={section === item.id ? 'page' : undefined} onClick={() => { setSection(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Icon size={18} /><span>{item.label}</span>{item.id === 'settings' && unreadCount > 0 && <small>{unreadCount}</small>}</button> })}</nav>
        <div className="account-sidebar-note"><ShieldCheck size={16} /><span><strong>Private workspace</strong><small>Simulated bank data is clearly labelled.</small></span></div>
      </aside>

      <main className="account-main-content" id="account-main-content" tabIndex={-1}>
        {!dashboard ? <div className="account-panel account-center-panel"><LoaderCircle className="account-spin" size={24} /><p>Loading your cash summary…</p></div> : <>
          {section === 'overview' && <>
            <section className="account-metrics-grid">
              <article className="account-metric-card account-balance-metric"><span>Current recorded cash</span><strong>{money(currentBalance)}</strong><small>Opening balance + income − expenses</small></article>
              <article className="account-metric-card"><span>Income · last 30 days</span><strong>{money(dashboard.income_last_30d)}</strong><small>Based on recorded and simulated events</small></article>
              <article className="account-metric-card"><span>Expenses · last 30 days</span><strong>{money(dashboard.expenses_last_30d)}</strong><small>Based on recorded and simulated events</small></article>
              <article className="account-metric-card"><span>Estimated cash runway</span><strong>{dashboard.runway_days == null ? '—' : `${dashboard.runway_days.toFixed(1)} days`}</strong><small>{runwayLabel}</small></article>
            </section>
            <section className="account-overview-grid">
              <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">CASH OUTLOOK</p><h2>What might next week look like?</h2><p>Estimate based on your recorded activity, not a guarantee.</p></div><span className="account-forecast-label">{scenarioActive ? 'LEAN-WEEK ESTIMATE' : 'BASELINE ESTIMATE'}</span><strong className="account-forecast-value account-forecast-light">{money(displayedForecast ?? 0)}</strong><div className="account-forecast-pair"><span>Baseline</span><strong>{money(dashboard.projected_end_balance_7d)}</strong></div><div className="account-forecast-pair"><span>Lean week</span><strong>{money(dashboard.lean_week_end_balance_7d)}</strong></div><button className="account-secondary-action" type="button" onClick={() => { setSection('forecast'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Open forecast <ArrowRight size={15} /></button></article>
              <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">RECENT ACTIVITY</p><h2>Latest movements</h2></div>{recentTransactions.length ? <div className="account-transactions-list">{recentTransactions.slice(0, 5).map(entry => <TransactionRow key={entry.id} entry={entry} onDelete={removeTransaction} disabled={busy} />)}</div> : <EmptyState title="Start with one record" text="Add a transaction in Activity or create a simulated bank event in Settings." />}<button className="account-secondary-action" type="button" onClick={() => setSection('activity')}>Open activity <ArrowRight size={15} /></button></article>
            </section>
            <section className="account-panel account-notifications-panel"><div className="account-panel-heading account-heading-inline"><div><p className="account-eyebrow">ACCOUNT NOTIFICATIONS</p><h2>Recent updates {unreadCount > 0 && <span className="account-count-pill">{unreadCount} new</span>}</h2></div><Bell size={19} /></div>{notifications.length ? <div className="account-notification-list">{notifications.slice(0, 5).map(item => <NotificationRow key={item.id} item={item} onRead={markRead} />)}</div> : <EmptyState title="No notifications yet" text="When you simulate an incoming or outgoing payment, its notification will appear here." />}</section>
          </>}

          {section === 'activity' && <div className="account-section-stack">
            <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">YOUR RECORDS</p><h2>Add financial activity</h2><p>Manual entries and simulated bank events are distinguished in the ledger.</p></div>
              <form className="account-entry-form" onSubmit={submitTransaction}>
                <label>Type<select value={transactionForm.kind} onChange={event => setTransactionForm({ ...transactionForm, kind: event.target.value as 'income' | 'expense', category: event.target.value === 'income' ? 'Sales' : 'Stock' })}><option value="income">Money in</option><option value="expense">Money out</option></select></label>
                <label>Amount (P)<input required type="number" min="0.01" max="10000000" step="0.01" inputMode="decimal" value={transactionForm.amount} onChange={event => setTransactionForm({ ...transactionForm, amount: event.target.value })} /></label>
                <label>Category<select value={transactionForm.category} onChange={event => setTransactionForm({ ...transactionForm, category: event.target.value })}>{(transactionForm.kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => <option key={category}>{category}</option>)}</select></label>
                <label>Date<input required type="date" max={todayLocal()} value={transactionForm.occurred_at} onChange={event => setTransactionForm({ ...transactionForm, occurred_at: event.target.value })} /></label>
                <label className="account-entry-wide">Description<input required minLength={2} maxLength={160} value={transactionForm.description} onChange={event => setTransactionForm({ ...transactionForm, description: event.target.value })} placeholder="e.g. Morning sales or supplier payment" /></label>
                <button className="account-primary-button account-entry-wide" disabled={busy} type="submit">{busy ? <LoaderCircle size={16} className="account-spin" /> : <Plus size={16} />} Save transaction</button>
              </form>
            </article>
            <article className="account-panel"><div className="account-panel-heading account-heading-inline"><div><p className="account-eyebrow">LEDGER</p><h2>Your activity</h2></div><span>{recentTransactions.length} recent records</span></div>{recentTransactions.length ? <div className="account-transactions-list">{recentTransactions.map(entry => <TransactionRow key={entry.id} entry={entry} onDelete={removeTransaction} disabled={busy} />)}</div> : <EmptyState title="No recorded activity yet" text="Add a manual transaction above or generate a clearly labelled simulated bank event in Settings." />}</article>
            <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">NOTIFICATIONS</p><h2>Payment updates</h2></div>{notifications.length ? <div className="account-notification-list">{notifications.map(item => <NotificationRow key={item.id} item={item} onRead={markRead} />)}</div> : <EmptyState title="Nothing to show yet" text="Simulated payment notifications will appear here." />}</article>
          </div>}

          {section === 'forecast' && <div className="account-section-stack"><section className="account-metrics-grid"><article className="account-metric-card"><span>Current recorded cash</span><strong>{money(currentBalance)}</strong><small>Opening balance plus recorded flows</small></article><article className="account-metric-card"><span>Baseline ending cash</span><strong>{money(dashboard.projected_end_balance_7d)}</strong><small>Seven-day average-based estimate</small></article><article className="account-metric-card"><span>Lean-week ending cash</span><strong>{money(dashboard.lean_week_end_balance_7d)}</strong><small>Income assumed at 55% of baseline</small></article><article className="account-metric-card"><span>Illustrative reserve</span><strong>{money(dashboard.reserve_floor)}</strong><small>Three recent-average expense days</small></article></section><article className="account-panel account-forecast-detail"><p className="account-eyebrow">SEVEN-DAY CASH OUTLOOK</p><h2>{scenarioActive ? 'Lean-week scenario is selected' : 'Baseline outlook'}</h2><p className="account-panel-copy">The baseline uses the recent recorded daily average over the observation window. The lean-week scenario models income at 55% of that baseline while leaving recorded transactions unchanged.</p><span className="account-forecast-label">SELECTED ENDING CASH</span><strong className="account-forecast-value account-forecast-light">{money(displayedForecast ?? 0)}</strong>{dashboard.shortfall_risk && <div className="account-alert warning">The baseline estimate is below the illustrative reserve. Verify upcoming payments and expenses before committing cash.</div>}<div className="account-scenario-actions"><button className="account-primary-button" type="button" disabled={busy} onClick={() => setScenarioActive(true)}>Test a lean week</button><button className="account-outline-button" type="button" onClick={() => setScenarioActive(false)}>Return to baseline</button></div><p className="account-small-note">This is a transparent demonstration calculation, not a validated prediction. Unrecorded or future transactions are unknown.</p></article></div>}

          {section === 'peloscore' && <div className="account-section-stack"><article className="account-panel account-score-detail"><div className="account-score-detail-head"><div><p className="account-eyebrow">PELOSCORE · EARLY INDICATOR</p><h2>A signal, not a verdict.</h2><p className="account-panel-copy">An illustrative indicator from records you entered. It is not a credit score, lending recommendation or guarantee.</p></div><span className="account-score-big">{dashboard.peloscore == null ? '—' : dashboard.peloscore}<small>/100</small></span></div><p className="account-score-status">{dashboard.peloscore_status}</p>{dashboard.peloscore_factors.length > 0 ? <div className="account-score-factors">{dashboard.peloscore_factors.map(factor => <div className="account-score-factor" key={factor.label}><div className="account-score-factor-top"><strong>{factor.label}</strong><span>{factor.value}</span></div><p>{factor.explanation}</p></div>)}</div> : <EmptyState title="More records are needed" text="Add at least three records across two different dates in the last 30 days before PeloScore calculates a number." />}</article></div>}

          {section === 'peloyame' && <div className="account-section-stack"><article className="account-panel account-ai-workspace"><div className="account-ai-heading"><span><img src="/assets/peloyame-mark.svg" alt="" /></span><div><p className="account-eyebrow">PELOYAME LITE</p><h2>Ask about your cash</h2><p className="account-panel-copy">Peloyame receives a minimal financial summary, not your email or raw transaction descriptions. It is read-only and cannot move money or access another account.</p></div></div><div className="account-chat-log account-chat-log-large" aria-live="polite">{messages.map(message => <div key={message.id} className={`account-chat-message ${message.role}`}><span>{message.role === 'assistant' ? 'Peloyame' : 'You'}</span><p>{message.text}</p></div>)}</div><form className="account-chat-form" onSubmit={askPeloyame}><label htmlFor="peloyame-question" className="sr-only">Ask Peloyame a question</label><textarea id="peloyame-question" maxLength={600} rows={3} value={question} onChange={event => setQuestion(event.target.value)} placeholder="e.g. What should I pay attention to this week?" disabled={busy || remainingQuestions <= 0 || !aiConsent} /><button type="submit" aria-label="Send question" disabled={busy || !question.trim() || remainingQuestions <= 0 || !aiConsent}>{busy ? <LoaderCircle size={17} className="account-spin" /> : <Send size={17} />}</button></form><div className="account-chat-footer"><span>{remainingQuestions} questions left today</span><span>Read-only · AI may be wrong</span></div><p className="account-small-note">{!aiConsent ? "Enable optional Peloyame AI processing in Settings to ask questions. Your financial context is not sent while consent is off." : "If the free-tier provider limit is reached, Peloyame will pause gracefully. Do not share passwords, bank credentials or sensitive personal identifiers."}</p></article></div>}
        </>}

        {section === 'settings' && <div className="account-section-stack"><article className="account-panel"><p className="account-eyebrow">PRIVACY CONTROLS</p><h2>Peloyame AI processing</h2><p className="account-panel-copy">When enabled, a limited financial summary and your question may be sent to Groq to generate a response. This choice is separate from your account and can be withdrawn at any time.</p><label className="account-consent-check"><input type="checkbox" checked={aiConsent} disabled={busy || !consentLoaded} onChange={async event => { const next = event.target.checked; setAiConsent(next); try { const result = await accountApi.updatePeloyameConsent(next); setAiConsent(result.peloyame_ai_consent); setNotice(next ? 'Peloyame AI processing enabled.' : 'Peloyame AI processing disabled.') } catch (err) { setAiConsent(!next); setError(err instanceof Error ? err.message : 'Could not update AI consent.') } }} /><span>Allow Peloyame to process my question and limited financial summary with Groq.</span></label><button type="button" className="account-inline-policy" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'ai' } }))}>Read the Peloyame AI disclosure</button></article>
          <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">ACCOUNT DETAILS</p><h2>Business profile</h2><p>Update your name and business details. Email changes and password recovery are not part of this hackathon slice.</p></div>{settings && <form className="account-form account-settings-form" onSubmit={saveSettings}><label>Full name<input required minLength={2} maxLength={80} value={settings.owner_name} onChange={event => setSettings({ ...settings, owner_name: event.target.value })} /></label><label>Email address<input type="email" value={settings.email} readOnly aria-readonly="true" /><span className="account-field-help">Email is read-only for this prototype.</span></label><label>Business name<input required minLength={2} maxLength={100} value={settings.business_name} onChange={event => setSettings({ ...settings, business_name: event.target.value })} /></label><label>Business type<select value={settings.business_type} onChange={event => setSettings({ ...settings, business_type: event.target.value })}>{BUSINESS_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><button className="account-primary-button" type="submit" disabled={busy}><Save size={16} /> Save changes</button></form>}</article>

          <article className="account-panel account-bank-panel"><div className="account-ai-heading"><span><img src="/assets/pelo-bank-simulation.svg" alt="" /></span><div><p className="account-eyebrow">BANK CONNECTION · DEMO</p><h2>Simulate a connected account</h2><p className="account-panel-copy">This is a product-flow simulation. It does not contact a real bank, require credentials, or receive live transaction data.</p></div></div>
            <form className="account-entry-form account-bank-connect-form" onSubmit={connectDemoBank}><label>Demo provider<select value={bankConnectForm.provider_code} onChange={event => setBankConnectForm({ ...bankConnectForm, provider_code: event.target.value as typeof bankConnectForm.provider_code })}><option value="demo_fnb">FNB Botswana (simulation only)</option><option value="demo_mobile_money">Mobile money wallet (simulation only)</option><option value="demo_savings">Savings account (simulation only)</option></select></label><label>Account label<input required minLength={2} maxLength={80} value={bankConnectForm.account_label} onChange={event => setBankConnectForm({ ...bankConnectForm, account_label: event.target.value })} /></label><button className="account-primary-button account-entry-wide" type="submit" disabled={busy}><Link2 size={16} /> Connect demo account</button></form>
            {connections.length > 0 && <div className="account-connection-list">{connections.map(connection => <div className="account-connection-row" key={connection.id}><span className="account-connection-mark"><Building2 size={18} /></span><span className="account-connection-copy"><strong>{connection.account_label}</strong><small>{connection.provider_name} · {connection.masked_account}</small></span><span className="account-simulation-pill">SIMULATED</span></div>)}</div>}
            <form className="account-entry-form account-bank-event-form" onSubmit={simulateBankEvent}><div className="account-entry-wide account-panel-subheading"><strong>Generate a test payment event</strong><span>Creates a ledger record plus an in-app notification.</span></div><label>Connected demo account<select required value={bankEventForm.connection_id} onChange={event => setBankEventForm({ ...bankEventForm, connection_id: event.target.value })}><option value="">Select a connection</option>{connections.map(connection => <option key={connection.id} value={connection.id}>{connection.account_label} · simulated</option>)}</select></label><label>Event type<select value={bankEventForm.kind} onChange={event => setBankEventForm({ ...bankEventForm, kind: event.target.value as 'income' | 'expense', category: event.target.value === 'income' ? 'Sales' : 'Supplier payment', description: event.target.value === 'income' ? 'Simulated customer payment' : 'Simulated supplier payment' })}><option value="income">Incoming money</option><option value="expense">Outgoing money</option></select></label><label>Amount (P)<input required type="number" min="0.01" max="10000000" step="0.01" value={bankEventForm.amount} onChange={event => setBankEventForm({ ...bankEventForm, amount: event.target.value })} /></label><label>Category<select value={bankEventForm.category} onChange={event => setBankEventForm({ ...bankEventForm, category: event.target.value })}>{(bankEventForm.kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => <option key={category}>{category}</option>)}</select></label><label className="account-entry-wide">Description<input required minLength={2} maxLength={160} value={bankEventForm.description} onChange={event => setBankEventForm({ ...bankEventForm, description: event.target.value })} /></label><button className="account-primary-button account-entry-wide" type="submit" disabled={busy || !connections.length}>{busy ? <LoaderCircle size={16} className="account-spin" /> : <Activity size={16} />} Simulate event</button></form>
          </article>

          <article className="account-panel"><div className="account-panel-heading"><p className="account-eyebrow">YOUR DATA</p><h2>Export or delete your account</h2><p>Export a JSON copy of your account details and transactions, or permanently remove the account and its associated data.</p></div><div className="account-settings-actions"><button className="account-outline-button" type="button" onClick={() => void exportData()} disabled={busy}><Download size={16} /> Export my data</button><button className="account-danger-button" type="button" onClick={() => void deleteAccount()} disabled={busy}><Trash2 size={16} /> Delete account permanently</button></div><p className="account-small-note">Account deletion cannot be undone. The public synthetic demo profiles are not deleted with your account.</p></article>
        </div>}

        <p className="account-data-note"><ShieldCheck size={15} /> Cash summaries include manually entered records and clearly labelled simulated events. No live bank or mobile-money provider is connected.</p>
        <footer className="account-footer"><span>© Pelo Finance · Kgottla Data Labs</span><span className="account-policy-links"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'terms' } }))}>Terms</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'privacy' } }))}>Privacy</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'security' } }))}>Data & Security</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pelo:open-privacy', { detail: { section: 'ai' } }))}>Peloyame AI</button></span><a href="/app/overview">View synthetic demo <ArrowRight size={14} /></a></footer>
      </main>
    </div>
    <nav className="account-mobile-nav" aria-label="Private account navigation">{NAV_ITEMS.map(item => { const Icon = item.Icon; return <button key={item.id} type="button" className={section === item.id ? 'active' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => { setSection(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Icon size={18} /><span>{item.label}</span>{item.id === 'settings' && unreadCount > 0 && <i>{unreadCount}</i>}</button> })}</nav>
  </div>
}

function TransactionRow({ entry, onDelete, disabled }: { entry: AccountTransaction; onDelete: (entry: AccountTransaction) => void; disabled: boolean }) {
  const isIncome = entry.kind === 'income'
  const simulated = entry.source === 'bank_simulation'
  return <div className="account-transaction-row" key={entry.id}>
    <span className={`account-transaction-icon ${entry.kind}`} aria-hidden="true">{isIncome ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span>
    <div className="account-transaction-main"><strong>{entry.description}</strong><small>{entry.category} · {new Date(entry.occurred_at).toLocaleDateString('en-BW', { day: 'numeric', month: 'short', year: 'numeric' })}</small><span className={`account-source-tag ${simulated ? 'simulated' : 'manual'}`}>{simulated ? 'Simulated bank event' : 'Manual entry'}</span></div>
    <strong className={`account-transaction-amount ${entry.kind}`}>{isIncome ? '+' : '−'}{money(entry.amount)}</strong>
    <button className="account-delete-button" type="button" aria-label={`Delete ${entry.description}`} title="Delete transaction" onClick={() => onDelete(entry)} disabled={disabled}><Trash2 size={15} /></button>
  </div>
}

function NotificationRow({ item, onRead }: { item: AccountNotification; onRead: (item: AccountNotification) => void }) {
  return <button className={`account-notification-row ${item.is_read ? 'read' : 'unread'}`} type="button" onClick={() => onRead(item)} aria-label={`${item.is_read ? 'Read' : 'Mark read'}: ${item.title}`}><span className="account-notification-icon"><Bell size={16} /></span><span className="account-notification-copy"><strong>{item.title}</strong><small>{item.body}</small><time>{new Date(item.created_at).toLocaleString('en-BW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></span>{!item.is_read && <i aria-hidden="true" />}</button>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="account-empty-state"><strong>{title}</strong><p>{text}</p></div>
}