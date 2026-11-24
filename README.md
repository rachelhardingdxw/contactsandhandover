# Prepare to Complete handover prototype

A GOV.UK Prototype Kit prototype of iteration 1 of the handover journey:
adding contact details in Prepare, recording a decision, and handing the project over in Complete.

Built with GOV.UK Prototype Kit 14.0.3 and GOV.UK Frontend 6.6.0.

## Run it

You need Node.js 22 or later.

```
npm install
npm run dev
```

Then open http://localhost:3000. The start page lists the start points and has
**scenario settings** for research sessions:

- whether trust and school contacts are available from a previous application
- whether Complete is ready after the wait, or shows the "taking longer than usual" page
- how many seconds the holding page shows (the live service takes 5 to 60 seconds)

Use **Clear all prototype data** on the start page to reset between participants.

## Pages

### Prepare (`/prepare/...`)

| Page | URL |
| --- | --- |
| Project task list, with the Contact details section | `/prepare/project` |
| Add a contact (trust and school pre-fill from a previous application) | `/prepare/contacts/:org/details` |
| Find a contact from another project (local authority, solicitor, diocese) | `/prepare/contacts/:org/find` |
| Do you need to include a contact for a diocese? | `/prepare/contacts/diocese/diocese-needed` |
| Why are you not able to add a contact? | `/prepare/contacts/:org/cannot-add` |
| Record a decision (simplified to one page) | `/prepare/decision` |
| Decision recorded – opens Complete in a new tab | `/prepare/decision-recorded` |

`:org` is one of `trust`, `school`, `la`, `solicitor`, `diocese`.
Any 6-digit URN works on the "find a contact" page.

### Complete (`/complete/...`)

| Page | URL |
| --- | --- |
| Projects to handover (current design) | `/complete/projects-to-hand-over` |
| Check you have the right project (entry from the list) | `/complete/handover/check-project` |
| Holding page while the project is created | `/complete/handover/setting-up` |
| Timeout – taking longer than usual | `/complete/handover/taking-longer` |
| 02 Will RCS manage this project? | `/complete/handover/rcs` |
| 03 Handover details (required if RCS = yes, optional if no) | `/complete/handover/handover-details` |
| 04 SharePoint folder links | `/complete/handover/sharepoint` |
| 05 Intervention following 2RI | `/complete/handover/two-ri` |
| Check your answers | `/complete/handover/check-answers` |
| Confirmation (RCS = yes or no) | `/complete/handover/confirmation` |
| Already handed over | `/complete/handover/already-handed-over` |

## Behaviour included

- Validation and GOV.UK error messages on every question, in page order
- Reason boxes that open on negative answers ("No", "not requested yet")
- "Save and come back later" on every handover question: saves without
  validating and returns to the list with a one-time success banner; the list
  then shows "Continue handover" for that project
- Coming back resumes at the first unanswered question, or check answers
- Changing RCS from No to Yes on check answers routes back through the
  handover details, because they become required
- Contacts from Prepare appear on check answers and can be changed there
- Confirming twice shows "This project has already been handed over"

## Where the code lives

- `app/routes.js` – flow, branching, validation and the example data
- `app/views/layouts/` – DfE header, Prepare and Complete navigation, footer
- `app/views/prepare/` and `app/views/complete/` – the pages
- `app/assets/sass/` – Arial font setting and the few custom styles

## Deploying for research

Set a password before deploying (the kit asks for one in production mode) and
check with the team where DfE prototypes are hosted.
