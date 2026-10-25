import { AccountPortal } from './AccountPortal'
import { BackToTopButton } from './AppChrome'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Leaf,
  LoaderCircle,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingDown,
  Wallet,
  X,
  Zap,
  Settings2,
  CalendarDays,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from './api'
import type { Dashboard, Persona, Transaction, WeeklyPoint } from './types'

type Section = 'overview' | 'activity' | 'forecast' | 'peloscore' | 'settings'
type Theme = 'light' | 'dark'

const CURRENCY = import.meta.env.VITE_CURRENCY || 'BWP'
const LOCALE = CURRENCY === 'ZAR' ? 'en-ZA' : 'en-BW'
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { id: 'activity', label: 'Activity', icon: <Activity size={18} strokeWidth={1.8} /> },
  { id: 'forecast', label: 'Forecast', icon: <CalendarDays size={18} strokeWidth={1.8} /> },
  { id: 'peloscore', label: 'PeloScore', icon: <Gauge size={18} strokeWidth={1.8} /> },
  { id: 'settings', label: 'Settings', icon: <Settings2 size={18} strokeWidth={1.8} /> },
] as const

const ONBOARDING_STEPS = [
  { eyebrow: 'FINANCIAL CONFIDENCE, REIMAGINED', heading: 'Your income is a story.', highlight: "Let’s make it visible.", body: 'A clearer way for irregular earners to understand cash flow, prepare for lean weeks, and see the consistency behind their work.', points: ['See your rhythm', 'Prepare for lean weeks', 'Understand the signals'], cta: 'Continue' },
  { eyebrow: 'STEP 2 · SEE THE PATTERN', heading: 'A balance is only', highlight: 'one part of the story.', body: 'Explore recent activity, compare money in with money out, and see an illustrative seven-day outlook built from a fictional profile.', points: ['Explore synthetic activity', 'Read the forecast assumptions', 'Stress-test a quieter week'], cta: 'Next' },
  { eyebrow: 'STEP 3 · READY TO EXPLORE', heading: 'A safer space to', highlight: 'try the idea.', body: 'This public demo uses synthetic profiles and transactions. No real bank account is connected, and PeloScore is not a validated credit score or lending decision.', points: ['No bank credentials needed', 'All financial data is synthetic', 'PeloScore is illustrative only'], cta: 'Explore the demo' },
] as const

const SECTION_COPY: Record<Section, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: 'YOUR MONEY, IN CONTEXT',
    title: 'Make your money story visible.',
    description: 'See the rhythm behind irregular income, prepare for lean weeks, and decide what to do next.',
  },
  activity: {
    eyebrow: 'THE EVERYDAY LEDGER',
    title: 'Money in motion.',
    description: 'Review the recent income and outgoing activity in this synthetic demo profile.',
  },
  forecast: {
    eyebrow: 'LOOKING A LITTLE AHEAD',
    title: 'Plan for the week ahead.',
    description: 'Explore an illustrative seven-day outlook and stress-test a quieter week without changing the demo ledger.',
  },
  peloscore: {
    eyebrow: 'A CLEARER FINANCIAL SIGNAL',
    title: 'Consistency deserves context.',
    description: 'PeloScore is an early, explainable demonstration of financial patterns, not a validated credit score.',
  },
  settings: {
    eyebrow: 'YOUR DEMO SPACE',
    title: 'Make this space yours.',
    description: 'Adjust appearance and reset the current synthetic scenario. No real financial account is connected.',
  },
}

function isSection(value: string | undefined): value is Section {
  return NAV_ITEMS.some((item) => item.id === value)
}

function sectionFromPath(path: string): Section {
  const parts = path.split('/').filter(Boolean)
  const part = parts.length ? parts[parts.length - 1] : undefined
  return isSection(part) ? part : 'overview'
}

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem('pelo-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Continue with the device preference if storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const money = (value: number) => new Intl.NumberFormat(LOCALE, {
  style: 'currency', currency: CURRENCY, maximumFractionDigits: 0,
}).format(value)
const preciseMoney = (value: number) => new Intl.NumberFormat(LOCALE, {
  style: 'currency', currency: CURRENCY, maximumFractionDigits: 2,
}).format(value)

