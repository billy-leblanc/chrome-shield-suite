# Chrome Web Store Support Ticket — Safety Intercept

**Extension ID:** bpafnjhfjimdoamnjepkfljpegpmmeom
**Submission Date:** April 2, 2026
**Developer Email:** bleblanc@berkeley.edu

---

\begin{verbatim}
Subject: Review status inquiry — Safety Intercept (bpafnjhfjimdoamnjepkfljpegpmmeom)

Hi Chrome Web Store Review Team,

I'm a UC Berkeley student reaching out about Safety Intercept
(ID: bpafnjhfjimdoamnjepkfljpegpmmeom), submitted April 2 and
pending for 10 days. I've resubmitted today with an important
fix and wanted to flag both.

Safety Intercept is a free fraud protection tool for seniors
and vulnerable users. It scans Gmail for social engineering
scams (grandparent scams, fake emergencies) and shows a
warning questionnaire before payments on PayPal and Wells
Fargo Zelle. The user always retains full control — no payment
is ever blocked. No credentials or browsing history are
collected.

The original submission included host permissions for domains
I hadn't yet implemented (Venmo, Chase, BofA, Citi, HSBC,
Barclays, Revolut). That was my oversight and I apologize for
it. The resubmitted version limits permissions to only what
the extension actively uses: paypal.com, wellsfargo.com,
mail.google.com, and workers.dev (Cloudflare relay). All
injected UI runs inside a closed Shadow DOM with no
interference to host pages.

Privacy policy: https://safetyintercept.vercel.app/privacy

I'm applying to Y Combinator Summer 2026 and this listing is
a key milestone for getting the tool to people who need it.
If there's any way to expedite review of the updated
submission, I would be truly grateful. Happy to provide a
demo video or answer any questions.

Thank you so much for your time.

Billy LeBlanc
bleblanc@berkeley.edu
\end{verbatim}
