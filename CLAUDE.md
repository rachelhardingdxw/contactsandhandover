# Prepare to Complete handover prototype – context for Claude

GOV.UK Prototype Kit 14 prototype (GOV.UK Frontend 6) for DfE, built by dxw.
It tests iteration 1 of handing a project over from Prepare conversions and
transfers to Complete conversions, transfers and changes. Designer: Rachel Harding.
The designs live in the Figma file "Complete-WIP", page "Iteration 1", section "Iteration".

## Run

`npm install` then `npm run dev` (Node 22+). Start page: http://localhost:3000.
`README.md` lists every page and URL.

## Structure

- `app/routes.js` – all flow, branching, validation, example data (PROJECT, ORGS, PREFILL)
- `app/views/layouts/service.html` – DfE header, service navigation, phase banner,
  "Problems and feedback" footer; `prepare.html` / `complete.html` set the service
- `app/views/prepare/*`, `app/views/complete/*` – pages
- `app/views/includes/macros.html` – project caption, error summary, handover buttons.
  Imported macro files do not get the kit's auto-imported GOV.UK macros, so import them there.
- `app/assets/sass/settings.scss` – Arial instead of GDS Transport (education.gov.uk services)

Session data uses flat keys, for example `trust-name`, `rcs`, `date-reason`.
Values in a URL query string are saved to the session, so scenario links work
(for example `?setup-outcome=timeout&setup-delay=30&decision=approved`).

## Design decisions to keep

- Contacts are collected in Prepare (task list "Contact details": trust, school,
  local authority, solicitor, diocese). Trust and school pre-fill from a previous
  application; LA, solicitor and diocese start with "Find a contact from another
  project" (URN). Every contact has "I cannot add a contact" with a reason.
- Decision recorded page uses a success notification banner (not a panel) because the
  journey continues; inset text warns it can take up to a minute; the start button
  opens Complete in a new tab and says "(opens in new tab)".
- Complete creates the project 5–60 seconds after the Prepare decision (it polls for
  locked Prepare projects). Design for that delay: holding page that moves on by itself,
  and a timeout page after about 2 minutes. Links on these pages stay in Complete
  ("Go to projects to hand over in Complete"); no back link on the holding page (new tab).
- Handover questions are one thing per page: RCS, handover details, SharePoint links, 2RI.
  RCS = yes makes handover details required; RCS = no makes them optional ("(optional)").
  Negative answers open a reason box (conditional reveal). "Anything else" is optional.
- Every handover question has Continue plus a secondary button "Save and come back later",
  which saves without validating and returns to the list with a one-time success banner.
  The list then shows "Continue handover". Resuming goes to the first unanswered question.
- Check answers: project details from Prepare are read-only; handover answers and
  contacts have Change links; a missing contact shows its reason and "Add contact".
  Changing RCS from No to Yes routes back through handover details.
- Error messages follow GOV.UK wording and appear in page order.

## Not built yet

- Prepare decision journey is one simplified page
- DfE crest (header shows text)
- Complete project view (About the project) with the "View this project in Prepare
  (opens in new tab)" link in the key facts
- "Significant change" in Complete navigation (seen in a newer screenshot)
- Realistic URN lookup with a "not found" state (any 6-digit URN matches now)
- Scenario links that reset and pre-fill data for research sessions