function DemoApp() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [showWelcome, setShowWelcome] = useState(() => window.location.pathname.startsWith('/app/'))
  const [isLanding, setIsLanding] = useState(() => window.location.pathname === '/')
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [section, setSection] = useState<Section>(() => sectionFromPath(window.location.pathname))
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const dashboardRequestId = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname
      if (path === '/') {
        setIsLanding(true)
        setSection('overview')
        return
      }
      if (!path.startsWith('/app/')) {
        window.history.replaceState({}, '', '/app/overview')
        setSection('overview')
        setIsLanding(false)
        return
      }
      setSection(sectionFromPath(path))
      setIsLanding(false)
    }
    syncRoute()
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => {
    let active = true
    api.personas()
      .then((items) => {
        if (!active) return
        setPersonas(items)
        setSelectedId((current) => items.some((item) => item.id === current) ? current : (items[0]?.id ?? ''))
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load demo profiles.')
      })
      .finally(() => { if (active) setLoadingPeople(false) })
    return () => { active = false }
  }, [])

  const loadDashboard = useCallback(async (id: string) => {
    if (!id) return
    const requestId = ++dashboardRequestId.current
    setLoadingDashboard(true)
    setError('')
    try {
      const result = await api.dashboard(id)
      if (dashboardRequestId.current === requestId) setDashboard(result)
    } catch (err) {
      if (dashboardRequestId.current === requestId) setError(err instanceof Error ? err.message : 'Could not load the dashboard.')
    } finally {
      if (dashboardRequestId.current === requestId) setLoadingDashboard(false)
    }
  }, [])

  useEffect(() => {
    setDashboard(null)
    void loadDashboard(selectedId)
  }, [selectedId, loadDashboard])

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
  const score = dashboard ? getPeloScoreDemo(dashboard) : 0
  const activeOnboardingStep = ONBOARDING_STEPS[onboardingStep]

  const navigate = (next: Section) => {
    if (isLanding) {
      setShowWelcome(true)
      setOnboardingStep(0)
    }
    setIsLanding(false)
    setSection(next)
    setMobileDrawerOpen(false)
    const nextPath = `/app/${next}`
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const changeTheme = (next: Theme) => {
    setTheme(next)
    try { window.localStorage.setItem('pelo-theme', next) } catch { /* Theme still applies for this session. */ }
  }

  const personaPicker = (
    <div className="persona-control">
      <span className="field-label">EXPLORING A SYNTHETIC PROFILE</span>
      <Listbox value={selectedId} onChange={setSelectedId} disabled={loadingPeople || personas.length === 0}>
        <div className="listbox-wrap">
          <ListboxButton className="persona-select">
            <span className="persona-avatar">{currentPersona?.name.slice(0, 1) ?? '—'}</span>
            <span className="persona-copy">
              <span className="persona-name">{currentPersona?.name ?? (loadingPeople ? 'Loading profile…' : 'Choose a profile')}</span>
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
  )

  if (isLanding) {
    return <LandingPage theme={theme} changeTheme={changeTheme} onExplore={() => navigate('overview')} onAccount={() => window.location.assign('/account')} />
  }

  return (
    <div className="app-frame">
      <aside className={`desktop-sidebar ${sidebarExpanded ? 'sidebar-expanded' : ''}`} aria-label="Primary navigation">
        <a className="sidebar-brand" href="/app/overview" onClick={(event) => { event.preventDefault(); navigate('overview') }} aria-label="Pelo Finance overview">
          <img src="/assets/pelo-mark.svg" alt="" className="sidebar-mark" />
          <span className="sidebar-brand-name">Pelo Finance</span>
        </a>
        <div className="sidebar-section-label">YOUR SPACE</div>
        <nav className="sidebar-links">
          {NAV_ITEMS.map((item) => <NavItem key={item.id} item={item} active={section === item.id} expanded={sidebarExpanded} onClick={() => navigate(item.id)} />)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="sidebar-note-icon"><ShieldCheck size={16} /></span><span className="sidebar-note-copy"><strong>Demo environment</strong><small>Synthetic data only</small></span></div>
          <button className="sidebar-expand-button" type="button" onClick={() => setSidebarExpanded((value) => !value)} aria-expanded={sidebarExpanded} aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}>
            <span className={`menu-glyph ${sidebarExpanded ? 'is-open' : ''}`} aria-hidden="true"><i /><i /><i /></span>
            <span className="sidebar-expand-label">{sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}</span>
          </button>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="icon-button menu-toggle" type="button" aria-label={mobileDrawerOpen ? 'Close navigation' : 'Open navigation'} aria-haspopup="dialog" aria-expanded={mobileDrawerOpen} onClick={() => setMobileDrawerOpen((open) => !open)}>
              <span className={`menu-glyph ${mobileDrawerOpen ? 'is-open' : ''}`} aria-hidden="true"><i /><i /><i /></span>
            </button>
            <a className="mobile-brand" href="/app/overview" onClick={(event) => { event.preventDefault(); navigate('overview') }} aria-label="Pelo Finance overview">
              <img className="brand-mark-image" src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span>
            </a>
            <span className="topbar-context">{NAV_ITEMS.find((item) => item.id === section)?.label ?? 'Overview'}</span>
          </div>
          <div className="topbar-right">
            <p className="demo-note">Demo uses synthetic data</p>
            <button className="topbar-home-button" type="button" onClick={() => window.location.assign('/')}><ArrowLeft size={15} /><span>Back to home</span></button>
            <button className="theme-toggle" type="button" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="icon-button help-button" type="button" title="About Pelo Finance demo" aria-haspopup="dialog" aria-expanded={aboutOpen} onClick={() => setAboutOpen(true)}>
              <CircleHelp size={18} /><span>About</span>
            </button>
          </div>
        </header>

        <main id="main-content" className="workspace-main" tabIndex={-1}>
          <div key={section} className="route-view">
            <section className={`page-hero hero-${section}`}>
              <div className="page-hero-copy">
                <p className="eyebrow hero-eyebrow"><span className="eyebrow-line" />{SECTION_COPY[section].eyebrow}</p>
                <h1>{SECTION_COPY[section].title}</h1>
                <p className="welcome-copy">{SECTION_COPY[section].description}</p>
              </div>
              {section !== 'settings' && <div className="hero-profile">{personaPicker}</div>}
              {section === 'overview' && <div className="hero-decoration" aria-hidden="true"><img src="/assets/pelo-glass-p.svg" alt="" /></div>}
            </section>

            {error && <div className="error-banner" role="alert">
              <CircleHelp size={18} />
              <div><strong>The demo needs a connection.</strong><span>{error} Check that the FastAPI service is running, then retry.</span></div>
              <button type="button" className="text-button" onClick={() => void loadDashboard(selectedId)}>Retry</button>
            </div>}

            {loadingDashboard && !dashboard ? <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>Reading the income rhythm…</span></div> : dashboard ? <>
              {section === 'overview' && <OverviewPage dashboard={dashboard} chartData={chartData} score={score} scenarioActive={scenarioActive} acting={acting} loadingDashboard={loadingDashboard} runScenario={runScenario} resetScenario={resetScenario} />}
              {section === 'activity' && <ActivityPage transactions={dashboard.recent_transactions} />}
              {section === 'forecast' && <ForecastPage dashboard={dashboard} chartData={chartData} scenarioActive={scenarioActive} acting={acting} loadingDashboard={loadingDashboard} runScenario={runScenario} resetScenario={resetScenario} />}
              {section === 'peloscore' && <PeloScorePage dashboard={dashboard} score={score} />}
              {section === 'settings' && <SettingsPage theme={theme} changeTheme={changeTheme} selectedPersona={currentPersona} resetScenario={resetScenario} scenarioActive={scenarioActive} acting={acting} />}
            </> : !loadingPeople && !error ? <div className="empty-state">No synthetic profile was found. Check that the API has seeded its demo data.</div> : null}

            <footer className="page-footer"><span><ShieldCheck size={15} /> Built to make financial consistency visible.</span><span>Demo currency: {CURRENCY} · Synthetic data only.</span></footer>
          </div>
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.filter((item) => item.id !== 'settings').map((item) => <button key={item.id} type="button" className={`mobile-nav-item ${section === item.id ? 'active' : ''}`} aria-current={section === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
          <span className="mobile-nav-icon">{item.icon}</span><span>{item.label}</span>
        </button>)}
      </nav>

      <Transition show={mobileDrawerOpen} as={Fragment}>
        <Dialog onClose={setMobileDrawerOpen} className="mobile-drawer-root">
          <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="drawer-backdrop" aria-hidden="true" />
          </TransitionChild>
          <div className="drawer-stage">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="ease-in duration-150" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <DialogPanel className="mobile-drawer">
                <div className="drawer-header"><a className="sidebar-brand drawer-brand" href="/app/overview" onClick={(event) => { event.preventDefault(); navigate('overview') }}><img src="/assets/pelo-mark.svg" alt="" className="sidebar-mark" /><span className="sidebar-brand-name">Pelo Finance</span></a><button className="theme-toggle drawer-close" type="button" onClick={() => setMobileDrawerOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
                <DialogTitle className="drawer-title">Navigate</DialogTitle>
                <nav className="sidebar-links drawer-links" aria-label="Navigation menu">
                  {NAV_ITEMS.map((item) => <NavItem key={item.id} item={item} active={section === item.id} expanded onClick={() => navigate(item.id)} />)}
                </nav>
                <div className="drawer-footer"><p>Demo uses synthetic data. No bank account is connected.</p><button className="drawer-theme-button" type="button" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}{theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}</button></div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={aboutOpen} as={Fragment}>
        <Dialog onClose={setAboutOpen} className="about-modal-root">
          <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="about-modal-backdrop" /></TransitionChild>
          <div className="about-modal-stage">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-3 scale-[.98]" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-2 scale-[.99]">
              <DialogPanel className="about-modal-panel">
                <div className="about-modal-mark"><img src="/assets/pelo-mark.svg" alt="" /></div>
                <DialogTitle className="about-modal-title">A clearer view, still a prototype.</DialogTitle>
                <p>Pelo Finance is a hackathon concept for understanding irregular income, preparing for lean weeks, and exploring cash-flow patterns.</p>
                <div className="about-modal-disclosure"><ShieldCheck size={17} /><span>This public demo uses synthetic profiles and transactions. No bank account is connected.</span></div>
                <p className="about-modal-fineprint">PeloScore is an illustrative, unvalidated demo signal. It is not a credit score, creditworthiness assessment, or lending decision.</p>
                <button className="scenario-button" type="button" onClick={() => setAboutOpen(false)}>Continue exploring <ArrowRight size={16} /></button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {showWelcome && loadingPeople && <div className="brand-splash" role="status" aria-label="Loading Pelo Finance" aria-live="polite" aria-busy="true">
        <div className="glass-p-wrap"><img src="/assets/pelo-glass-p.svg" alt="" /></div><span className="splash-wordmark">Pelo Finance</span><span className="splash-caption">MAKING YOUR MONEY STORY VISIBLE</span><span className="splash-loader" />
      </div>}

      <Transition appear show={showWelcome && !loadingPeople} as={Fragment}>
        <Dialog onClose={() => setShowWelcome(false)} className="onboarding-root" aria-label="Welcome to Pelo Finance">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="onboarding-backdrop" /></TransitionChild>
          <div className="onboarding-stage">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 scale-[.98]" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-2 scale-[.99]">
              <DialogPanel className="welcome-panel">
                <div className="welcome-orb orb-a" /><div className="welcome-orb orb-b" />
                <div className="welcome-content onboarding-content" key={onboardingStep} aria-live="polite">
                  <div className="glass-p-wrap welcome-p"><img src="/assets/pelo-glass-p.svg" alt="" /></div>
                  <img className="welcome-wordmark" src="/assets/pelo-wordmark.svg" alt="Pelo Finance" />
                  <p className="welcome-eyebrow">{activeOnboardingStep.eyebrow}</p>
                  <DialogTitle as="h2" id="onboarding-title">{activeOnboardingStep.heading}<br /><span>{activeOnboardingStep.highlight}</span></DialogTitle>
                  <p className="welcome-body">{activeOnboardingStep.body}</p>
                  <div className="welcome-points">{activeOnboardingStep.points.map((point) => <span key={point}><i /> {point}</span>)}</div>
                  <div className="onboarding-progress" role="group" aria-label={`Step ${onboardingStep + 1} of ${ONBOARDING_STEPS.length}`}>
                    <span className="onboarding-step-label">STEP {onboardingStep + 1} OF {ONBOARDING_STEPS.length}</span>
                    <div className="onboarding-progress-bars" aria-hidden="true">{ONBOARDING_STEPS.map((item, index) => <span key={item.eyebrow} className={index <= onboardingStep ? 'complete' : ''} />)}</div>
                  </div>
                  <div className="onboarding-actions">
                    {onboardingStep > 0 && <button className="onboarding-back" type="button" onClick={() => setOnboardingStep((step) => Math.max(0, step - 1))}><ChevronLeft size={16} /> Back</button>}
                    <button className="welcome-cta" type="button" onClick={() => onboardingStep < ONBOARDING_STEPS.length - 1 ? setOnboardingStep((step) => Math.min(ONBOARDING_STEPS.length - 1, step + 1)) : setShowWelcome(false)}>{activeOnboardingStep.cta} <ArrowRight size={17} /></button>
                  </div>
                  <p className="welcome-footnote"><ShieldCheck size={13} /> Demo environment. All financial data is synthetic.</p>
                </div>
                <div className="welcome-side-note">A BETTER SIGNAL FOR EVERYDAY EARNERS <span>PELO FINANCE</span></div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

type NavItemConfig = typeof NAV_ITEMS[number]
function LandingPage({ theme, changeTheme, onExplore, onAccount }: { theme: Theme; changeTheme: (next: Theme) => void; onExplore: () => void; onAccount: () => void }) {
  return <div className="landing-page">
    <header className="landing-nav">
      <a className="landing-brand" href="/" aria-label="Pelo Finance home"><img src="/assets/pelo-mark.svg" alt="" /><span>Pelo Finance</span></a>
      <div className="landing-nav-actions">
        <span className="landing-demo-note">MADE FOR IRREGULAR INCOME</span>
        <button className="landing-theme-toggle" type="button" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
        <button className="landing-nav-account-cta" type="button" onClick={onAccount}>Create account</button><button className="landing-nav-cta" type="button" onClick={onExplore}>Explore the demo <ArrowRight size={16} /></button>
      </div>
    </header>
    <main>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span /> A CLEARER VIEW OF YOUR MONEY</p>
          <h1>Your income has a rhythm. <em>Make it visible.</em></h1>
          <p className="landing-lede">Pelo Finance helps people with irregular income understand their cash-flow patterns, prepare for quieter weeks, and see the consistency behind the work they do.</p>
          <div className="landing-hero-actions"><button className="landing-primary-cta" type="button" onClick={onExplore}>Explore the demo <ArrowRight size={17} /></button><button className="landing-secondary-cta" type="button" onClick={onAccount}>Create your account</button><span className="landing-reassurance"><ShieldCheck size={15} /> Synthetic profiles. No bank connection.</span></div>
          <div className="landing-proof-line"><span>SEE THE PATTERN</span><i /> <span>PREPARE FOR LEAN WEEKS</span><i /> <span>UNDERSTAND THE SIGNAL</span></div>
        </div>
        <div className="landing-art" aria-hidden="true"><div className="landing-art-ring ring-one" /><div className="landing-art-ring ring-two" /><img className="landing-glass-p" src="/assets/pelo-glass-p.svg" alt="" /><div className="landing-art-caption">POCKET-SIZED CLARITY<br />FOR REAL-LIFE RHYTHMS</div><div className="landing-art-index">PF / 01</div></div>
      </section>
      <section className="landing-value-grid" aria-label="What Pelo Finance helps you do">
        <article><span className="landing-value-number">01</span><div><h2>See your rhythm.</h2><p>Bring income, outgoings and the balance between them into one understandable view.</p></div><Activity size={20} /></article>
        <article><span className="landing-value-number">02</span><div><h2>Prepare for quieter weeks.</h2><p>Explore a seven-day outlook and test a lean-week scenario before you need to react.</p></div><TrendingDown size={20} /></article>
        <article><span className="landing-value-number">03</span><div><h2>Put signals in context.</h2><p>Explore PeloScore as an illustrative concept, with its assumptions and limits made clear.</p></div><Gauge size={20} /></article>
      </section>
    </main>
    <footer className="landing-footer"><span>PELO FINANCE · MAKE YOUR MONEY STORY VISIBLE</span><p>This public prototype uses synthetic financial data. PeloScore is illustrative and is not a validated credit score or lending decision.</p></footer>
  </div>
}

function NavItem({ item, active, expanded, onClick }: { item: NavItemConfig; active: boolean; expanded: boolean; onClick: () => void }) {
  return <button type="button" className={`sidebar-link ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined} title={expanded ? undefined : item.label}>
    <span className="sidebar-link-icon">{item.icon}</span><span className="sidebar-link-label">{item.label}</span>{active && <span className="nav-active-mark" aria-hidden="true" />}
  </button>
}

function OverviewPage({ dashboard, chartData, score, scenarioActive, acting, loadingDashboard, runScenario, resetScenario }: { dashboard: Dashboard; chartData: WeeklyPoint[]; score: number; scenarioActive: boolean; acting: boolean; loadingDashboard: boolean; runScenario: () => Promise<void>; resetScenario: () => Promise<void> }) {
  return <>
    <section className="metrics-grid" aria-label="Financial overview">
      <MetricCard label="Available balance" value={money(dashboard.balance)} helper="Based on the demo feed" icon={<Wallet size={18} />} trend="neutral" />
      <MetricCard label="Income · next 7 days" value={money(dashboard.forecast.projected_income_7d)} helper="Model estimate, not a guarantee" icon={<ArrowDownRight size={18} />} trend="positive" />
      <MetricCard label="Outgoings · next 7 days" value={money(dashboard.forecast.projected_expenses_7d)} helper="Expected cash leaving" icon={<ArrowUpRight size={18} />} trend="neutral" />
      <MetricCard label="Illustrative cushion" value={money(dashboard.forecast.buffer_estimate)} helper="Not a loan or credit offer" icon={<ShieldCheck size={18} />} trend={dashboard.forecast.buffer_estimate > 0 ? 'positive' : 'warning'} />
    </section>
    <PeloScoreSummary dashboard={dashboard} score={score} />
    <section className="content-grid">
      <CashFlowChart data={chartData} />
      <ForecastCard dashboard={dashboard} scenarioActive={scenarioActive} acting={acting} loadingDashboard={loadingDashboard} runScenario={runScenario} resetScenario={resetScenario} />
    </section>
    <section className="lower-grid">
      <InsightsPanel dashboard={dashboard} />
      <TransactionsPanel transactions={dashboard.recent_transactions} />
    </section>
  </>
}

function ActivityPage({ transactions }: { transactions: Transaction[] }) {
  return <section className="panel activity-page panel-pad">
    <div className="panel-heading"><div><p className="eyebrow">RECENT TRANSACTIONS</p><h2>Your activity</h2><p className="panel-subtitle">Demo transactions only. This page does not modify the ledger.</p></div><span className="mini-icon"><Wallet size={18} /></span></div>
    {transactions.length ? <div className="transaction-list activity-list">{transactions.map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}</div> : <EmptyPanel title="No activity yet" body="This profile does not have recent demo transactions." />}
    <p className="model-note"><ShieldCheck size={15} /><span>All entries shown here are synthetic. Real account ingestion and transaction management are not enabled in this demo.</span></p>
  </section>
}

function ForecastPage({ dashboard, chartData, scenarioActive, acting, loadingDashboard, runScenario, resetScenario }: { dashboard: Dashboard; chartData: WeeklyPoint[]; scenarioActive: boolean; acting: boolean; loadingDashboard: boolean; runScenario: () => Promise<void>; resetScenario: () => Promise<void> }) {
  return <>
    <section className="metrics-grid" aria-label="Seven-day forecast">
      <MetricCard label="Expected income" value={money(dashboard.forecast.projected_income_7d)} helper="Next seven days · estimate" icon={<ArrowDownRight size={18} />} trend="positive" />
      <MetricCard label="Expected outgoings" value={money(dashboard.forecast.projected_expenses_7d)} helper="Next seven days · estimate" icon={<ArrowUpRight size={18} />} trend="neutral" />
      <MetricCard label="Projected close" value={money(dashboard.forecast.projected_end_balance)} helper="Modelled ending balance" icon={<CalendarDays size={18} />} trend={dashboard.forecast.projected_end_balance < dashboard.forecast.reserve_floor ? 'warning' : 'positive'} />
      <MetricCard label="Reserve floor" value={money(dashboard.forecast.reserve_floor)} helper="Reference level in the demo" icon={<ShieldCheck size={18} />} trend="neutral" />
    </section>
    <section className="content-grid forecast-content-grid"><CashFlowChart data={chartData} /><ForecastCard dashboard={dashboard} scenarioActive={scenarioActive} acting={acting} loadingDashboard={loadingDashboard} runScenario={runScenario} resetScenario={resetScenario} /></section>
    <section className="panel panel-pad forecast-table-panel"><div className="panel-heading"><div><p className="eyebrow">DAY BY DAY</p><h2>Seven-day outlook</h2><p className="panel-subtitle">These values are model estimates based on synthetic demo data.</p></div><span className="mini-icon"><Clock3 size={18} /></span></div>
      <div className="forecast-day-list">{dashboard.forecast.days.map((day) => <div className="forecast-day-row" key={day.date}><div><strong>{day.label}</strong><small>{day.date}</small></div><span className="forecast-day-in">+{money(day.income)}</span><span className="forecast-day-out">−{money(day.expenses)}</span><strong className={day.closing_balance < dashboard.forecast.reserve_floor ? 'text-risk' : ''}>{money(day.closing_balance)}</strong></div>)}</div>
    </section>
  </>
}

function PeloScorePage({ dashboard, score }: { dashboard: Dashboard; score: number }) {
  return <>
    <PeloScoreSummary dashboard={dashboard} score={score} expanded />
    <section className="score-explainer-grid">
      <article className="panel panel-pad"><div className="panel-heading"><div><p className="eyebrow">WHAT IT LOOKS AT</p><h2>Read the signals, not just the number.</h2></div><span className="mini-icon"><Gauge size={18} /></span></div>
        <div className="signal-list">
          <SignalRow icon={<Wallet size={17} />} title="Cash-flow resilience" body="Compares the projected closing balance with expected outgoings and the demo reserve level." />
          <SignalRow icon={<Activity size={17} />} title="Recent income activity" body="Uses the profile's last seven days of synthetic income activity as a simple activity signal." />
          <SignalRow icon={<ShieldCheck size={17} />} title="Evidence quality" body="The current feed is synthetic and has not been validated against real-world outcomes." />
        </div>
      </article>
      <article className="panel panel-pad score-caution-panel"><span className="caution-icon"><CircleHelp size={20} /></span><p className="eyebrow">IMPORTANT CONTEXT</p><h2>A prototype signal, not a verdict.</h2><p>PeloScore is not a credit score, creditworthiness assessment, lending decision, or guarantee of future cash position. The number is generated by a demonstration heuristic in the frontend and has not been statistically validated.</p><p>Do not use it to make real lending, pricing, or eligibility decisions. Any future production score requires a documented methodology, consented representative data, temporal validation, calibration, and fairness testing.</p></article>
    </section>
  </>
}

function SettingsPage({ theme, changeTheme, selectedPersona, resetScenario, scenarioActive, acting }: { theme: Theme; changeTheme: (theme: Theme) => void; selectedPersona: Persona | null; resetScenario: () => Promise<void>; scenarioActive: boolean; acting: boolean }) {
  return <section className="settings-grid">
    <article className="panel panel-pad settings-panel"><div className="panel-heading"><div><p className="eyebrow">APPEARANCE</p><h2>Choose your theme</h2><p className="panel-subtitle">We start with your device preference and remember your selection.</p></div><span className="mini-icon"><Sun size={18} /></span></div>
      <div className="theme-options" role="group" aria-label="Theme preference">
        <button type="button" className={`theme-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => changeTheme('light')} aria-pressed={theme === 'light'}><span className="theme-preview theme-preview-light"><i /><i /><i /></span><span><strong>Light</strong><small>Cream surfaces, terracotta accents</small></span>{theme === 'light' && <Check size={18} />}</button>
        <button type="button" className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => changeTheme('dark')} aria-pressed={theme === 'dark'}><span className="theme-preview theme-preview-dark"><i /><i /><i /></span><span><strong>Dark</strong><small>Charcoal surfaces, warm accents</small></span>{theme === 'dark' && <Check size={18} />}</button>
      </div>
    </article>
    <article className="panel panel-pad settings-panel"><div className="panel-heading"><div><p className="eyebrow">CURRENT DEMO PROFILE</p><h2>{selectedPersona?.name ?? 'No profile selected'}</h2><p className="panel-subtitle">{selectedPersona?.occupation ?? 'A synthetic profile'} · Demo data only</p></div><span className="mini-icon"><ShieldCheck size={18} /></span></div>
      <p className="settings-copy">The current prototype uses seeded synthetic records. It does not connect to a real bank, store bank credentials, or create a personal financial account.</p>
      <button className="scenario-button secondary-button" type="button" disabled={acting || !scenarioActive} onClick={() => void resetScenario()}>{acting ? <LoaderCircle size={17} className="spin" /> : <RefreshCw size={17} />}{acting ? 'Resetting…' : scenarioActive ? 'Reset lean-week scenario' : 'Baseline scenario is active'}</button>
    </article>
    <article className="panel panel-pad privacy-panel"><div className="panel-heading"><div><p className="eyebrow">PRIVACY BOUNDARY</p><h2>No real account is connected.</h2></div><span className="mini-icon"><ShieldCheck size={18} /></span></div><p className="settings-copy">This public demo is for exploring the product concept using synthetic data. Do not enter personal financial details, bank passwords, account numbers, or one-time passcodes.</p></article>
  </section>
}

function PeloScoreSummary({ dashboard, score, expanded = false }: { dashboard: Dashboard; score: number; expanded?: boolean }) {
  return <section className={`peloscore-strip ${expanded ? 'peloscore-expanded' : ''}`} aria-label="PeloScore illustrative demo signal">
    <div className="score-main"><div className="score-kicker"><span className="score-symbol"><Gauge size={23} /></span><div><p className="eyebrow">INTRODUCING</p><h2>PeloScore</h2></div></div><p className="score-description">An explainable demonstration signal for people whose income does not always arrive on a schedule.</p><span className="score-disclaimer"><ShieldCheck size={14} /> Illustrative only · not a credit score</span></div>
    <div className="score-value-wrap"><span className="score-label">DEMO SIGNAL</span><div className="score-value">{score}<small>/100</small></div><div className="score-meter" role="meter" aria-label="Illustrative PeloScore demo signal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><span style={{ width: `${score}%` }} /></div><span className="score-confidence">Synthetic data · unvalidated</span></div>
    <div className="score-factors"><ScoreFactor label="Cash-flow resilience" value={dashboard.forecast.shortfall_risk ? 'Needs attention' : 'Holding steady'} tone={dashboard.forecast.shortfall_risk ? 'warning' : 'positive'} /><ScoreFactor label="Income pattern" value={dashboard.income_last_7d > 0 ? 'Activity observed' : 'Limited evidence'} tone="neutral" /><ScoreFactor label="Evidence quality" value="Synthetic feed" tone="neutral" /></div>
  </section>
}

function CashFlowChart({ data }: { data: WeeklyPoint[] }) {
  return <article className="panel rhythm-panel"><div className="panel-heading"><div><p className="eyebrow">THE BIGGER PICTURE</p><h2>Your income rhythm</h2><p className="panel-subtitle">Weekly money in versus money out</p></div><span className="mini-icon"><Activity size={18} /></span></div>
    <div className="chart-legend"><span><i className="legend-dot income-dot" /> Income</span><span><i className="legend-dot expense-dot" /> Outgoings</span></div>
    <div className="chart-area" aria-label="Weekly income and outgoings chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
      <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--positive)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--positive)" stopOpacity={0.01} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--terracotta)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--terracotta)" stopOpacity={0.01} /></linearGradient></defs>
      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="week_label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={9} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`} />
      <Tooltip formatter={(value) => preciseMoney(Number(value))} labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} contentStyle={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-raised)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-soft)' }} />
      <Area type="monotone" dataKey="income" name="Income" stroke="var(--positive)" strokeWidth={2.5} fill="url(#incomeFill)" activeDot={{ r: 4, strokeWidth: 0 }} /><Area type="monotone" dataKey="expenses" name="Outgoings" stroke="var(--terracotta)" strokeWidth={2.2} fill="url(#expenseFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
    </AreaChart></ResponsiveContainer></div>
    <div className="chart-footer"><span><Clock3 size={14} /> Last 8 weeks of simulated activity</span><span className="synthetic-caption">Illustrative only</span></div>
  </article>
}

