import { getTimeZones } from '@vvo/tzdb'
import { normalizeString } from './fuzzySearch.js'

function formatOffset(offsetInMinutes) {
  const sign = offsetInMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(offsetInMinutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')
  const minutes = String(absoluteMinutes % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
}

export const timezones = getTimeZones()
  .map((timezone) => {
    const label = `${timezone.mainCities[0] ?? timezone.name} (${formatOffset(timezone.rawOffsetInMinutes)})`

    // Extra searchable terms so users can find a timezone by any of its main
    // cities (e.g. "Montréal", "Ottawa") or by any alias in its group
    // (e.g. "America/Nassau", "Canada/Eastern"), not just by the label city.
    // Deduped up front to avoid redundant normalization/matching work below.
    // Kept for backward compatibility with any code still relying on the
    // merged list; the ranking algorithm in fuzzySearch.js now uses the
    // separate `mainCities` / `group` fields below instead, so that main
    // cities and group aliases can be prioritized differently.
    const rawSearchTerms = [...(timezone.mainCities ?? []), ...(timezone.group ?? [])]
    const searchTerms = Array.from(new Set(rawSearchTerms))

    // Raw (non-merged, non-deduped-together) main cities and group aliases,
    // kept separate from `searchTerms` above so the UI can display them as
    // distinct metadata, and so search ranking can treat them as distinct
    // priority tiers.
    const mainCities = Array.from(new Set(timezone.mainCities ?? []))
    const group = Array.from(new Set(timezone.group ?? []))

    return {
      value: timezone.name,
      label,
      offsetInMinutes: timezone.rawOffsetInMinutes,
      searchTerms,
      mainCities,
      group,
      // Precomputed normalized (accent-stripped, lower-cased) forms of the
      // label, value, main cities, group aliases, and merged search terms.
      // Computing these once here, instead of on every keystroke inside
      // fuzzySearch.js, avoids re-running Unicode normalization for every
      // option on every search.
      normalizedLabel: normalizeString(label),
      normalizedValue: normalizeString(timezone.name),
      normalizedSearchTerms: searchTerms.map((term) => normalizeString(term)),
      normalizedMainCities: mainCities.map((city) => normalizeString(city)),
      normalizedGroup: group.map((alias) => normalizeString(alias)),
    }
  })
  .sort((a, b) => a.offsetInMinutes - b.offsetInMinutes || a.label.localeCompare(b.label))

