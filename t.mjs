const KEY = process.env.GEMINI_API_KEY
console.log('KEY present:', !!KEY)
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
  { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contents:[{parts:[{text:'best spa hotel Geneva. List 5 to 8 hotels by name.'}]}], tools:[{google_search:{}}] }) })
console.log('HTTP status:', res.status)
const d = await res.json()
console.log('RAW RESPONSE:', JSON.stringify(d).slice(0,1500))
