// ─── MONTHLY REPORT — EMAIL HTML ───
// Renders the object from gatherMonthlyReportData() into an email-safe HTML string
// (table layout, inline styles). No-fabrication: missing sections show an honest
// pending/baseline state; a delta renders ONLY when both months have like-for-like
// data — never a green improvement built on a partial month.

const GOLD = '#C9A84C'
const BG = '#F8F5EF'
const TEXT = '#2A1A0E'
const MUTED = '#8a7a6a'
const CARD = '#ffffff'
const LINE = '#e7dfd2'
const UP = '#2e7d32'
const DOWN = '#c0392b'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c])
}
function fmtMonth(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '')
  if (!m) return ym || ''
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${names[parseInt(m[2], 10) - 1]} ${m[1]}`
}
function delta(cur: number | null | undefined, prev: number | null | undefined): string {
  if (cur === null || cur === undefined) return `<span style="color:${MUTED}">still scoring</span>`
  if (prev === null || prev === undefined) return `<span style="color:${MUTED}">baseline</span>`
  const d = cur - prev
  if (d > 0) return `<span style="color:${UP};font-weight:600">&#9650; +${d}</span>`
  if (d < 0) return `<span style="color:${DOWN};font-weight:600">&#9660; ${d}</span>`
  return `<span style="color:${MUTED}">no change</span>`
}
function sectionWrap(title: string, inner: string): string {
  return `<tr><td style="padding:24px 32px;border-bottom:1px solid ${LINE};">
    <div style="font-family:Georgia,serif;color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">${title}</div>
    ${inner}
  </td></tr>`
}

function header(name: string, monthLabel: string): string {
  return `<tr><td style="background:${TEXT};padding:28px 32px;">
    <div style="font-family:Georgia,serif;color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;">SwissNet Hotels &middot; Monthly Report</div>
    <div style="font-family:Georgia,serif;color:#ffffff;font-size:26px;margin-top:8px;">${name}</div>
    <div style="font-family:Georgia,serif;color:#c9bda8;font-size:14px;margin-top:4px;">AI Visibility Summary &middot; ${monthLabel}</div>
  </td></tr>`
}

