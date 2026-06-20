const PLANS = {
  Starter: { price: 97,    monthly_lead_cap: 100 },
  Growth:  { price: 197,   monthly_lead_cap: 300 },
  Pro:     { price: 397,   monthly_lead_cap: 600 },
  Demo:    { price: 0,     monthly_lead_cap: 20  },
};

function getPlanConfig(planName) {
  return PLANS[planName] || PLANS.Demo;
}

function defaultCycleStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function getBillingCycleEnd(cycleStart) {
  if (!cycleStart) return null;
  const d = new Date(cycleStart);
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

// Count leads added during the billing cycle.
// Uses 'date_added' column when present (accurate per-cycle count).
// Falls back to total row count when that column is absent — this overcounts
// across months and is reported as usage_method: 'total_rows' so UIs can warn.
function calculateUsage(rows, cycleStart, cycleEnd) {
  if (!rows || rows.length < 2) return { count: 0, usage_method: 'none' };
  const headers = rows[0];
  const dateAddedIdx = headers.indexOf('date_added');

  if (dateAddedIdx === -1) {
    return { count: rows.length - 1, usage_method: 'total_rows' };
  }

  const start = new Date(cycleStart);
  const end = new Date(cycleEnd);
  end.setHours(23, 59, 59, 999);

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i][dateAddedIdx];
    if (!raw) continue;
    const d = new Date(raw);
    if (!isNaN(d) && d >= start && d <= end) count++;
  }
  return { count, usage_method: 'date_added' };
}

function warningLevel(pct) {
  if (pct >= 100) return 'at_limit';
  if (pct >= 80)  return 'warning_80';
  if (pct >= 50)  return 'warning_50';
  return null;
}

function buildPlanSummary(profile, rows) {
  const planName = profile?.plan_name || 'Demo';
  const { monthly_lead_cap } = getPlanConfig(planName);
  const cycleStart = profile?.billing_cycle_start || defaultCycleStart();
  const cycleEnd   = getBillingCycleEnd(cycleStart);
  const { count, usage_method } = calculateUsage(rows, cycleStart, cycleEnd);
  const remaining     = Math.max(0, monthly_lead_cap - count);
  const usage_percent = monthly_lead_cap > 0
    ? Math.min(100, Math.round((count / monthly_lead_cap) * 100))
    : 0;

  return {
    plan_name:              planName,
    monthly_lead_cap,
    billing_cycle_start:    cycleStart,
    billing_cycle_end:      cycleEnd,
    leads_added_this_cycle: count,
    remaining_leads:        remaining,
    usage_percent,
    at_limit:               count >= monthly_lead_cap,
    warning_level:          warningLevel(usage_percent),
    usage_method,
  };
}

module.exports = { PLANS, getPlanConfig, defaultCycleStart, getBillingCycleEnd, calculateUsage, warningLevel, buildPlanSummary };
