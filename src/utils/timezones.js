import { getTimeZones } from '@vvo/tzdb'

function formatOffset(offsetInMinutes) {
  const sign = offsetInMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(offsetInMinutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')
  const minutes = String(absoluteMinutes % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
}

export const timezones = getTimeZones()
  .map((timezone) => ({
    value: timezone.name,
    label: `${timezone.mainCities[0] ?? timezone.name} (${formatOffset(timezone.rawOffsetInMinutes)})`,
    offsetInMinutes: timezone.rawOffsetInMinutes,
  }))
  .sort((a, b) => a.offsetInMinutes - b.offsetInMinutes || a.label.localeCompare(b.label))

