# Pelo Finance — Lean Business Canvas

**PeloScore | Kgotla Data Labs | Botswana-first financial clarity for owner-operated businesses**  
**Version:** Hackathon working version | 25 October 2026

> **Purpose and evidence standard:** This canvas is a business hypothesis for early validation. Customer behaviour, problem severity, pricing and retention assumptions must be tested with Botswana owner-operators. The initial launch focus is Botswana, with SADC expansion preserved for a later research track.

## 1. Problem

Many owner-operated micro and small businesses must make everyday decisions without a clear view of how much cash will be available next week. Sales may be recorded in notebooks, messages or memory, while business expenses, supplier payments and household withdrawals can be difficult to separate. This can make it harder to anticipate a shortfall, plan stock purchases or judge whether the business can afford an upcoming commitment.

These are customer-discovery hypotheses, not established behaviour across all Botswana businesses. Statistics Botswana reported 173,583 informal-sector workers in Q1 2024, equal to 23.0% of total employment; 54,796 worked in wholesale and retail, including tuck shops and street hawkers. This is a relevant group to investigate, but employment figures are not the same as a count of potential customers. [1]

Primary research must establish which owners experience this problem most often, how they currently track money, which decisions are hardest, what tools they already use, and whether they would pay for better cash-flow visibility.

## 2. Customer Segments

Primary segment: owner-operators of micro and small businesses in Botswana who make everyday operating and cash decisions themselves. The initial pilot will focus on a manageable group in Gaborone—such as tuck shops, market traders, food vendors and small retailers—while interviews determine which subgroups have the strongest need.

Secondary users: trusted people who help run the business or maintain its records, including a family member, shop assistant, partner or bookkeeper. Access must be permission-based, with clear separation between each business and its authorised users.

Potential later customers and distribution partners include SME support organisations, accountants, business associations, financial institutions and enterprise programmes. These are prospects to approach, not confirmed partners.

Launch geography: Botswana first. South Africa, Zambia and Namibia are useful SADC markets for later validation, but market size should not be estimated by simply adding figures from different years or definitions. Each country needs its own research into business types, payment habits, regulation, competition and willingness to pay.

## 3. Unique Value Proposition

Pelo Finance helps a small-business owner move from recording what has already happened to understanding what may happen next. Its central promise is practical cash-flow visibility: a clear view of current cash, expected inflows and outflows, likely runway, and the effect of a difficult week or planned expense.

PeloScore translates selected financial signals into an understandable, explicitly illustrative indicator. It should explain the factors behind a result rather than present a number as a credit rating or guarantee of business health.

Positioning: a Botswana-first cash-flow companion for owner-operators who need clearer next-step decisions—not merely another sales ledger or generic AI chatbot.

## 4. Solution

Core MVP journey: register and sign in; complete a short business profile; enter opening cash and basic income/expense records; view a dashboard; review a short-term cash-flow forecast; test a lean-week or planned-expense scenario; understand the factors in PeloScore; and ask Peloyame for a concise explanation grounded in the user's permitted financial summary.

Core features: manual financial entry; cash summary; simple forecast; scenario testing; transparent PeloScore factors; and an accessible, mobile-friendly interface. Forecasts and scores must show assumptions, data gaps and uncertainty. They are decision-support estimates, not promises.

Peloyame Lite: a read-only assistant powered by the Groq API, using a server-side API key obtained by the project team. At the time this canvas was prepared, Groq's published free-tier rate limits list `openai/gpt-oss-20b` at 30 requests per minute, 1,000 requests per day, 8,000 tokens per minute and 200,000 tokens per day. The team must confirm the account's current limits before testing. The MVP will not upgrade to a paid tier or attach a payment method; if free limits are reached, Peloyame should pause gracefully rather than incur charges. [4][5]

Prompt engineering and context analysis: a concise system prompt defines Peloyame's role, boundaries, tone and required response format. Each request combines that instruction with the user's question and a minimal, server-generated financial context. Before calling the model, the backend classifies the request intent, checks whether the permitted data is sufficient, validates data types and ranges, and removes irrelevant or sensitive fields. Deterministic backend calculations—not the language model—must supply numeric totals, runway and forecast values wherever practical.

