# KumaWorks Jobs

Independent candidate portal for **jobs.kumaworks.id**. This is a sibling application, not a subfolder or build dependency of KumaWorks:

```text
kumaadmin/
├── kumaworks/        # Existing employer app, database migrations and workers
└── kumaworks-jobs/   # This Next.js application, separate Vercel project
```

## Run locally

Node.js 20.9+ and npm are required. From this folder:

```sh
npm ci
npm run dev:preview
```

Open **http://localhost:3001**. Preview includes labeled sample jobs and a candidate dashboard so you can review light/dark themes, search, company pages and the application flow immediately. It does not require credentials, upload files, send email, or save applications. Preview is disabled in production even if its flag is accidentally set.

For real recruitment data:

1. Create `.env.development.local` yourself using `.env.example` as a template. Use the existing KumaWorks Supabase project URL, public anon key and server-only service-role key. Nothing in this project copies credentials from the sibling app.
2. Set `NEXT_PUBLIC_JOBS_URL=http://localhost:3001` and `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or the employer app's actual origin).
3. In Supabase Auth → URL Configuration, allow `http://localhost:3001/jobs/auth/callback**` for local callback query parameters. Keep the employer callback configured too. The passwordless email must use the supplied redirect URL, not a hardcoded employer login URL.
4. Stop preview and run `npm run dev`. Start KumaWorks separately when testing employee onboarding.
5. In KumaWorks → People → Recruitment, enable recruitment/public intake for a participating business and publish a vacancy. An empty portal is expected until a real employer publishes; the application does not seed production jobs.

`.env.local` is not required or modified. Ports 3000 and 3001 allow both apps to run together. Localhost cookies are not separated by port; use separate local hostnames if testing distinct employer/candidate browser sessions. Production uses host-only cookies on the separate domains.

## Architecture

Next.js App Router + React + Tailwind, deployed independently on Vercel, sharing the existing Supabase Auth, Postgres and private storage. The portal connects to Supabase from **authorized server actions and route handlers**. There is no browser service-role key and no extra cross-origin KumaWorks REST API to deploy.

Public listings use the existing `recruitment_public_vacancies` projection and an explicit safe serializer. Private operations verify the Supabase user and candidate ownership. Mutations call `recruitment_command` with the verified actor, no employer business context, and the existing version/concurrency checks. Candidates never need an employer membership or subscription to use the portal.

KumaWorks retains ownership of recruiter permissions, migrations, interviews, offer approval, hiring, email outbox/webhooks, scanning and retention. **Do not run a second outbox worker here.** Published jobs and candidate responses are shared immediately through the same database. No synchronization jobs are required.

Candidate uploads go directly to scoped signed URLs in private Supabase storage. The KumaWorks worker checks actual bytes and scans them before documents become usable. Document downloads verify ownership and issue 60-second links; identity evidence cannot be downloaded by this app. NIK encryption requires the exact same `RECRUITMENT_IDENTITY_KEY` as KumaWorks. Without it, verification intake is unavailable while ordinary applications remain usable.

Onboarding verifies the candidate's hired application and invitation, then hands the authenticated user to KumaWorks `/auth/recruitment`. Multiple employer provisioning remains transactional in the existing hiring service.

## Current capability coverage

| KumaWorks capability                          | Candidate portal                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Public/unlisted jobs, paused/closed vacancies | Search with role/company/location/employment/work-mode filters; direct links and closed-state pages              |
| Company careers settings                      | Company page, description, website, paginated vacancies                                                          |
| Salary visibility                             | Public salary only; hidden amounts never reach the page or structured data                                       |
| Versioned application builder                 | Four-step form, custom field types, CV/custom documents, salary questions, joining availability, complete review |
| Candidate identity                            | Passwordless email, reusable profile, verified ownership and explicit manual-record claim                        |
| Drafts and submissions                        | Autosave after verification, resume via actual job slug, original submitted answers and documents                |
| Interview rounds                              | Timezone-aware invitations, confirmation/reschedule response and calendar download                               |
| Offers                                        | Exact version, terms/components, PDF download, accept/decline response; database expiry/approval rules preserved |
| Document requests                             | Upload, scan status, select ready document, submit/replace                                                       |
| Candidate communication                       | Shared recruiter messages and application progress; internal employer notes stay private                         |
| Withdrawal                                    | Explicit withdrawal confirmation and preserved history                                                           |
| Hiring                                        | Employee onboarding handoff with invitation binding                                                              |
| Kuma Verified                                 | Optional NIK/KTP submission, current badge/review feedback, separate availability gate                           |
| Privacy/support                               | Correction/deletion request and report-job action                                                                |
| Accessibility/themes                          | Light/dark/system preference, server-rendered saved theme, mobile layout, keyboard focus, reduced-motion support |

