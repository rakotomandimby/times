export function formatTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function parseOffsetInMinutes(offsetLabel) {
  const match = offsetLabel.match(/([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return null

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2])
  const minutes = Number(match[3] ?? '0')
  return sign * (hours * 60 + minutes)
}

function getOffsetInMinutesAtDate(date, timeZone) {
  const offsetLabel = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value

  if (!offsetLabel) return null
  return parseOffsetInMinutes(offsetLabel)
}

export function getFranceSeasonBadge(date, timeZone) {
  if (timeZone !== 'Europe/Paris') return null

  const offsetInMinutes = getOffsetInMinutesAtDate(date, timeZone)
  if (offsetInMinutes === 120) {
    return {
      key: 'summer',
      label: 'Summer time (CEST · UTC+2)',
    }
  }

  if (offsetInMinutes === 60) {
    return {
      key: 'winter',
      label: 'Winter time (CET · UTC+1)',
    }
  }

  return null
}