function visibilitySection(d: any, monthLabel: string, prevLabel: string): string {
  const t = d.visibility?.thisMonth || {}
  const l = d.visibility?.lastMonth || null
  const baseline = d.visibility?.baseline
  const rows: [string, number | null, number | null][] = [
    ['ChatGPT', t.chatgpt ?? null, l?.chatgpt ?? null],
    ['Perplexity', t.perplexity ?? null, l?.perplexity ?? null],
    ['Google AI', t.googleAi ?? null, l?.googleAi ?? null],
  ]
  const pending = rows.filter(([, cur, prev]) => cur === null && prev !== null).map(r => r[0])

  let movement: string
  if (baseline || !l) {
    movement = `<span style="color:${MUTED}">First tracked month &mdash; this is your baseline.</span>`
  } else if (pending.length) {
    const scored = rows.filter(([, cur, prev]) => cur !== null && prev !== null)
    const parts = scored.map(([n, cur, prev]) => `${n} ${delta(cur, prev)}`).join(' &middot; ')
    movement = `${parts}${parts ? ' &middot; ' : ''}<span style="color:${MUTED}">${pending.join(' &amp; ')} still scoring for ${monthLabel}</span>`
  } else {
    movement = `Overall ${delta(t.overall, l.overall)} vs ${prevLabel}`
  }

  const bodyRows = rows.map(([name, cur, prev]) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;">${name}</td>
    <td align="center" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${MUTED};font-size:14px;">${prev ?? '&mdash;'}</td>
    <td align="center" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:15px;font-weight:600;">${cur ?? '&mdash;'}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;font-size:13px;">${delta(cur, prev)}</td>
  </tr>`).join('')

  return sectionWrap('01 &middot; AI Visibility Score', `
    <div style="padding-bottom:14px;">
      <span style="font-family:Georgia,serif;font-size:44px;color:${GOLD};">${t.overall ?? '&mdash;'}</span>
      <span style="font-family:Georgia,serif;font-size:15px;color:${MUTED};"> / 100 overall</span>
      <div style="font-family:Georgia,serif;font-size:13px;margin-top:6px;">${movement}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Platform</td>
        <td align="center" style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">${prevLabel}</td>
        <td align="center" style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">${monthLabel}</td>
        <td align="right" style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Change</td>
      </tr>
      ${bodyRows}
    </table>`)
}

function competitorSection(d: any, monthLabel: string): string {
  const lb = d.competitors || []
  if (!lb.length) {
    return sectionWrap('02 &middot; Competitor Comparison', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">No competitor visibility recorded for ${monthLabel} yet &mdash; populates once the month's cross-platform scoring runs.</p>`)
  }
  const youIn = lb.some((c: any) => c.isYou)
  const rows = lb.map((c: any) => {
    const bg = c.isYou ? BG : 'transparent'
    const weight = c.isYou ? '700' : '400'
    const tag = c.isYou ? ` <span style="color:${GOLD};font-size:11px;">(You)</span>` : ''
    return `<tr style="background:${bg};">
      <td style="padding:9px 8px;font-family:Georgia,serif;color:${TEXT};font-size:14px;">${c.rank}</td>
      <td style="padding:9px 8px;font-family:Georgia,serif;color:${TEXT};font-size:14px;font-weight:${weight};">${esc(c.name)}${tag}</td>
      <td align="right" style="padding:9px 8px;font-family:Georgia,serif;color:${TEXT};font-size:14px;font-weight:${weight};">${c.score}</td>
    </tr>`
  }).join('')
  const note = youIn ? '' : `<p style="font-family:Georgia,serif;color:${MUTED};font-size:13px;margin:12px 0 0;">Your ${monthLabel} overview score is still being computed &mdash; you'll appear here once ChatGPT &amp; Perplexity score this month.</p>`
  return sectionWrap('02 &middot; Competitor Comparison', `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:0 8px 6px;">#</td>
        <td style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:0 8px 6px;">Hotel</td>
        <td align="right" style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:0 8px 6px;">Score</td>
      </tr>
      ${rows}
    </table>${note}`)
}

