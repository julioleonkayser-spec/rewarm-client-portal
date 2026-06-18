export const agentProfile = {
  name: 'Sarah Chen',
  initials: 'SC',
  email: 'sarah.chen@compassaustin.com',
  phone: '(512) 887-4423',
  brokerage: 'Compass Austin',
  license: 'TX #0673891',
  market: 'Austin, TX',
  joinDate: '2024-01-08',
  specialties: ['Single Family', 'Luxury', 'First-Time Buyers'],
  priceRange: '$400K – $1.2M',
  website: 'sarahchenrealty.com',
  plan: 'ReWarm Pro',
  accessKey: 'REWARM-DEMO-2024',
};

export const STAGES = ['new', 'contacted', 'warm', 'qualified', 'booked', 'nurture'];

export const STAGE_CONFIG = {
  new:       { label: 'New',       bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-400' },
  contacted: { label: 'Contacted', bg: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-400' },
  warm:      { label: 'Warm',      bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400' },
  qualified: { label: 'Qualified', bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
  booked:    { label: 'Booked',    bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  nurture:   { label: 'Nurture',   bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-400' },
};

const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };

export const leads = [
  // Warm (8)
  { id: 1,  name: 'Marcus Webb',        email: 'marcus.webb@gmail.com',    phone: '(512) 441-7823', type: 'buyer',  priceRange: '$600K–$800K',   neighborhood: 'Round Rock',     stage: 'warm',      score: 85, lastContact: d(2),  addedDate: d(30),  source: 'Database', notes: 'Pre-approved at $750K. Spring timeline for school district transfer.' },
  { id: 2,  name: 'Jennifer Rodriguez', email: 'j.rodriguez@outlook.com',  phone: '(512) 334-9021', type: 'seller', priceRange: '$480K–$550K',   neighborhood: 'Cedar Park',     stage: 'warm',      score: 78, lastContact: d(4),  addedDate: d(45),  source: 'Database', notes: 'Wants to upsize. Ready when the right home hits the market.' },
  { id: 3,  name: 'David Kim',          email: 'dkim.austin@gmail.com',    phone: '(512) 709-4512', type: 'buyer',  priceRange: '$900K–$1.2M',   neighborhood: 'Tarrytown',      stage: 'warm',      score: 91, lastContact: d(1),  addedDate: d(20),  source: 'Referral', notes: 'Relocating from SF. Cash buyer. Moving Q2.' },
  { id: 4,  name: 'Ashley Turner',      email: 'ashley.t@gmail.com',       phone: '(512) 881-2233', type: 'buyer',  priceRange: '$350K–$450K',   neighborhood: 'Mueller',        stage: 'warm',      score: 72, lastContact: d(6),  addedDate: d(60),  source: 'Database', notes: 'First-time buyer. Pre-approval in progress.' },
  { id: 5,  name: 'Robert Torres',      email: 'rob.torres@icloud.com',    phone: '(512) 667-4891', type: 'seller', priceRange: '$720K–$800K',   neighborhood: 'Barton Hills',   stage: 'warm',      score: 82, lastContact: d(3),  addedDate: d(25),  source: 'Database', notes: 'Retiring to coast. Flexible timeline but motivated.' },
  { id: 6,  name: 'Monica Patel',       email: 'mpatel@gmail.com',         phone: '(512) 445-6621', type: 'buyer',  priceRange: '$550K–$700K',   neighborhood: 'West Lake Hills', stage: 'warm',     score: 76, lastContact: d(7),  addedDate: d(55),  source: 'Website',  notes: 'Browsing but engaged. Asked about WLH school rankings.' },
  { id: 7,  name: 'James Mitchell',     email: 'jmitch@yahoo.com',         phone: '(512) 773-0924', type: 'seller', priceRange: '$420K–$480K',   neighborhood: 'Hyde Park',      stage: 'warm',      score: 69, lastContact: d(9),  addedDate: d(90),  source: 'Database', notes: 'Divorce situation. Timing uncertain but will need to sell.' },
  { id: 8,  name: 'Laura Hernandez',    email: 'laura.h@gmail.com',        phone: '(512) 334-1199', type: 'buyer',  priceRange: '$400K–$520K',   neighborhood: 'South Congress', stage: 'warm',      score: 74, lastContact: d(5),  addedDate: d(40),  source: 'Open House', notes: 'Loved the SoCo vibe. Looking for walkability and character.' },

  // Qualified (7)
  { id: 9,  name: 'Carlos Reyes',       email: 'creyes@gmail.com',         phone: '(512) 884-3312', type: 'buyer',  priceRange: '$700K–$850K',   neighborhood: 'Domain',         stage: 'qualified', score: 94, lastContact: d(1),  addedDate: d(15),  source: 'Referral',    notes: 'Pre-approved $850K. Targeting Domain/North Austin. Ready to offer.' },
  { id: 10, name: 'Stephanie Chang',    email: 's.chang@gmail.com',        phone: '(512) 551-7748', type: 'seller', priceRange: '$600K–$680K',   neighborhood: 'East Austin',    stage: 'qualified', score: 88, lastContact: d(2),  addedDate: d(10),  source: 'Database',    notes: 'Investment property. ROI-focused. Q1 timeline preferred.' },
  { id: 11, name: 'Nathan Hughes',      email: 'nate.h@icloud.com',        phone: '(512) 661-4490', type: 'buyer',  priceRange: '$500K–$650K',   neighborhood: 'Leander',        stage: 'qualified', score: 87, lastContact: d(3),  addedDate: d(18),  source: 'Social Media', notes: 'New tech job at Apple campus. Relocating with family of 4.' },
  { id: 12, name: 'Diana Osei',         email: 'd.osei@gmail.com',         phone: '(512) 774-3300', type: 'seller', priceRange: '$380K–$430K',   neighborhood: 'Pflugerville',   stage: 'qualified', score: 83, lastContact: d(4),  addedDate: d(22),  source: 'Database',    notes: 'Ready to downsize. Spring listing target.' },
  { id: 13, name: 'Tyler Brooks',       email: 't.brooks@outlook.com',     phone: '(512) 223-8810', type: 'buyer',  priceRange: '$450K–$600K',   neighborhood: 'Steiner Ranch',  stage: 'qualified', score: 89, lastContact: d(1),  addedDate: d(12),  source: 'Referral',    notes: 'Moving from Dallas. Pre-approved. Wife has Austin job offer.' },
  { id: 14, name: 'Rachel Moore',       email: 'rmoore@gmail.com',         phone: '(512) 991-5571', type: 'seller', priceRange: '$800K–$950K',   neighborhood: 'Tarrytown',      stage: 'qualified', score: 92, lastContact: d(2),  addedDate: d(8),   source: 'Database',    notes: 'Executor of estate. Probate cleared. High-value listing.' },
  { id: 15, name: 'Brian Fletcher',     email: 'b.fletcher@yahoo.com',     phone: '(512) 441-8834', type: 'buyer',  priceRange: '$350K–$450K',   neighborhood: 'Kyle',           stage: 'qualified', score: 81, lastContact: d(5),  addedDate: d(28),  source: 'Database',    notes: 'Essential worker, FHA approved. Needs 3BR min.' },

  // Booked (4)
  { id: 16, name: 'Amanda Kowalski',    email: 'a.kowalski@gmail.com',     phone: '(512) 664-2210', type: 'buyer',  priceRange: '$600K–$750K',   neighborhood: 'Round Rock',     stage: 'booked',    score: 96, lastContact: d(0),  addedDate: d(7),   source: 'Referral', notes: 'Consultation Saturday 10am. Very motivated.' },
  { id: 17, name: "Kevin O'Brien",      email: 'k.obrien@icloud.com',      phone: '(512) 779-6612', type: 'seller', priceRange: '$520K–$580K',   neighborhood: 'Cedar Park',     stage: 'booked',    score: 95, lastContact: d(1),  addedDate: d(9),   source: 'Database', notes: 'Listing appointment Thursday. Home clean and ready.' },
  { id: 18, name: 'Priya Sharma',       email: 'priya.sharma@gmail.com',   phone: '(512) 882-4453', type: 'buyer',  priceRange: '$900K–$1.1M',   neighborhood: 'Lakeway',        stage: 'booked',    score: 97, lastContact: d(1),  addedDate: d(5),   source: 'Referral', notes: 'Cash buyer. Tour scheduled for 3 homes this weekend.' },
  { id: 19, name: 'Derek Santos',       email: 'd.santos@yahoo.com',       phone: '(512) 446-9920', type: 'seller', priceRange: '$440K–$490K',   neighborhood: 'Buda',           stage: 'booked',    score: 93, lastContact: d(2),  addedDate: d(14),  source: 'Database', notes: 'Listing walkthrough booked. Job relocation.' },

  // Contacted (15)
  { id: 20, name: 'Chris Yamamoto',     email: 'c.yama@gmail.com',         phone: '(512) 552-8812', type: 'buyer',  priceRange: '$500K–$650K',   neighborhood: 'North Loop',     stage: 'contacted', score: 65, lastContact: d(3),  addedDate: d(35),  source: 'Database', notes: 'Replied to text. Said "maybe later this year." Follow up June.' },
  { id: 21, name: 'Tiffany Lin',        email: 't.lin@outlook.com',        phone: '(512) 887-3341', type: 'seller', priceRange: '$380K–$420K',   neighborhood: 'Travis Heights', stage: 'contacted', score: 58, lastContact: d(5),  addedDate: d(50),  source: 'Database', notes: 'Picked up call. Not ready yet but open to conversation.' },
  { id: 22, name: 'Jason Park',         email: 'j.park@gmail.com',         phone: '(512) 663-4412', type: 'buyer',  priceRange: '$600K–$750K',   neighborhood: 'West Lake Hills', stage: 'contacted', score: 70, lastContact: d(6),  addedDate: d(42),  source: 'Social Media', notes: 'Liked Instagram post. Sent DM with market report.' },
  { id: 23, name: 'Vanessa Martin',     email: 'v.martin@gmail.com',       phone: '(512) 993-2210', type: 'seller', priceRange: '$550K–$620K',   neighborhood: 'Barton Hills',   stage: 'contacted', score: 62, lastContact: d(7),  addedDate: d(65),  source: 'Database', notes: 'Left voicemail ×2. Texted — seen. No reply yet.' },
  { id: 24, name: 'Ryan Mulligan',      email: 'r.mulligan@icloud.com',    phone: '(512) 441-7761', type: 'buyer',  priceRange: '$400K–$500K',   neighborhood: 'Mueller',        stage: 'contacted', score: 61, lastContact: d(8),  addedDate: d(55),  source: 'Database', notes: 'Spoke briefly. Interest level 3/5. Re-engage in 30 days.' },
  { id: 25, name: 'Elena Vasquez',      email: 'e.vasquez@yahoo.com',      phone: '(512) 554-9923', type: 'seller', priceRange: '$480K–$540K',   neighborhood: 'Cedar Park',     stage: 'contacted', score: 67, lastContact: d(9),  addedDate: d(48),  source: 'Database', notes: 'Sent market snapshot. She acknowledged — timing still unclear.' },
  { id: 26, name: 'Michael Okafor',     email: 'm.okafor@gmail.com',       phone: '(512) 779-1134', type: 'buyer',  priceRange: '$700K–$900K',   neighborhood: 'Domain',         stage: 'contacted', score: 73, lastContact: d(4),  addedDate: d(30),  source: 'Referral', notes: 'Referred by past client. Spoke 8 mins. Not in rush but warm.' },
  { id: 27, name: 'Madison Kelly',      email: 'madkelly@gmail.com',       phone: '(512) 882-5500', type: 'buyer',  priceRange: '$300K–$380K',   neighborhood: 'Pflugerville',   stage: 'contacted', score: 55, lastContact: d(10), addedDate: d(72),  source: 'Database', notes: 'FHA route. Credit needs +20 pts. Check Q3.' },
  { id: 28, name: 'Jason Rivera',       email: 'j.rivera@gmail.com',       phone: '(512) 441-2298', type: 'seller', priceRange: '$650K–$750K',   neighborhood: 'East Austin',    stage: 'contacted', score: 68, lastContact: d(11), addedDate: d(80),  source: 'Database', notes: 'Sent email with sold comps. No reply yet. Try call next.' },
  { id: 29, name: 'Sophie Nguyen',      email: 's.nguyen@icloud.com',      phone: '(512) 667-3319', type: 'buyer',  priceRange: '$450K–$600K',   neighborhood: 'Lakeway',        stage: 'contacted', score: 64, lastContact: d(12), addedDate: d(88),  source: 'Database', notes: 'Texted back "still thinking." Interested in lakefront.' },
  { id: 30, name: 'Ben Calloway',       email: 'b.calloway@yahoo.com',     phone: '(512) 993-8847', type: 'seller', priceRange: '$390K–$440K',   neighborhood: 'Buda',           stage: 'contacted', score: 59, lastContact: d(14), addedDate: d(95),  source: 'Database', notes: 'Short call. Wife not on same page. Patience needed.' },
  { id: 31, name: 'Angela Price',       email: 'a.price@gmail.com',        phone: '(512) 552-7791', type: 'buyer',  priceRange: '$550K–$700K',   neighborhood: 'Steiner Ranch',  stage: 'contacted', score: 66, lastContact: d(13), addedDate: d(100), source: 'Database', notes: 'Interested in golf course homes. Sent 3 listings. Awaiting feedback.' },
  { id: 32, name: 'Luke Harrison',      email: 'l.harrison@gmail.com',     phone: '(512) 774-0013', type: 'seller', priceRange: '$320K–$370K',   neighborhood: 'Kyle',           stage: 'contacted', score: 57, lastContact: d(15), addedDate: d(110), source: 'Database', notes: 'First contact went well. Q4 listing. Mark for September.' },
  { id: 33, name: 'Natalie Cruz',       email: 'n.cruz@outlook.com',       phone: '(512) 663-1188', type: 'buyer',  priceRange: '$600K–$800K',   neighborhood: 'Hyde Park',      stage: 'contacted', score: 71, lastContact: d(8),  addedDate: d(60),  source: 'Website',  notes: 'Downloaded buyer guide from site. Followed up via email.' },
  { id: 34, name: 'Eric Zhao',          email: 'e.zhao@gmail.com',         phone: '(512) 887-4490', type: 'buyer',  priceRange: '$1M–$1.3M',     neighborhood: 'Tarrytown',      stage: 'contacted', score: 75, lastContact: d(6),  addedDate: d(45),  source: 'Referral', notes: 'Executive relocation. Big budget but not in Austin often.' },

  // New (12)
  { id: 35, name: 'Patricia Donovan',   email: 'p.donovan@icloud.com',     phone: '(512) 441-5521', type: 'seller', priceRange: '$480K–$540K',   neighborhood: 'Round Rock',     stage: 'new', score: 50, lastContact: null, addedDate: d(2), source: 'Database', notes: '' },
  { id: 36, name: 'Samuel Wright',      email: 's.wright@gmail.com',       phone: '(512) 882-3312', type: 'buyer',  priceRange: '$500K–$650K',   neighborhood: 'North Loop',     stage: 'new', score: 55, lastContact: null, addedDate: d(2), source: 'Database', notes: '' },
  { id: 37, name: 'Claire Fontaine',    email: 'c.fontaine@yahoo.com',     phone: '(512) 779-8843', type: 'seller', priceRange: '$650K–$780K',   neighborhood: 'Barton Hills',   stage: 'new', score: 48, lastContact: null, addedDate: d(3), source: 'Database', notes: '' },
  { id: 38, name: 'Tom Gallagher',      email: 't.gallagher@gmail.com',    phone: '(512) 554-2214', type: 'buyer',  priceRange: '$400K–$500K',   neighborhood: 'Georgetown',     stage: 'new', score: 52, lastContact: null, addedDate: d(3), source: 'Database', notes: '' },
  { id: 39, name: 'Maria Santos',       email: 'm.santos@outlook.com',     phone: '(512) 993-6677', type: 'seller', priceRange: '$350K–$400K',   neighborhood: 'Pflugerville',   stage: 'new', score: 45, lastContact: null, addedDate: d(4), source: 'Database', notes: '' },
  { id: 40, name: 'Josh Brennan',       email: 'j.brennan@icloud.com',     phone: '(512) 441-9901', type: 'buyer',  priceRange: '$700K–$900K',   neighborhood: 'West Lake Hills', stage: 'new', score: 58, lastContact: null, addedDate: d(4), source: 'Database', notes: '' },
  { id: 41, name: 'Olivia Cheng',       email: 'o.cheng@gmail.com',        phone: '(512) 663-7723', type: 'buyer',  priceRange: '$500K–$650K',   neighborhood: 'Mueller',        stage: 'new', score: 54, lastContact: null, addedDate: d(5), source: 'Database', notes: '' },
  { id: 42, name: 'Will Patterson',     email: 'w.patterson@yahoo.com',    phone: '(512) 887-5520', type: 'seller', priceRange: '$420K–$470K',   neighborhood: 'Cedar Park',     stage: 'new', score: 47, lastContact: null, addedDate: d(5), source: 'Database', notes: '' },
  { id: 43, name: 'Isabel Ferreira',    email: 'i.ferreira@gmail.com',     phone: '(512) 774-2200', type: 'buyer',  priceRange: '$600K–$750K',   neighborhood: 'South Congress', stage: 'new', score: 56, lastContact: null, addedDate: d(6), source: 'Database', notes: '' },
  { id: 44, name: 'Garrett Young',      email: 'g.young@outlook.com',      phone: '(512) 552-1188', type: 'seller', priceRange: '$590K–$660K',   neighborhood: 'Lakeway',        stage: 'new', score: 51, lastContact: null, addedDate: d(6), source: 'Database', notes: '' },
  { id: 45, name: 'Kim Andersen',       email: 'k.andersen@icloud.com',    phone: '(512) 441-3344', type: 'buyer',  priceRange: '$800K–$1.0M',   neighborhood: 'Tarrytown',      stage: 'new', score: 60, lastContact: null, addedDate: d(7), source: 'Referral', notes: 'Referred by Marcus Webb. Cash + pre-approved.' },
  { id: 46, name: 'Paul Ingram',        email: 'p.ingram@gmail.com',       phone: '(512) 993-4412', type: 'seller', priceRange: '$470K–$530K',   neighborhood: 'Domain',         stage: 'new', score: 49, lastContact: null, addedDate: d(7), source: 'Database', notes: '' },

  // Nurture (2)
  { id: 47, name: 'Diane Walsh',        email: 'd.walsh@gmail.com',        phone: '(512) 779-6634', type: 'seller', priceRange: '$700K–$850K',   neighborhood: 'Hyde Park',      stage: 'nurture', score: 40, lastContact: d(30), addedDate: d(180), source: 'Database', notes: 'Market not right yet per her. Check back mid-year.' },
  { id: 48, name: 'Frank Limon',        email: 'f.limon@yahoo.com',        phone: '(512) 882-0019', type: 'buyer',  priceRange: '$350K–$500K',   neighborhood: 'Kyle',           stage: 'nurture', score: 35, lastContact: d(45), addedDate: d(200), source: 'Database', notes: 'Job uncertainty. On hold. Friendly — worth keeping warm.' },
];

export const scripts = [
  {
    id: 1, category: 'call', type: 'seller', title: 'Market Shift Opener',
    description: 'For sellers who went cold 3–12 months ago. Use when you have real neighborhood data.',
    script: `Hi, is this [First Name]? This is [Your Name] with [Brokerage] — I hope I'm catching you at a good time.\n\nI reached out a while back when you were thinking about selling, and I completely understand if life moved on. I'm calling because the market in [Neighborhood] has shifted pretty significantly — four homes closed above asking price in the last 30 days, and days on market dropped to under two weeks.\n\nI wanted to give you a heads-up personally, before summer inventory increases and that leverage shifts. Would you have five minutes to hear what homes like yours are doing right now?`,
    tip: "Lead with the neighborhood stat immediately — it signals you've done your homework.",
    tags: ['market', 'leverage', 'timing'],
  },
  {
    id: 2, category: 'call', type: 'seller', title: 'Neighbor Activity Opener',
    description: 'When a nearby property just sold or listed. Creates urgency through social proof.',
    script: `Hi [First Name], this is [Your Name] from [Brokerage]. Quick question — did you hear about the sale on [Nearby Street] last week?\n\nYour neighbor closed at [$X], which is [X%] above what comps were showing six months ago. I've been helping a few homeowners in [Neighborhood] understand what that means for their equity position, and I realized I hadn't circled back with you.\n\nI'm not calling to pressure you — I just thought that information was relevant. Would it be useful to know what your home might realistically be worth today?`,
    tip: "Even without a specific address, citing a recent neighborhood comp works. Have the data ready before you call.",
    tags: ['social-proof', 'equity', 'comps'],
  },
  {
    id: 3, category: 'call', type: 'seller', title: 'Direct Value Pitch',
    description: 'Confident, ROI-focused. Best for investment property sellers.',
    script: `Hi [First Name], this is [Your Name] — I'll keep this quick. I work with sellers in [Neighborhood] and I noticed your property has been in my system for a while. Based on what I'm seeing today, there's a window right now where you could net meaningfully more than you'd expect.\n\nI don't want to throw numbers around without knowing your situation — but if you had 10 minutes this week, I could pull together a proper valuation and you can decide if the numbers make sense. No obligation. Would Thursday or Friday morning work?`,
    tip: "Short and direct. Works well for investors or business-minded sellers who respect efficiency.",
    tags: ['direct', 'investment', 'ROI'],
  },
  {
    id: 4, category: 'call', type: 'seller', title: 'Seasonal Window',
    description: 'Spring or fall transition window. Creates natural timeline urgency.',
    script: `Hi [First Name], it's [Your Name] with [Brokerage]. I'm calling a handful of homeowners I've stayed in touch with because we're right at the point where listing decisions made in the next 3–4 weeks will either catch the spring surge or miss it entirely.\n\nI know when we spoke before, the timing wasn't right. I'm not assuming anything's changed — but if there's any chance you'd consider making a move this year, the next 30 days might be the best window we've had in 18 months. Would it make sense to have a 10-minute conversation?`,
    tip: "Use this late January through early March. Adapt to fall equivalent in August–September.",
    tags: ['seasonal', 'urgency', 'spring'],
  },
  {
    id: 5, category: 'call', type: 'buyer', title: 'Rate Shift Check-In',
    description: 'Reactivate buyers who went cold after rate concerns.',
    script: `Hi [First Name], this is [Your Name] from [Brokerage]. I'm reaching out because I remember when we last spoke, rates were a concern — totally understandable. I wanted to flag that we've seen some movement that might change the math for you.\n\nI'm not saying it's the perfect moment, but I've been running numbers for a few buyers in your situation and the difference is real enough that I thought it was worth a quick call. Would you have 10 minutes to revisit what the numbers would look like for you today?`,
    tip: "Always have a real rate scenario ready. Credibility depends on having specific current numbers.",
    tags: ['rates', 'buyers', 'timing'],
  },
  {
    id: 6, category: 'call', type: 'buyer', title: 'New Listing Alert',
    description: 'A specific property just came up matching their criteria.',
    script: `Hi [First Name], this is [Your Name] — I have a quick heads-up. A home just came on the market in [Neighborhood] that matches almost exactly what you described when we spoke. It's [brief description: 4BR, updated kitchen] and priced at [$X].\n\nHomes like this in [Neighborhood] typically move in under a week. I can get you a private showing before it hits the weekend market if you're interested. Worth a look? I can send the details right now.`,
    tip: "Never fake a listing — this only works when you have a real property. The specificity is what converts.",
    tags: ['listing', 'urgency', 'specific'],
  },
  {
    id: 7, category: 'sms', type: 'seller', title: 'Post-Voicemail Text',
    description: 'Send within 15 minutes of leaving a voicemail.',
    script: `Hi [Name], it's [Your Name] — I left you a quick voicemail. Just wanted to follow up here since most people text more than call these days. I had some market news specific to [Neighborhood] I thought you'd want to hear. No pressure at all — reply whenever works for you.`,
    tip: "Keep it casual. No emojis. The goal is just a reply.",
    tags: ['follow-up', 'low-pressure'],
  },
  {
    id: 8, category: 'sms', type: 'seller', title: 'Market Snapshot',
    description: 'Lead with value before asking for anything.',
    script: `Hi [Name], [Your Name] here. Quick market update: [Neighborhood] homes are selling in under 2 weeks right now, and prices are up [X]% from last year. Thought you'd want to know given where we left things. Happy to pull a no-obligation home value estimate if you're curious — just reply here.`,
    tip: "Real stats build credibility instantly. Always use current data.",
    tags: ['value', 'market', 'no-pressure'],
  },
  {
    id: 9, category: 'sms', type: 'buyer', title: 'Soft Re-Engage',
    description: 'Low-pressure check-in for buyers who went quiet.',
    script: `Hey [Name] — [Your Name] checking in. No agenda, just wanted to see if anything has shifted in your timeline or what you're looking for. The market has some interesting things happening in [Neighborhood] right now. Happy to chat or just send you a quick update if that's more useful.`,
    tip: 'The "no agenda" framing lowers resistance. Works especially well after 60+ days of silence.',
    tags: ['check-in', 'buyers', 'low-pressure'],
  },
  {
    id: 10, category: 'sms', type: 'seller', title: 'Equity Teaser',
    description: "Creates curiosity about their home's value. High open rate.",
    script: `Hi [Name], I was looking at recent closes in [Neighborhood] and I think you'd actually be surprised at where your home sits right now. If you have 5 minutes, I can share a quick breakdown — no commitment at all. Worth a look?`,
    tip: "Don't give the number upfront. The curiosity gap drives replies.",
    tags: ['equity', 'curiosity', 'high-converting'],
  },
  {
    id: 11, category: 'sms', type: 'buyer', title: 'Listing Drop Alert',
    description: 'When a specific match comes on market.',
    script: `[Name] — [Your Name] here. A home just hit the market in [Neighborhood] that checks most of your boxes: [2 key details e.g. "4BR, good schools, updated kitchen"]. Priced at [$X]. Goes live this weekend but I can get you a preview. Interested?`,
    tip: "Specificity converts. A generic 'new listing' doesn't work. This does.",
    tags: ['listing', 'specific', 'urgent'],
  },
  {
    id: 12, category: 'voicemail', type: 'seller', title: 'Market Update VM',
    description: 'Versatile voicemail for any cold seller reactivation.',
    script: `Hi [First Name], this is [Your Name] with [Brokerage]. I'm leaving you a quick message — I've been watching the market in [Neighborhood] closely and there's been some movement I think would be relevant to you. Nothing urgent, but I thought it was worth a quick conversation.\n\nMy direct number is [Phone]. Feel free to call or text any time — I'll keep it brief. Thanks, [First Name].`,
    tip: "Keep voicemails under 30 seconds. Slow down at your phone number.",
    tags: ['voicemail', 'casual', 'brief'],
  },
  {
    id: 13, category: 'voicemail', type: 'seller', title: 'Neighbor Sold VM',
    description: 'Reference a recent nearby sale for context and urgency.',
    script: `Hi [First Name], [Your Name] from [Brokerage]. I wanted to let you know that a home very close to you just went under contract, and the numbers were strong. I'm reaching out to a handful of homeowners in the area because I think it opens up a real opportunity.\n\nCall or text me at [Phone] if you want a quick rundown. I didn't want to hold the information back. Thanks.`,
    tip: "If you don't know a specific neighbor, 'a home right near you' still works.",
    tags: ['voicemail', 'comps', 'urgency'],
  },
  {
    id: 14, category: 'voicemail', type: 'buyer', title: 'Buyer Rate Check-In VM',
    description: 'For buyers who went cold due to rate concerns.',
    script: `Hi [First Name], this is [Your Name] with [Brokerage]. I'm calling because I know rates were a sticking point when we last spoke, and there's been some movement recently I wanted to make sure you were aware of. I won't assume anything's changed, but I think it's worth a 10-minute conversation to see if the numbers work better now.\n\nGive me a call at [Phone] or text me — whatever's easier. Thanks.`,
    tip: "Acknowledge the past objection directly — it shows you listened.",
    tags: ['voicemail', 'buyers', 'rates'],
  },
  {
    id: 15, category: 'voicemail', type: 'buyer', title: 'Referral Name Drop VM',
    description: 'When reaching out to a buyer referred by a past client.',
    script: `Hi [First Name], this is [Your Name] with [Brokerage]. [Referrer Name] suggested I give you a call — apparently you're thinking about [buying/selling] in Austin and thought we should connect.\n\nI'd love to hear about what you're looking for. Reach me at [Phone] or just text — either works.`,
    tip: "Warm leads convert 5–8x higher than cold ones. Always lead with the referrer's name.",
    tags: ['voicemail', 'referral', 'warm-lead'],
  },
  {
    id: 16, category: 'objection', type: 'seller', title: '"We\'re Not Ready Yet"',
    description: 'The most common objection. Reframes timeline while staying in the conversation.',
    script: `That makes total sense — and honestly, I'd rather have this conversation before you're ready than after. The reason I'm reaching out now is that the best sellers get a head start: small prep decisions made 30–60 days out can add tens of thousands to your net proceeds.\n\nI'm not asking you to list tomorrow. I'm just suggesting a 20-minute chat so that when you are ready, you have a real plan in place. Would that kind of conversation be useful?`,
    tip: "Validate the objection, then reframe the value of the conversation itself.",
    tags: ['objection', 'timing', 'patience'],
  },
  {
    id: 17, category: 'objection', type: 'seller', title: '"We Already Have an Agent"',
    description: 'Handle gracefully without attacking the competitor.',
    script: `Absolutely — I completely respect that relationship. I'm not here to step on that at all. If you ever feel like it's not working out or things stall, just know I'm available.\n\nCan I ask — do you have a specific timeline in mind? Just so I understand where you are.`,
    tip: "Never badmouth the other agent. Stay gracious and plant a seed. The question at the end keeps the door open.",
    tags: ['objection', 'competitor', 'graceful'],
  },
  {
    id: 18, category: 'objection', type: 'buyer', title: '"Waiting for Prices to Drop"',
    description: 'For buyers sitting on the sidelines waiting for a market correction.',
    script: `I hear that — and it's a reasonable instinct. Here's the challenge: nobody knows exactly when prices will drop, and if rates come down first, more buyers enter the market and that usually pushes prices back up anyway.\n\nWhat I'd encourage is this: instead of timing the market, we focus on finding the right home at a price that works for you today. We can also negotiate seller concessions that effectively lower your rate. The math might surprise you. Would it be worth 20 minutes running those numbers together?`,
    tip: "Validate the logic, then shift the frame from 'market timing' to 'deal finding.'",
    tags: ['objection', 'buyers', 'pricing', 'reframe'],
  },
];

export const assets = [
  { id: 1, title: 'ReWarm SOP: 30-Day Lead Reactivation Sequence', type: 'pdf',   category: 'sop',        description: 'Complete step-by-step playbook for running your first reactivation campaign from import to booked appointment.', version: '1.2', pages: 12, featured: true,  downloadUrl: '#' },
  { id: 2, title: 'Cold Lead Tracking Spreadsheet',                  type: 'xlsx',  category: 'template',   description: 'Pre-built Google Sheets tracker with formulas, lead scores, and stage logic built in.',                       version: '2.0',             featured: true,  downloadUrl: '#' },
  { id: 3, title: 'Objection Handling Quick Reference',               type: 'pdf',   category: 'reference',  description: 'One-page cheat sheet with 12 common objections and tight, tested responses you can use on any call.',          version: '1.0', pages: 1,  featured: false, downloadUrl: '#' },
  { id: 4, title: 'AI Script Personalization Guide',                  type: 'pdf',   category: 'guide',      description: 'How to adapt every ReWarm script to sound exactly like you — not a template. Includes 10 real examples.',      version: '1.1', pages: 8,  featured: false, downloadUrl: '#' },
  { id: 5, title: 'CRM Import Template (CSV)',                        type: 'csv',   category: 'template',   description: 'Clean CSV template with required headers to paste your database into the portal in under 5 minutes.',           version: '1.0',             featured: false, downloadUrl: '#' },
  { id: 6, title: 'SMS Compliance Checklist',                         type: 'pdf',   category: 'compliance', description: 'TCPA and state-level SMS rules for real estate agents. Updated Q1 2024. Reviewed by real estate attorney.',   version: '1.3', pages: 4,  featured: false, downloadUrl: '#' },
  { id: 7, title: 'Weekly 90-Min Call Block Template',                type: 'pdf',   category: 'template',   description: 'Time-blocking framework for a 90-minute weekly reactivation call session that consistently produces results.', version: '1.0', pages: 2,  featured: false, downloadUrl: '#' },
  { id: 8, title: 'ReWarm Onboarding Walkthrough Video',              type: 'video', category: 'guide',      description: '22-minute screen recording walking through the full portal setup and how to run your first campaign.',          version: '1.0',             featured: true,  downloadUrl: '#' },
];

export const weeklyActivity = [
  { week: 'Week 1', contacted: 4,  replied: 1, qualified: 0 },
  { week: 'Week 2', contacted: 8,  replied: 3, qualified: 1 },
  { week: 'Week 3', contacted: 13, replied: 5, qualified: 2 },
  { week: 'Week 4', contacted: 10, replied: 4, qualified: 1 },
  { week: 'Week 5', contacted: 15, replied: 7, qualified: 3 },
  { week: 'Week 6', contacted: 9,  replied: 4, qualified: 1 },
  { week: 'Week 7', contacted: 12, replied: 5, qualified: 2 },
  { week: 'Week 8', contacted: 7,  replied: 3, qualified: 1 },
];

export const STAGE_CHART_DATA = [
  { name: 'New',       count: 12, fill: '#94a3b8' },
  { name: 'Contacted', count: 15, fill: '#38bdf8' },
  { name: 'Warm',      count: 8,  fill: '#fbbf24' },
  { name: 'Qualified', count: 7,  fill: '#fb923c' },
  { name: 'Booked',    count: 4,  fill: '#34d399' },
  { name: 'Nurture',   count: 2,  fill: '#a78bfa' },
];

export const ONBOARDING_CHECKLIST = [
  { id: 1, label: 'Import your cold leads',                 done: true  },
  { id: 2, label: 'Set up your market profile',             done: true  },
  { id: 3, label: 'Review your first call script',          done: false },
  { id: 4, label: 'Run your first 90-min call block',       done: false },
  { id: 5, label: 'Book your first reactivated appointment', done: false },
];

// ── Derived: powers the dashboard "Today's Focus", KPI deltas, and weekly goal ──

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const SCRIPT_FOR = {
  seller: { call: 'Market Shift Opener', sms: 'Equity Teaser' },
  buyer:  { call: 'Rate Shift Check-In', sms: 'Soft Re-Engage' },
};

// The 5 leads most worth a touch right now: highest intent, going stale.
export const priorityActions = leads
  .filter((l) => ['qualified', 'warm'].includes(l.stage))
  .map((l) => ({ ...l, days: daysSince(l.lastContact) }))
  .sort((a, b) => b.score - a.score || (b.days || 0) - (a.days || 0))
  .slice(0, 5)
  .map((l) => {
    const channel = l.score >= 85 ? 'call' : 'sms';
    const stale = (l.days || 0) >= 4;
    const reason =
      l.stage === 'qualified'
        ? `Qualified · ${l.days === 0 ? 'touched today' : `${l.days}d since last touch`} · ready to move`
        : `Warm · score ${l.score} · ${l.days === 0 ? 'touched today' : `${l.days}d quiet`}`;
    return {
      id: l.id,
      name: l.name,
      type: l.type,
      stage: l.stage,
      neighborhood: l.neighborhood,
      priceRange: l.priceRange,
      score: l.score,
      channel,
      stale,
      reason,
      suggestedScript: SCRIPT_FOR[l.type][channel],
      note: l.notes,
    };
  });

// Week-over-week movement shown on KPI cards. Positive momentum tells a story.
export const kpiTrends = {
  total:     { delta: 6, dir: 'up' },
  contacted: { delta: 9, dir: 'up' },
  warm:      { delta: 3, dir: 'up' },
  qualified: { delta: 2, dir: 'up' },
  booked:    { delta: 2, dir: 'up' },
};

// This week's call goal — gives the dashboard a sense of pace and progress.
export const weeklyGoal = { target: 25, completed: 18, label: 'reactivation calls logged' };

// Small market-credibility stats used as conversion-aware proof points.
export const marketPulse = [
  { label: 'Avg. days on market', value: '11', trend: 'down', note: 'Austin metro, last 30d' },
  { label: 'Homes sold over ask', value: '38%', trend: 'up', note: 'in your price band' },
  { label: 'Median sale price', value: '$612K', trend: 'up', note: '+4.1% YoY' },
];
