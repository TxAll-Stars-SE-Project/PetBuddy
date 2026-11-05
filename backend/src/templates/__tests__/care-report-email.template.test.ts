import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getCareReportEmailHtml } from '../care-report-email.template.js'

const base = {
  ownerUsername: 'somying',
  sitterUsername: 'somchai',
  serviceName: 'รับฝากเลี้ยง',
  bookingId: 7,
  petNames: ['ถุงเงิน'],
  reportDetail: 'ทานข้าวหมดแล้ว',
  photoUrl: null,
  createdAt: '2026-11-05T08:30:00.000Z',
}

describe('getCareReportEmailHtml', () => {
  it('escapes HTML in the sitter notes and keeps line breaks', () => {
    const html = getCareReportEmailHtml({ ...base, reportDetail: '<script>alert(1)</script>\nเล่นบอล' })
    assert.ok(!html.includes('<script>'))
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;<br>เล่นบอล'))
  })

  it('escapes user names and service name', () => {
    const html = getCareReportEmailHtml({ ...base, sitterUsername: '<b>x</b>', serviceName: '"svc"' })
    assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'))
    assert.ok(html.includes('&quot;svc&quot;'))
  })

  it('shows the photo only when there is one', () => {
    assert.ok(!getCareReportEmailHtml(base).includes('<img'))
    const html = getCareReportEmailHtml({ ...base, photoUrl: 'https://cdn.example.com/care-reports/7/a.jpg' })
    assert.ok(html.includes('<img src="https://cdn.example.com/care-reports/7/a.jpg"'))
  })

  it('shows the booking id, report time in Bangkok time and pet names', () => {
    const html = getCareReportEmailHtml({ ...base, petNames: ['ถุงเงิน', 'มะลิ'] })
    assert.ok(html.includes('#7'))
    assert.ok(html.includes('ถุงเงิน, มะลิ'))
    assert.ok(html.includes('15:30'))
  })

  it('falls back to a generic pet label when the booking has no pets listed', () => {
    assert.ok(getCareReportEmailHtml({ ...base, petNames: [] }).includes('สัตว์เลี้ยงของคุณ'))
  })
})