function categorySection(d: any): string {
  const weak = d.categories?.weakest || []
  if (!weak.length) {
    return sectionWrap('03 &middot; Category Performance', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">Category-level scores aren't available for ${fmtMonth(d.month)} yet.</p>`)
  }
  const items = weak.map((w: any) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;text-transform:capitalize;">${esc(w.category)}</td>
    <td align="center" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;">${w.score}/100</td>
    <td align="center" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${MUTED};font-size:13px;">#${w.rank} of ${w.total}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${MUTED};font-size:13px;">behind ${esc(w.ahead || '&mdash;')}</td>
  </tr>`).join('')
  return sectionWrap('03 &middot; Weakest Categories', `
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:13px;margin:0 0 12px;">Where you're losing the most ground to competitors &mdash; these drive this month's focus.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>`)
}

function websiteSection(d: any, prevLabel: string): string {
  const a = d.websiteAudit
  if (!a) {
    return sectionWrap('04 &middot; Website Analysis', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">The AI Advisor website audit hasn't run for this hotel yet &mdash; this section populates after the first audit.</p>`)
  }
  const deltaLine = a.baseline ? `<span style="color:${MUTED}">baseline audit</span>` : `${delta(a.score, a.priorScore)} vs ${prevLabel}`
  const findings = (a.failedFindings || []).slice(0, 5).map((f: any) => `<tr>
    <td valign="top" style="padding:8px 0;font-family:Georgia,serif;color:${f.priority === 'High' ? DOWN : TEXT};font-size:12px;font-weight:600;width:70px;">${esc(f.priority || '')}</td>
    <td style="padding:8px 0;font-family:Georgia,serif;color:${TEXT};font-size:13px;">${esc(f.label)}${f.detail ? `<br><span style="color:${MUTED};font-size:12px;">${esc(f.detail)}</span>` : ''}</td>
  </tr>`).join('')
  const findingsBlock = findings
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${findings}</table>`
    : `<p style="font-family:Georgia,serif;color:${MUTED};font-size:13px;margin:8px 0 0;">No failing checks &mdash; clean audit.</p>`
  return sectionWrap('04 &middot; Website Analysis', `
    <span style="font-family:Georgia,serif;font-size:32px;color:${GOLD};">${a.score}</span>
    <span style="font-family:Georgia,serif;font-size:14px;color:${MUTED};"> / 100 &middot; ${deltaLine}</span>
    ${a.summary ? `<p style="font-family:Georgia,serif;color:${TEXT};font-size:13px;margin:10px 0 0;">${esc(a.summary)}</p>` : ''}
    ${findingsBlock}`)
}

function focusSection(d: any): string {
  const weak = d.categories?.weakest || []
  const missed = d.recommendationInputs?.missed || []
  if (!weak.length && !missed.length) {
    return sectionWrap('05 &middot; Recommendations', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">Detailed recommendations generate once the AI Advisor runs for this hotel.</p>`)
  }
  const focusList = weak.map((w: any) => `<li style="margin-bottom:6px;">Lift <b style="text-transform:capitalize;">${esc(w.category)}</b> (currently ${w.score}/100, #${w.rank} of ${w.total})</li>`).join('')
  const missedList = missed.slice(0, 8).map((q: any) => `<li style="margin-bottom:4px;color:${MUTED};">${esc(q)}</li>`).join('')
  return sectionWrap('05 &middot; This Month&rsquo;s Focus', `
    <p style="font-family:Georgia,serif;color:${TEXT};font-size:13px;margin:0 0 10px;">Priority areas from your live data:</p>
    <ul style="font-family:Georgia,serif;color:${TEXT};font-size:14px;margin:0 0 16px;padding-left:20px;">${focusList}</ul>
    ${missed.length ? `<p style="font-family:Georgia,serif;color:${TEXT};font-size:13px;margin:0 0 8px;">Queries you're not appearing in yet${missed.length > 8 ? ` (top 8 of ${missed.length})` : ''}:</p>
    <ul style="font-family:Georgia,serif;font-size:13px;margin:0;padding-left:20px;">${missedList}</ul>` : ''}
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:12px;margin:16px 0 0;font-style:italic;">Specific FAQs and page-level fixes are generated by the AI Advisor and appear here once it runs for this hotel.</p>`)
}

function footer(monthLabel: string): string {
  return `<tr><td style="padding:20px 32px;background:${BG};">
    <div style="font-family:Georgia,serif;color:${MUTED};font-size:11px;line-height:1.6;">
      Automated monthly report &middot; SwissNet Hotels &middot; ${monthLabel}<br>
      Figures are drawn directly from tracked AI-assistant responses. Sections marked pending or baseline have no data yet and show nothing invented.
    </div>
  </td></tr>`
}

export function renderMonthlyReportHtml(d: any): string {
  const hotelName = esc(d.hotel?.name || 'Your Hotel')
  const monthLabel = fmtMonth(d.month)
  const prevLabel = fmtMonth(d.priorMonth)
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${CARD};border:1px solid ${LINE};">
  ${header(hotelName, monthLabel)}
  ${visibilitySection(d, monthLabel, prevLabel)}
  ${competitorSection(d, monthLabel)}
  ${categorySection(d)}
  ${websiteSection(d, prevLabel)}
  ${focusSection(d)}
  ${footer(monthLabel)}
</table>
</td></tr></table>
</body></html>`
}