function ForecastCard({ dashboard, scenarioActive, acting, loadingDashboard, runScenario, resetScenario }: { dashboard: Dashboard; scenarioActive: boolean; acting: boolean; loadingDashboard: boolean; runScenario: () => Promise<void>; resetScenario: () => Promise<void> }) {
  return <article className={`panel forecast-panel ${scenarioActive ? 'scenario-on' : ''}`}><div className="forecast-topline"><span className="forecast-symbol"><Sparkles size={18} /></span><span className="quality-text">{dashboard.forecast.signal_quality} signal</span></div>
    <p className="eyebrow">LOOKING AHEAD</p><h2>{scenarioActive ? 'A lean week, modelled.' : 'What might next week bring?'}</h2><p className="forecast-summary">{scenarioActive ? 'Incoming payments are reduced by 45% in this scenario. Your demo transaction history remains unchanged.' : 'Recent synthetic patterns suggest this cash position for the next seven days.'}</p>
    <div className="forecast-balance-label">PROJECTED ENDING BALANCE</div><div className={`forecast-balance ${dashboard.forecast.projected_end_balance < dashboard.forecast.reserve_floor ? 'balance-risk' : ''}`}>{money(dashboard.forecast.projected_end_balance)}</div>
    <div className="forecast-breakdown"><div><span><i className="legend-dot income-dot" /> Income expected</span><strong>{money(dashboard.forecast.projected_income_7d)}</strong></div><div><span><i className="legend-dot expense-dot" /> Outgoings expected</span><strong>{money(dashboard.forecast.projected_expenses_7d)}</strong></div><div><span><ShieldCheck size={14} /> Protected reserve</span><strong>{money(dashboard.forecast.reserve_floor)}</strong></div></div>
    <button className={`scenario-button ${scenarioActive ? 'reset-button' : ''}`} type="button" onClick={scenarioActive ? () => void resetScenario() : () => void runScenario()} disabled={acting || loadingDashboard}>{acting ? <LoaderCircle size={17} className="spin" /> : scenarioActive ? <RefreshCw size={17} /> : <Zap size={17} />}{acting ? 'Updating forecast…' : scenarioActive ? 'Reset to baseline' : 'Simulate a lean week'}</button>
    <p className="scenario-footnote">{scenarioActive ? 'Stress test active · 45% lower inflows' : 'One click · synthetic data · no bank account needed'}</p>
  </article>
}

