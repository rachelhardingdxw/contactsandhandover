//
// Handover prototype routes
// Prepare: project task list (with contact details) -> record decision -> decision recorded
// Complete: setting up (holding) -> handover questions -> check answers -> confirmation
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const PROJECT = {
  schoolName: 'Bradford Moor Community Primary School',
  urn: '107197',
  type: 'Conversion',
  route: 'Voluntary conversion',
  incomingTrust: 'Example Academy Trust',
  trustUkprn: '10060956',
  decisionDate: '12 October 2026',
  conversionDate: '1 December 2026',
  academyOrder: 'AO (Academy order)',
  owner: 'Rachel Harding'
}

const ORGS = {
  trust: { label: 'the trust', heading: 'Trust', start: 'details' },
  school: { label: 'the school', heading: 'School', start: 'details' },
  la: { label: 'the local authority', heading: 'Local authority', start: 'find' },
  solicitor: { label: 'the solicitor', heading: 'Solicitor', start: 'find' },
  diocese: { label: 'the diocese', heading: 'Diocese', start: 'diocese-needed' }
}

// Contact details "from a previous application" or "another project"
const PREFILL = {
  trust: { name: 'George Furbank', job: 'Chairperson', email: 'G.Furbank@example.sch.uk' },
  school: { name: 'Marcus Smith', job: 'Headteacher', email: 'M.smith@example.sch.uk' },
  la: { name: 'Lucy Packer', job: 'Head of planning', email: 'L.Packer@example.local.uk' },
  solicitor: { name: 'Claudia Pena', job: 'Solicitor', email: 'C.Pena@example.sch.uk' },
  diocese: { name: 'Caden Murley', job: 'Diocese manager', email: 'C.Murley@example.church.uk' }
}

const OTHER_PROJECTS = [
  ['Enmore Church of England Primary School', '123787', 'Manor Hall Academy Trust', 'Jan 2021', '21 April 2026', 'Conversion'],
  ['Castle Hall School: A Specialist Language College', '107784', 'The Macclesfield Academy', 'Oct 2025', '9 September 2025', 'Conversion'],
  ['Rushbury CofE Primary School', '123497', 'The Macclesfield Academy', 'Oct 2025', '8 May 2025', 'Conversion'],
  ['Wood Ley Community Primary School', '124680', 'River Tees Multi-academy Trust', 'Jan 2026', '13 May 2026', 'Conversion'],
  ['King Ecgbert School', '138841', 'Paddy Conversions Test Trust', 'Jan 2026', '31 December 2025', 'Conversion'],
  ['High Storrs School', '145455', 'Paddy Conversions Test Trust', 'Feb 2026', '10 December 2025', 'Conversion'],
  ['Notre Dame High School', '138361', 'Paddy Conversions Test Trust', 'Mar 2026', '10 October 2025', 'Conversion'],
  ['Hillsborough Primary School', '107082', 'Paddy Conversions Test Trust', 'May 2026', '11 January 2025', 'Conversion'],
  ['Hexham Middle School', '143292', 'Cheviot Learning Trust', 'Jun 2026', '17 December 2025', 'Transfer'],
  ['Queen Elizabeth High School', '143291', 'Cheviot Learning Trust', 'Jun 2026', '17 December 2025', 'Transfer']
]

