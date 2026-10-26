import { useEffect, useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import './privacy-center.css'

type Section = 'terms' | 'privacy' | 'security' | 'ai'
const sections: { id: Section; label: string; title: string; body: string[] }[] = [
  { id: 'terms', label: 'Terms', title: 'Terms of Use', body: [
    'Pelo Finance is a hackathon-stage cash-flow planning prototype. Use it to organise information you choose to enter and explore estimates, not as a substitute for professional financial, tax or legal advice.',
    'You are responsible for entering accurate information and keeping your sign-in details private. Do not enter bank passwords, one-time passwords, payment credentials or information you are not authorised to share.',
    'Forecasts are estimates based on available records. PeloScore is illustrative and is not a credit score, lending decision, eligibility assessment or guarantee. Bank and wallet connections shown in this prototype are simulations, not real provider integrations.',
    'Do not use the prototype to make consequential lending, pricing, insurance, employment or eligibility decisions. Features may change as the project is tested. Contact: [add public project privacy/support email before launch].'
  ]},
  { id: 'privacy', label: 'Privacy', title: 'Privacy Notice', body: [
    'Pelo Finance may store your name, email address, password hash, business profile, opening balance, manually entered financial transactions, settings, simulated connection records, notifications, Peloyame usage counts and your recorded policy choices.',
    'We use account data to authenticate you, display your own financial summaries, calculate estimates, operate account features, prevent abuse and support account export or deletion. Synthetic demo profiles are separate from private account records.',
    'The app is hosted using Vercel for the web interface, Render for the API and Supabase/PostgreSQL for deployed persistence. If you enable Peloyame AI, a limited financial summary and your question are sent to Groq for response generation. These providers may process information in regions outside Botswana; exact regions and applicable transfer safeguards must be confirmed before production use.',
    'You can use account settings to export or request deletion of your account data, subject to applicable retention obligations and the limits of backups and provider logs. For access, correction, deletion or privacy questions, contact: [add public project privacy/support email before launch]. This notice is a prototype disclosure and requires legal review before public production use.'
  ]},
  { id: 'security', label: 'Data & Security', title: 'Data and Security', body: [
    'Passwords are stored as password hashes, not plaintext. Connections to the deployed web app and API use HTTPS. Database and hosting providers document encryption controls, but Pelo Finance does not claim end-to-end encryption.',
    'Private account routes use authenticated requests and server-side account ownership checks. Supabase database access is intended to be mediated by the API; direct public Data API access to app tables should remain restricted. Never place secrets in frontend code or send bank credentials to Pelo.',
    'Access controls, TLS and provider encryption reduce risk but cannot guarantee that unauthorised access or service incidents will never occur. Backups, provider logs and deletion propagation may have separate retention periods. Report a suspected security issue to: [add monitored security contact before launch].',
    'Only synthetic data should be used for public demonstrations unless the project has completed privacy, security, provider and legal review for real customer data.'
  ]},
  { id: 'ai', label: 'Peloyame AI', title: 'Peloyame AI Disclosure', body: [
    'Peloyame is optional and read-only. When enabled, the app sends your question and a minimised summary of relevant financial information to Groq to generate an answer. The summary may include balances, income and expense totals, category aggregates, runway estimates and illustrative PeloScore factors; it is designed to exclude your name, email and raw transaction descriptions.',
    'Do not include passwords, bank credentials, OTPs, government identifiers or other sensitive personal details in a question. AI responses can be incorrect and are not professional financial, tax, legal or lending advice.',
    'The account allowance is up to 20 accepted questions per user per UTC day, shared across sessions and devices. Provider rate limits may temporarily prevent answers. A question accepted by the server may count even if the provider later fails.',
    'You can turn off AI processing in account Settings. After withdrawal, the API blocks future Peloyame requests before sending their financial context to Groq. This does not retroactively erase requests already sent to an external provider; provider retention terms and logs may apply.'
  ]}
]
export function PrivacyCenter() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Section>('terms')
  useEffect(() => {
    const openPanel = (event: Event) => { const custom = event as CustomEvent<{ section?: Section }>; if (custom.detail?.section && sections.some(item => item.id === custom.detail.section)) setActive(custom.detail.section); setOpen(true) }
    const keyHandler = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('pelo:open-privacy', openPanel as EventListener)
    window.addEventListener('keydown', keyHandler)
    return () => { window.removeEventListener('pelo:open-privacy', openPanel as EventListener); window.removeEventListener('keydown', keyHandler) }
  }, [])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  if (!open) return null
  const current = sections.find(item => item.id === active) ?? sections[0]
  return <div className="privacy-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}><section className="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title"><header className="privacy-modal-header"><span className="privacy-modal-brand"><ShieldCheck size={19} /> PELO FINANCE · PRIVACY CENTRE</span><button type="button" className="privacy-modal-close" aria-label="Close privacy centre" onClick={() => setOpen(false)}><X size={20} /></button></header><div className="privacy-modal-layout"><nav className="privacy-modal-nav" aria-label="Privacy topics">{sections.map(item => <button key={item.id} type="button" className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => setActive(item.id)}>{item.label}</button>)}</nav><article className="privacy-modal-content"><p className="privacy-modal-eyebrow">INFORMATION & CHOICES</p><h2 id="privacy-modal-title">{current.title}</h2>{current.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<p className="privacy-modal-version">Policy draft · v2026-10-26-v1 · Review before production launch</p></article></div><nav className="privacy-modal-mobile-nav" aria-label="Privacy topics">{sections.map(item => <button key={item.id} type="button" className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}>{item.label}</button>)}</nav></section></div>
}