function InsightsPanel({ dashboard }: { dashboard: Dashboard }) {
  return <article className="panel insight-panel"><div className="panel-heading compact-heading"><div><p className="eyebrow">YOUR NEXT MOVE</p><h2>A little clarity goes a long way.</h2></div><span className="mini-icon mint-icon"><Leaf size={18} /></span></div>
    {dashboard.forecast.shortfall_risk && <div className="reserve-alert"><TrendingDown size={17} /><span>The cautious forecast falls below the protected reserve shown in this demo.</span></div>}
    <div className="insights-list">{dashboard.insights.map((insight, index) => <div className="insight-row" key={`${insight.title}-${index}`}><span className={`insight-mark ${insight.tone === 'warning' ? 'mark-warning' : insight.tone === 'positive' ? 'mark-positive' : ''}`}>{insight.tone === 'warning' ? <TrendingDown size={17} /> : <Leaf size={17} />}</span><div><strong>{insight.title}</strong><p>{insight.body}</p></div></div>)}</div>
    <div className="model-note"><CreditCard size={15} /><span>{dashboard.forecast.model}. Scenario output is illustrative and is not a credit decision.</span></div>
  </article>
}

function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  return <article className="panel transactions-panel"><div className="panel-heading compact-heading"><div><p className="eyebrow">FROM THE FEED</p><h2>Recent activity</h2></div><span className="mini-icon"><Wallet size={18} /></span></div>
    <div className="transaction-list">{transactions.slice(0, 5).map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}</div>
    <div className="feed-footer"><span className="feed-status"><span className="status-dot" /> Synthetic transaction feed</span><span>{transactions.length} latest entries</span></div>
  </article>
}

