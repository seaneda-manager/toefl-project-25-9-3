await fetch('/api/listening/consume', {
  method: 'POST',
  body: JSON.stringify({ sessionId })
})