Response controls: instruct the model to answer in plain, respectful business language; use only the supplied context; distinguish facts from estimates; explain uncertainty; never invent amounts or claim unavailable data exists; and ask at most one clarifying question when needed. Keep responses concise and structured, with an explicit fallback when evidence is insufficient. Use a low-variance generation setting and a bounded output length, then validate the answer before displaying it.

Input and security controls: enforce authentication and business-level data isolation; apply request size, length, format and character checks; reject malformed or out-of-scope requests; mitigate prompt injection by treating user text and business notes as untrusted data; enforce five questions per authenticated user per session on the server; and add separate throttling to limit abuse. Peloyame receives no arbitrary database access, browser access or write tools. Keep the API key in a server-side environment variable, never in frontend code or public repositories. Use timeouts, retry carefully, handle provider rate limits and return a useful fallback without exposing provider errors or secrets.

Hackathon demo data: synthetic business profiles are optional tutorial/demo data, not a substitute for the real user journey. Any OTP, bank or mobile-money verification without a live provider integration must be visibly labelled as simulated. Do not imply that live accounts or payments have been verified when they have not.

Production readiness: before public launch, complete security testing, privacy and consent flows, data-retention rules, provider-term review, monitoring, access-control testing and legal review. Do not send identifiable financial data to an AI provider without a documented lawful basis, user-facing disclosure and appropriate safeguards. Peloyame must not execute transactions, make lending decisions, or provide definitive legal, tax or investment advice.

## 5. Channels

Begin with direct, relationship-led customer discovery in Gaborone. Recruit owner-operators through market visits, business networks and referrals, with a clear explanation of the research purpose and no pressure to share sensitive financial records.

Use a mobile-friendly web application for the pilot, supported by short onboarding, a guided sample business and simple educational material. Synthetic profiles should be optional and clearly distinguished from a user's own records.

After early validation, test referrals and demonstrations through SME associations, accountants, business-development programmes, banks and fintech communities. Potential collaboration with FNB Botswana, other financial institutions or support organisations is exploratory until an agreement exists.

Build credibility through practical demonstrations, transparent assumptions, data minimisation and clear explanations of how forecasts and PeloScore work.

## 6. Revenue Streams

Pricing hypotheses to test—not validated market prices: Starter at P0/month for essential manual records and a basic cash summary; Plus at P25/month for richer forecasts and scenario planning; and Pro at P49/month for more advanced planning and reporting. The precise feature limits should be decided after usage and cost testing.

The pricing hypothesis should be tested through interviews, a clear description of included features, price comparisons and, where practical, evidence of real purchase intent. Do not interpret positive comments alone as proof that customers will pay.

Offer institutional or business-to-business pricing only after discovery clarifies the value, service requirements, support burden and procurement process. Paid onboarding or training may also be tested where customers request it.

Do not rely on lending commissions, transaction commissions or marketplace referral revenue in the initial business case. If introduced later, referral arrangements must be transparent, optional and structured to protect user trust. Confirm payment, tax and consumer-protection obligations before charging customers.

## 7. Cost Structure

Product and engineering: application development, hosting, database, backups, domain, monitoring, error tracking, testing and maintenance.

AI and analytics: Groq API usage under the selected free tier's applicable limits and terms, prompt evaluation, model-output checks, and a fallback path when the service is unavailable. The plan is zero API spend: do not add a payment method or upgrade tiers for the MVP. Keep usage within the free limits and stop requests cleanly at the cap. Free access is a current operating assumption, not a guarantee that model availability, rate limits or terms will never change; verify the account and model status before each release. Groq documents model deprecations and notes that applications may need occasional migration. [4][5][6]

Trust and operations: security reviews, privacy/legal advice, consent and retention controls, customer support, onboarding, pilot incentives and customer research.

Financial discipline: record actual usage and quotes instead of inventing cost estimates. Track cost per active business, AI requests per user, support time and hosting costs as the pilot grows.

## 8. Key Metrics

Discovery: number of owner-operator interviews; proportion confirming the problem without being led; most common cash decisions and current workarounds; existing tools; and evidence of willingness to pay at different price points.

