// ─── MONTHLY REPORT — EMAIL HTML ───
// Renders gatherMonthlyReportData() into an email-safe HTML string. No-fabrication:
// deltas render only when both months have like-for-like data; competitor ranking
// uses only ChatGPT+Perplexity (platforms tracked for every hotel); Google stays in
// the hotel's own trend. Missing sections show honest pending/baseline states.

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
function movementLine(cur: number | null, prev: number | null, prevLabel: string): string {
  if (cur === null || prev === null) return `<span style="color:${MUTED}">First tracked month &mdash; this is your baseline.</span>`
  const d = cur - prev
  if (d > 0) return `<span style="color:${UP};font-weight:600">Up ${d} point${d === 1 ? '' : 's'}</span> from ${prevLabel}.`
  if (d < 0) return `<span style="color:${DOWN};font-weight:600">Down ${-d} point${d === -1 ? '' : 's'}</span> from ${prevLabel}.`
  return `Unchanged from ${prevLabel}.`
}
function sectionWrap(title: string, inner: string): string {
  return `<tr><td style="padding:24px 32px;border-bottom:1px solid ${LINE};">
    <div style="font-family:Georgia,serif;color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">${title}</div>
    ${inner}
  </td></tr>`
}
function th(label: string, align = 'left'): string {
  return `<td align="${align}" style="font-family:Georgia,serif;color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:0 8px 6px;">${label}</td>`
}

function header(name: string, monthLabel: string): string {
  return `<tr><td style="background:${TEXT};padding:28px 32px;">
    <div style="font-family:Georgia,serif;color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;">SwissNet Hotels &middot; Monthly Report</div>
    <div style="font-family:Georgia,serif;color:#ffffff;font-size:26px;margin-top:8px;">${name}</div>
    <div style="font-family:Georgia,serif;color:#c9bda8;font-size:14px;margin-top:4px;">How you showed up in AI assistants during ${monthLabel}</div>
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
  const bodyRows = rows.map(([name, cur, prev]) => `<tr>
    <td style="padding:10px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;">${name}</td>
    <td align="center" style="padding:10px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${MUTED};font-size:14px;">${prev ?? '&mdash;'}</td>
    <td align="center" style="padding:10px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:15px;font-weight:600;">${cur ?? '&mdash;'}</td>
    <td align="right" style="padding:10px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;font-size:13px;">${delta(cur, prev)}</td>
  </tr>`).join('')

  return sectionWrap('01 &middot; Your AI Visibility Score', `
    <div style="padding-bottom:14px;">
      <span style="font-family:Georgia,serif;font-size:46px;color:${GOLD};">${t.overall ?? '&mdash;'}</span>
      <span style="font-family:Georgia,serif;font-size:15px;color:${MUTED};"> / 100 overall</span>
      <div style="font-family:Georgia,serif;font-size:14px;margin-top:6px;color:${TEXT};">${baseline || !l ? movementLine(null, null, prevLabel) : movementLine(t.overall ?? null, l.overall ?? null, prevLabel)}</div>
    </div>
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:13px;margin:0 0 10px;">This is how often you appeared when travellers asked each AI assistant about hotels in your area.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${th('Assistant')}${th(prevLabel, 'center')}${th(monthLabel, 'center')}${th('Change', 'right')}</tr>
      ${bodyRows}
    </table>`)
}

function competitorSection(d: any, monthLabel: string): string {
  const lb = d.competitors || []
  if (!lb.length) {
    return sectionWrap('02 &middot; How You Rank', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">No competitor visibility recorded for ${monthLabel} yet.</p>`)
  }
  const you = lb.find((c: any) => c.isYou)
  const headline = you
    ? `You rank <span style="color:${GOLD};font-weight:700;">#${you.rank}</span> of ${lb.length} hotels in your market this month.`
    : `Your ${monthLabel} ranking is still being computed.`
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
  return sectionWrap('02 &middot; How You Rank', `
    <p style="font-family:Georgia,serif;color:${TEXT};font-size:15px;margin:0 0 12px;">${headline}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${th('#')}${th('Hotel')}${th('Score', 'right')}</tr>
      ${rows}
    </table>
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:12px;margin:12px 0 0;">Ranking uses ChatGPT and Perplexity, where every hotel in your market is tracked equally. Google AI appears in your own trend above.</p>`)
}

