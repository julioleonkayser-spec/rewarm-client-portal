// Default profile shown before the agent fills in Settings.
// This is NOT tied to leads or call data — it's just account display info.
export const agentProfile = {
  name: 'Your Name',
  initials: 'YN',
  email: '',
  phone: '',
  brokerage: '',
  license: '',
  market: '',
  joinDate: new Date().toISOString().split('T')[0],
  specialties: [],
  priceRange: '',
  website: '',
  plan: 'ReWarm',
  accessKey: 'REWARM-DEMO-2024',
};

export const ONBOARDING_CHECKLIST = [
  { id: 1, label: 'Add your leads to the Google Sheet',      done: true  },
  { id: 2, label: 'Set up your market profile',              done: true  },
  { id: 3, label: 'Connect your Retell and Claude API keys', done: false },
  { id: 4, label: 'Start your first call batch',             done: false },
  { id: 5, label: 'Book your first reactivated appointment', done: false },
];