Restriction review, offer approval, interview feedback and recruiter-only details intentionally remain in the employer app. The portal follows the current implemented module rather than adding employer controls to a candidate session.

## Company landing pages

Each enabled public company has a landing page at `https://jobs.kumaworks.id/[company-code]`, with a header banner, company logo and description, website link, and cards for its public vacancies that are accepting applications. Companies with no open jobs still have a page with an empty state.

Customize the code in **KumaWorks → People → Recruitment → Settings → Careers page address**. This uses the existing unique recruitment settings slug; no database migration is needed. For example, save `ptkago` to use `/ptkago` or share `/PTKAGO`. Codes are stored in lowercase; uppercase links resolve to the same company and use the lowercase canonical URL. The existing logo, company display name, description, and website supply the page branding. The banner uses the portal's built-in design.

Old `/jobs/company/[code]` links redirect to the short address and preserve pagination. Application routes such as `/jobs` and `/api` take priority; companies with those reserved codes retain their legacy company address and should choose another code for a short URL. Changing a code changes the public address; previous codes are not retained as aliases.

In preview mode, open `/RUANG-KARYA` or `/loka-digital` to review the company landing page with sample data. Real companies require recruitment and public intake to be enabled in the employer app.

## Deploy to Vercel

1. Put this folder in its own repository and import it as a **separate Vercel project**, framework Next.js, root directory `.`. Use `npm ci` and `npm run build`.
2. Configure the variables from `.env.example` in Vercel. Set `NEXT_PUBLIC_JOBS_URL=https://jobs.kumaworks.id` and `NEXT_PUBLIC_APP_URL` to the employer production origin. Never prefix the service key or identity key with `NEXT_PUBLIC_`.
3. Add `jobs.kumaworks.id` under this project's Settings → Domains. If it was attached to the employer project, move that domain to this project. Set the `jobs` CNAME to the project-specific value Vercel displays; keep the employer domain pointing to KumaWorks. See [Vercel domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
4. Add the production `/jobs/auth/callback` destination (with permitted `next` query values) to [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Keep KumaWorks `/auth/recruitment` and its invitation flow available. Do not change the global Auth Site URL to the jobs portal if the employer app relies on it; each candidate login supplies its own callback.
5. Set **the employer app's** `NEXT_PUBLIC_JOBS_URL` to this same jobs origin so outbox emails link here. Legacy `/jobs/...` links are preserved; the new domain root opens `/jobs`.
6. Run the email → application → scan → interview → offer → hire → employee onboarding pilot. The employer cron, scanner and email services must already be configured. Feature flags remain managed in KumaWorks and default off.

No DNS changes, production configuration, deployment, email sending, or production data seeding is performed by installing this project.

## Validation and maintenance

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Unit tests cover application validation, hidden salary serialization, safe auth returns, file signatures, calendar generation and form interactions. Browser tests run the actual app in isolated preview mode on port 3138, checking responsive layouts, theme persistence, discovery, review, dashboard navigation and rejected preview writes. Screenshots are written to ignored `test-results/`.

The live email/storage/onboarding pilot is a separate launch check; browser preview deliberately does not mutate a real Supabase project. The shared SQL workflow/isolation/concurrency tests remain in `../kumaworks/web` and run with `npm run test:recruitment-db`.

This app targets the seven recruitment migrations through **20261102130000** documented in `../kumaworks/docs/recruitment.md`. They have already been applied to the existing linked project. Do not duplicate or reapply migrations from this portal. Domain validation/calendar modules were copied from the existing implementation as the initial contract; when those contracts change, update both apps and run their tests together. The production build does not import files, env files, or node_modules from the sibling repository.

Public listings also require the employer-owned **20261103122000_recruitment_public_subscription_check.sql** follow-up migration, applied to the linked project. It corrects the public vacancy view to check the employer's subscription without requiring the visitor to be an employer member. Without this fix, published jobs incorrectly report `accepting = false` and disappear from discovery. Publication, deadline, public-intake, test-business, and subscription restrictions remain enforced.