function categorySection(d: any): string {
  const scores = d.categories?.scores || {}
  const ranks = d.categories?.ranks || {}
  const list = Object.keys(scores)
    .map(cat => ({ cat, score: scores[cat], rank: ranks[cat]?.rank, total: ranks[cat]?.total }))
    .sort((a, b) => b.score - a.score)
  if (!list.length) {
    return sectionWrap('03 &middot; Category Performance', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">Category scores aren't available for ${fmtMonth(d.month)} yet.</p>`)
  }
  const best = list[0]?.cat, worst = list[list.length - 1]?.cat
  const rows = list.map(x => {
    const tag = x.cat === best ? ` <span style="color:${UP};font-size:11px;">strongest</span>` : x.cat === worst ? ` <span style="color:${DOWN};font-size:11px;">focus</span>` : ''
    return `<tr>
      <td style="padding:9px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;text-transform:capitalize;">${esc(x.cat)}${tag}</td>
      <td align="center" style="padding:9px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${TEXT};font-size:14px;">${x.score}/100</td>
      <td align="right" style="padding:9px 8px;border-bottom:1px solid ${LINE};font-family:Georgia,serif;color:${MUTED};font-size:13px;">${x.rank ? `#${x.rank} of ${x.total}` : '&mdash;'}</td>
    </tr>`
  }).join('')
  return sectionWrap('03 &middot; Category Performance', `
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:13px;margin:0 0 12px;">Where you're winning and where to push, by travel intent.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${th('Category')}${th('Score', 'center')}${th('Rank', 'right')}</tr>
      ${rows}
    </table>`)
}

function websiteSection(d: any, prevLabel: string): string {
  const a = d.websiteAudit
  if (!a) {
    return sectionWrap('04 &middot; Website Analysis', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">The AI Advisor website audit hasn't run for this hotel yet.</p>`)
  }
  const deltaLine = a.baseline ? `<span style="color:${MUTED}">baseline audit</span>` : `${delta(a.score, a.priorScore)} vs ${prevLabel}`
  const findings = (a.failedFindings || []).slice(0, 5).map((f: any) => `<tr>
    <td valign="top" style="padding:8px 8px 8px 0;font-family:Georgia,serif;color:${f.priority === 'High' ? DOWN : TEXT};font-size:12px;font-weight:600;width:64px;">${esc(f.priority || '')}</td>
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
    return sectionWrap('05 &middot; This Month&rsquo;s Focus', `<p style="font-family:Georgia,serif;color:${MUTED};font-size:14px;margin:0;">Detailed recommendations generate once the AI Advisor runs for this hotel.</p>`)
  }
  const focusList = weak.map((w: any) => `<li style="margin-bottom:6px;">Lift <b style="text-transform:capitalize;">${esc(w.category)}</b> (currently ${w.score}/100, #${w.rank} of ${w.total})</li>`).join('')
  const missedList = missed.slice(0, 8).map((q: any) => `<li style="margin-bottom:4px;color:${MUTED};">${esc(q)}</li>`).join('')
  return sectionWrap('05 &middot; This Month&rsquo;s Focus', `
    <p style="font-family:Georgia,serif;color:${TEXT};font-size:13px;margin:0 0 10px;">Priority areas from your live data:</p>
    <ul style="font-family:Georgia,serif;color:${TEXT};font-size:14px;margin:0 0 16px;padding-left:20px;">${focusList}</ul>
    ${missed.length ? `<p style="font-family:Georgia,serif;color:${TEXT};font-size:13px;margin:0 0 8px;">Searches you're not appearing in yet${missed.length > 8 ? ` (top 8 of ${missed.length})` : ''}:</p>
    <ul style="font-family:Georgia,serif;font-size:13px;margin:0;padding-left:20px;">${missedList}</ul>` : ''}
    <p style="font-family:Georgia,serif;color:${MUTED};font-size:12px;margin:16px 0 0;font-style:italic;">Specific FAQs and page-level fixes are generated by the AI Advisor and appear here once it runs for this hotel.</p>`)
}

function footer(monthLabel: string): string {
  return `<tr><td style="padding:20px 32px;background:${BG};">
    <div style="font-family:Georgia,serif;color:${MUTED};font-size:11px;line-height:1.6;">
      Automated monthly report &middot; SwissNet Hotels &middot; ${monthLabel}<br>
      Every figure is drawn directly from tracked AI-assistant responses. Nothing on this page is estimated or invented.
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