function MetricCard({ label, value, helper, icon, trend }: { label: string; value: string; helper: string; icon: ReactNode; trend: 'neutral' | 'positive' | 'warning' }) {
  return <article className="metric-card"><div className={`metric-icon metric-${trend}`}>{icon}</div><p className="metric-label">{label}</p><div className="metric-value">{value}</div><p className="metric-helper">{helper}</p></article>
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const incoming = transaction.kind === 'income'
  const dateLabel = new Date(transaction.occurred_at).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
  return <div className="transaction-row"><span className={`transaction-icon ${incoming ? 'transaction-income' : 'transaction-expense'}`}>{incoming ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div className="transaction-main"><strong>{transaction.description}</strong><span>{transaction.category} · {dateLabel}</span></div><div className={`transaction-amount ${incoming ? 'amount-in' : 'amount-out'}`}>{incoming ? '+' : '−'}{money(transaction.amount)}</div></div>
}

function getPeloScoreDemo(dashboard: Dashboard): number {
  // Temporary, illustrative demo heuristic. This is not a validated financial or credit score.
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

function SignalRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="signal-row"><span className="signal-icon">{icon}</span><div><strong>{title}</strong><p>{body}</p></div></div>
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return <div className="empty-panel"><span><Activity size={19} /></span><strong>{title}</strong><p>{body}</p></div>
}


// The authenticated account experience is separated from the synthetic demo route.
// /account uses real user-owned records; / and /app/* remain the public demo.
export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const syncPath = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  if (pathname === '/account' || pathname.startsWith('/account/')) return <><AccountPortal /><BackToTopButton /></>
  return <><DemoApp /><BackToTopButton /></>
}