Activation and retention: pilot enrolment; registration completion; proportion entering usable financial data; first-week completion of a cash summary; week-four active use; and repeat use of forecasts or scenarios.

Decision value: whether users understand the forecast, identify an upcoming shortfall earlier, change a planned decision, and report that the output was useful. Compare forecasts with actual results over time.

Product quality and trust: forecast error; PeloScore explanation comprehension; Peloyame answer-grounding and factual-error rate; refusal and fallback rate; response latency; share of AI requests rejected by validation; rate-limit events; crashes; unauthorised-access findings; and privacy incidents.

Initial pilot targets are provisional: recruit 30–50 owner-operators; aim for 70% onboarding completion, 60% of enrolled users recording enough data to view a first cash summary in week one, and 40% active in week four. Review these targets after the first cohort rather than presenting them as established benchmarks.

## 9. Unfair Advantage

The intended advantage is the combination of Botswana-focused customer understanding, accessible cash-flow forecasting, scenario planning, a transparent PeloScore and Peloyame explanations grounded in permitted user data. Over time, validated local workflows and a trusted distribution network could make the product more useful and harder to replace.

This is a proposed advantage, not a proven moat. The Bank of Botswana's fintech landscape mapping report, published in June 2026, highlights issues around APIs, cybersecurity and data protection, and notes the absence of an Open Banking framework for standardised data-sharing. Pelo should therefore avoid making its early value dependent on bank integrations. [2]

Competitor risk is material. Faida Botswana publicly lists sales, expenses, inventory, supplier records, reports, offline support and AI-assisted insights across its plans; its published prices range from P0 Starter to P179 Professional and P249 Business, with an enterprise plan from P350. Pelo must differentiate through cash runway, forward-looking cash pressure and practical what-if planning—not by claiming competitors cannot record transactions or offer AI. Pricing and features should be rechecked before external publication. [3]

Defensibility must be earned through customer trust, reliable forecasts, clear explanations, secure user-level data isolation, local learning and measurable improvement in business decisions. Do not claim exclusive data, confirmed partnerships or proprietary predictive superiority before they exist.

## Research references

Market figures indicate relevant context; they are not a direct estimate of Pelo's total addressable market. Recheck published competitor pricing, models and API limits before external publication.

- [1] Statistics Botswana, Quarterly Multi-Topic Survey: Labour Force Module, Q1 2024. [https://www.statsbots.org.bw/quarterly-multi-topic-survey-labour-force-module-quarter-1-2024](https://www.statsbots.org.bw/quarterly-multi-topic-survey-labour-force-module-quarter-1-2024)
- [2] Bank of Botswana Fintech Portal, The 2024 Botswana Fintech Landscape Mapping Survey Report (published 22 June 2026). [https://fintech.bankofbotswana.bw/2024-botswana-fintech-landscape-mapping-survey-report](https://fintech.bankofbotswana.bw/2024-botswana-fintech-landscape-mapping-survey-report)
- [3] Faida Botswana, official product and pricing information. [https://faida.co.bw/](https://faida.co.bw/)
- [4] GroqDocs, Rate Limits. [https://console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits)
- [5] GroqDocs, Supported Models. [https://console.groq.com/docs/models](https://console.groq.com/docs/models)
- [6] GroqDocs, Model Deprecation. [https://console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations)
- [7] Botswana Data Protection Act implementation information (DailyNews / BOPA, 18 November 2025). [https://dailynews.gov.bw/news-detail/87795](https://dailynews.gov.bw/news-detail/87795)

## Decisions to validate before launch

- Which owner-operator segment experiences cash uncertainty most acutely, and what specific decision would Pelo help them make?
- Will owners enter enough reliable data to make the forecast useful?
- Do users understand and trust the forecast and PeloScore explanations?
- Will customers pay P25 or P49 per month, and for which specific outcomes?
- Are Peloyame's answers grounded, safe, concise and useful within the Groq free-tier limits?
- What lawful basis, disclosures, retention controls and provider terms are required before sending any personal financial data to an external AI service?
- Which capabilities should remain simulated for the hackathon and which real integrations are essential before public launch?