// Make shared values available to every view
router.use((req, res, next) => {
  res.locals.project = PROJECT
  res.locals.orgs = ORGS
  next()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const blank = (v) => v === undefined || v === null || String(v).trim() === ''
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
const isSharePoint = (v) => /^(https?:\/\/)?[a-z0-9-]+\.sharepoint\.com\/\S*/i.test(String(v).trim())

function toErrorList (errors) {
  return Object.keys(errors).map((key) => ({ text: errors[key], href: '#' + key }))
}

function contactStatus (data, org) {
  const s = data[org + '-status']
  if (s === 'completed' || s === 'cannot-add' || s === 'not-needed') return 'completed'
  return 'not-started'
}

function rcsYes (data) { return data.rcs === 'yes' }

// Which handover step should someone resume at?
function firstUnanswered (data) {
  if (blank(data.rcs)) return 'rcs'
  if (!data['details-seen']) return 'handover-details'
  if (rcsYes(data) && validateHandoverDetails(data).count) return 'handover-details'
  if (validateSharePoint(data).count) return 'sharepoint'
  if (blank(data['two-ri'])) return 'two-ri'
  return 'check-answers'
}

function draftStarted (data) {
  return !blank(data.rcs) || !blank(data['school-link']) || !blank(data['two-ri'])
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateHandoverDetails (data) {
  const e = {}
  const required = rcsYes(data)
  // Keep errors in the same order as the questions on the page
  if (required) {
    if (blank(data['date-discussed'])) e['date-discussed'] = 'Select yes if the provisional conversion date has been discussed with the local authority'
    else if (data['date-discussed'] === 'no' && blank(data['date-reason'])) e['date-reason'] = 'Enter why the provisional conversion date has not been discussed yet'
    if (blank(data.proforma)) e.proforma = 'Select whether the local authority proforma has been received'
    else if (data.proforma === 'not-requested' && blank(data['proforma-reason'])) e['proforma-reason'] = 'Enter why the local authority proforma has not been requested yet'
    if (blank(data['intro-email'])) e['intro-email'] = 'Select yes if the introduction and next steps email has been sent'
    else if (data['intro-email'] === 'no' && blank(data['email-reason'])) e['email-reason'] = 'Enter why the introduction email has not been sent yet'
    if (blank(data.sfso)) e.sfso = 'Enter the name of the SFSO lead'
  }
  for (const f of ['date-reason', 'proforma-reason', 'email-reason', 'other-notes']) {
    if (!blank(data[f]) && String(data[f]).length > 500) e[f] = 'This must be 500 characters or less'
  }
  return { errors: e, count: Object.keys(e).length }
}

function validateSharePoint (data) {
  const e = {}
  if (blank(data['school-link'])) e['school-link'] = 'Enter a link to the school SharePoint folder'
  else if (!isSharePoint(data['school-link'])) e['school-link'] = 'Enter a SharePoint link in the correct format, like https://educationgovuk.sharepoint.com/sites/…'
  if (blank(data['trust-link'])) e['trust-link'] = 'Enter a link to the incoming trust SharePoint folder'
  else if (!isSharePoint(data['trust-link'])) e['trust-link'] = 'Enter a SharePoint link in the correct format, like https://educationgovuk.sharepoint.com/sites/…'
  return { errors: e, count: Object.keys(e).length }
}

function validateContact (data, org) {
  const e = {}
  const v = (f) => data[org + '-' + f]
  if (blank(v('name'))) e['contact-name'] = 'Enter a full name'
  if (blank(v('job'))) e['contact-job'] = 'Enter a job title'
  if (blank(v('email'))) e['contact-email'] = 'Enter an email address'
  else if (!isEmail(v('email'))) e['contact-email'] = 'Enter an email address in the correct format, like name@example.com'
  if (!blank(v('phone')) && !/^[0-9+()\s-]{10,20}$/.test(String(v('phone')))) e['contact-phone'] = 'Enter a phone number, like 01632 960 001 or 07700 900 982'
  if (blank(v('primary'))) e['contact-primary'] = 'Select yes if this person is the primary project contact for the organisation'
  return { errors: e, count: Object.keys(e).length }
}

// ---------------------------------------------------------------------------
// Prototype start page settings
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  res.render('index', { updated: req.query.updated === '1' })
})

router.post('/settings', (req, res) => {
  res.redirect('/?updated=1')
})

// ---------------------------------------------------------------------------
// PREPARE
// ---------------------------------------------------------------------------

router.get('/prepare/project', (req, res) => {
  const data = req.session.data
  const contactItems = Object.keys(ORGS).map((org) => {
    const s = data[org + '-status']
    let hint
    if (s === 'cannot-add') hint = 'Contact not added: ' + data[org + '-reason']
    else if (s === 'not-needed') hint = 'Not needed for this school'
    else if (s === 'completed') hint = data[org + '-name'] + ', ' + data[org + '-job']
    const item = {
      title: { text: ORGS[org].heading },
      href: '/prepare/contacts/' + org,
      status: contactStatus(data, org) === 'completed'
        ? { text: 'Completed' }
        : { tag: { text: 'Not started', classes: 'govuk-tag--grey' } }
    }
    if (hint) item.hint = { text: hint }
    return item
  })
  res.render('prepare/project', { contactItems, decided: data.decision === 'approved' })
})

// Start a contact task
router.get('/prepare/contacts/:org', (req, res) => {
  const org = req.params.org
  if (!ORGS[org]) return res.redirect('/prepare/project')
  res.redirect('/prepare/contacts/' + org + '/' + ORGS[org].start)
})

// Diocese: do you need one?
router.get('/prepare/contacts/diocese/diocese-needed', (req, res) => {
  res.render('prepare/diocese-needed', { org: 'diocese' })
})

router.post('/prepare/contacts/diocese/diocese-needed', (req, res) => {
  const data = req.session.data
  if (blank(data['diocese-needed'])) {
    const errors = { 'diocese-needed': 'Select yes if you need to include a contact for a diocese' }
    return res.render('prepare/diocese-needed', { org: 'diocese', errors, errorList: toErrorList(errors) })
  }
  if (data['diocese-needed'] === 'no') {
    data['diocese-status'] = 'not-needed'
    return res.redirect('/prepare/project')
  }
  res.redirect('/prepare/contacts/diocese/find')
})

// Find a contact from another project (local authority, solicitor, diocese)
router.get('/prepare/contacts/:org/find', (req, res) => {
  res.render('prepare/find-contact', { org: req.params.org })
})

router.post('/prepare/contacts/:org/find', (req, res) => {
  const org = req.params.org
  const data = req.session.data
  const urn = String(data[org + '-lookup-urn'] || '').trim()
  let error
  if (blank(urn)) error = 'Enter a school URN'
  else if (!/^\d{6}$/.test(urn)) error = 'URN must be 6 numbers, like 107197'
  if (error) {
    const errors = { 'lookup-urn': error }
    return res.render('prepare/find-contact', { org, errors, errorList: toErrorList(errors) })
  }
  data[org + '-source'] = 'other-project'
  res.redirect('/prepare/contacts/' + org + '/details')
})

// Add a contact (pre-filled where details are available)
function contactPrefill (data, org) {
  if (!blank(data[org + '-name'])) return { prefilledFrom: null }
  const fromPrevious = (org === 'trust' || org === 'school') && data['previous-contacts'] !== 'no'
  const fromOther = data[org + '-source'] === 'other-project'
  if (fromPrevious || fromOther) {
    const p = PREFILL[org]
    data[org + '-name'] = p.name
    data[org + '-job'] = p.job
    data[org + '-email'] = p.email
    return { prefilledFrom: fromOther ? 'another project' : 'a previous application' }
  }
  return { prefilledFrom: null }
}

router.get('/prepare/contacts/:org/details', (req, res) => {
  const org = req.params.org
  const data = req.session.data
  if (req.query.manual) { data[org + '-source'] = 'manual' }
  const { prefilledFrom } = contactPrefill(data, org)
  res.render('prepare/contact-details', { org, prefilledFrom, data })
})

router.post('/prepare/contacts/:org/details', (req, res) => {
  const org = req.params.org
  const data = req.session.data
  const { errors, count } = validateContact(data, org)
  if (count) return res.render('prepare/contact-details', { org, errors, errorList: toErrorList(errors) })
  data[org + '-status'] = 'completed'
  data[org + '-reason'] = ''
  res.redirect('/prepare/project')
})

// I cannot add a contact
router.get('/prepare/contacts/:org/cannot-add', (req, res) => {
  res.render('prepare/cannot-add', { org: req.params.org })
})

router.post('/prepare/contacts/:org/cannot-add', (req, res) => {
  const org = req.params.org
  const data = req.session.data
  if (blank(data[org + '-reason'])) {
    const errors = { reason: 'Enter why you are not able to add a contact' }
    return res.render('prepare/cannot-add', { org, errors, errorList: toErrorList(errors) })
  }
  data[org + '-status'] = 'cannot-add'
  res.redirect('/prepare/project')
})

// Record a decision (simplified to one page for this prototype)
router.get('/prepare/decision', (req, res) => res.render('prepare/decision'))

router.post('/prepare/decision', (req, res) => {
  const data = req.session.data
  if (blank(data.decision)) {
    const errors = { decision: 'Select the decision' }
    return res.render('prepare/decision', { errors, errorList: toErrorList(errors) })
  }
  if (data.decision === 'approved') {
    data.decidedAt = Date.now()
    return res.redirect('/prepare/decision-recorded')
  }
  res.redirect('/prepare/project')
})

router.get('/prepare/decision-recorded', (req, res) => res.render('prepare/decision-recorded'))

// ---------------------------------------------------------------------------
// COMPLETE
// ---------------------------------------------------------------------------

// Projects to hand over (current design)
router.get('/complete/projects-to-hand-over', (req, res) => {
  const data = req.session.data
  res.render('complete/projects-to-hand-over', {
    others: OTHER_PROJECTS,
    showOurs: data.decision === 'approved' && !data.handedOver,
    started: draftStarted(data),
    saved: req.query.saved === '1'
  })
})

// Check you have the right project (only when coming from the list)
router.get('/complete/handover/check-project', (req, res) => res.render('complete/check-project'))

router.post('/complete/handover/check-project', (req, res) => {
  res.redirect('/complete/handover/' + firstUnanswered(req.session.data))
})

// Holding page while Complete creates the project (5 to 60 seconds in the live service)
router.get('/complete/handover/setting-up', (req, res) => {
  res.render('complete/setting-up', { waitSeconds: Number(req.session.data['setup-delay'] || 6) })
})

router.get('/complete/handover/setting-up/check', (req, res) => {
  const data = req.session.data
  if (data.handedOver) return res.redirect('/complete/handover/already-handed-over')
  if (data['setup-outcome'] === 'timeout' && !req.query.retry) return res.redirect('/complete/handover/taking-longer')
  res.redirect('/complete/handover/' + firstUnanswered(data))
})

router.get('/complete/handover/taking-longer', (req, res) => res.render('complete/taking-longer'))
router.get('/complete/handover/already-handed-over', (req, res) => res.render('complete/already-handed-over'))

// Generic handler for handover question pages
function handoverStep (view, validate, next) {
  router.get('/complete/handover/' + view, (req, res) => {
    res.render('complete/' + view, { change: req.query.change === '1' })
  })
  router.post('/complete/handover/' + view, (req, res) => {
    const data = req.session.data
    const change = req.query.change === '1'
    if (req.body.action === 'save') return res.redirect('/complete/projects-to-hand-over?saved=1')
    const { errors, count } = validate(data)
    if (count) return res.render('complete/' + view, { errors, errorList: toErrorList(errors), change })
    const dest = typeof next === 'function' ? next(data, change) : next
    res.redirect(dest)
  })
}

handoverStep('rcs', (data) => {
  const e = {}
  if (blank(data.rcs)) e.rcs = 'Select yes if Regional Casework Services will manage this project'
  return { errors: e, count: Object.keys(e).length }
}, (data, change) => {
  // Changing No to Yes from check answers: required details must now be collected
  if (change && rcsYes(data) && validateHandoverDetails(data).count) return '/complete/handover/handover-details?change=1'
  return change ? '/complete/handover/check-answers' : '/complete/handover/handover-details'
})

handoverStep('handover-details', validateHandoverDetails, (data, change) => {
  // Throw away reasons that no longer apply
  if (data['date-discussed'] !== 'no') data['date-reason'] = ''
  if (data.proforma !== 'not-requested') data['proforma-reason'] = ''
  if (data['intro-email'] !== 'no') data['email-reason'] = ''
  data['details-seen'] = true
  return change ? '/complete/handover/check-answers' : '/complete/handover/sharepoint'
})

handoverStep('sharepoint', validateSharePoint, (data, change) => change ? '/complete/handover/check-answers' : '/complete/handover/two-ri')

handoverStep('two-ri', (data) => {
  const e = {}
  if (blank(data['two-ri'])) e['two-ri'] = 'Select yes if this conversion is due to intervention following 2RI'
  return { errors: e, count: Object.keys(e).length }
}, '/complete/handover/check-answers')

// Check answers
router.get('/complete/handover/check-answers', (req, res) => {
  const data = req.session.data
  const next = firstUnanswered(data)
  if (next !== 'check-answers') return res.redirect('/complete/handover/' + next)
  res.render('complete/check-answers')
})

router.post('/complete/handover/check-answers', (req, res) => {
  const data = req.session.data
  if (data.handedOver) return res.redirect('/complete/handover/already-handed-over')
  const next = firstUnanswered(data)
  if (next !== 'check-answers') return res.redirect('/complete/handover/' + next)
  data.handedOver = true
  res.redirect('/complete/handover/confirmation')
})

router.get('/complete/handover/confirmation', (req, res) => res.render('complete/confirmation'))

// Change a contact from check answers (contacts came from Prepare)
router.get('/complete/handover/contacts/:org', (req, res) => {
  res.render('complete/contact-details', { org: req.params.org })
})

router.post('/complete/handover/contacts/:org', (req, res) => {
  const org = req.params.org
  const data = req.session.data
  const { errors, count } = validateContact(data, org)
  if (count) return res.render('complete/contact-details', { org, errors, errorList: toErrorList(errors) })
  data[org + '-status'] = 'completed'
  data[org + '-reason'] = ''
  res.redirect('/complete/handover/check-answers')
})

module.exports = router
