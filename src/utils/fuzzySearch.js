/**
 * Normalizes strings by removing diacritics/accents, trimming,
 * and converting to lower case.
 */
export function normalizeString(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i])
  for (let j = 0; j <= an; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= bn; i += 1) {
    for (let j = 1; j <= an; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        )
      }
    }
  }

  return matrix[bn][an]
}

/**
 * Checks if query characters appear sequentially in target (fuzzy subsequence match).
 * Returns a score if matched, or 0 if not matched.
 */
function subsequenceScore(query, target) {
  let qIdx = 0
  let score = 0
  let consecutive = 0

  for (let tIdx = 0; tIdx < target.length && qIdx < query.length; tIdx += 1) {
    if (query[qIdx] === target[tIdx]) {
      qIdx += 1
      consecutive += 1
      score += 10 + consecutive * 5
    } else {
      consecutive = 0
    }
  }

  return qIdx === query.length ? score : 0
}

/**
 * Computes an exact/prefix/substring-only match score between an
 * already-normalized query and an already-normalized text value.
 * Returns 0 if there is no exact/substring relationship at all — fuzzy
 * (typo-tolerant) matching is handled separately by `fuzzyMatchScore`, so
 * that exact/substring hits can always be ranked in their own top tier,
 * strictly above any fuzzy result.
 */
function substringMatchScore(cleanQuery, cleanText) {
  if (!cleanText || !cleanQuery) return 0

  // Exact match
  if (cleanText === cleanQuery) {
    return 100
  }

  // Prefix match
  if (cleanText.startsWith(cleanQuery)) {
    return 90 + (cleanQuery.length / cleanText.length) * 10
  }

  // Substring match anywhere in the text
  const textIndex = cleanText.indexOf(cleanQuery)
  if (textIndex !== -1) {
    return Math.max(10, 70 - textIndex * 2 + (cleanQuery.length / cleanText.length) * 10)
  }

  return 0
}

/**
 * Computes a fuzzy (typo-tolerant) match score between an already-normalized
 * query and an already-normalized text value. Deliberately does NOT handle
 * exact/prefix/substring matches (see `substringMatchScore` for those), so
 * this function only ever contributes to the lower, fallback tiers of the
 * ranking hierarchy.
 */
function fuzzyMatchScore(cleanQuery, cleanText) {
  if (!cleanText || !cleanQuery) return 0

  // Word-level token match and fuzzy comparison
  const words = cleanText.split(/[\s,/_()-]+/).filter(Boolean)
  let bestWordScore = 0

  for (const word of words) {
    if (word.startsWith(cleanQuery)) {
      bestWordScore = Math.max(bestWordScore, 90)
    } else if (word.includes(cleanQuery)) {
      bestWordScore = Math.max(bestWordScore, 70)
    } else if (cleanQuery.length >= 3 && word.length >= 3) {
      const distance = levenshteinDistance(cleanQuery, word)
      const maxAllowedDistance = cleanQuery.length > 5 ? 2 : 1
      if (distance <= maxAllowedDistance) {
        bestWordScore = Math.max(bestWordScore, 60 - distance * 15)
      }
    }
  }

  if (bestWordScore > 0) {
    return bestWordScore
  }

  // Subsequence matching (scaled down so it never outranks word-level fuzzy hits)
  const subScore = subsequenceScore(cleanQuery, cleanText)
  if (subScore > 0) {
    return Math.min(subScore, 50)
  }

  // Full string Levenshtein tolerance for typos
  if (cleanQuery.length >= 4) {
    const mainPortion = cleanText.split('(')[0].trim()
    const dist = levenshteinDistance(cleanQuery, mainPortion)
    if (dist <= 2) {
      return Math.max(0, 40 - dist * 10)
    }
  }

  return 0
}

/**
 * Returns the best substring match score across a list of already-normalized
 * candidate texts, or 0 if none match.
 */
function bestSubstringScore(cleanQuery, texts) {
  let best = 0
  for (const text of texts) {
    const score = substringMatchScore(cleanQuery, text)
    if (score > best) best = score
  }
  return best
}

/**
 * Returns the best fuzzy match score across a list of already-normalized
 * candidate texts, or 0 if none match.
 */
function bestFuzzyScore(cleanQuery, texts) {
  let best = 0
  for (const text of texts) {
    const score = fuzzyMatchScore(cleanQuery, text)
    if (score > best) best = score
  }
  return best
}

// Each tier occupies its own non-overlapping numeric band (with generous
// headroom above the maximum possible in-tier score of ~110) so that a
// candidate in a higher-priority tier can never be outranked by a
// candidate in a lower-priority tier, no matter how strong the in-tier
// score is.
const TIER_PRIMARY_EXACT = 10000 // timezone name / label / main city — exact or substring
const TIER_GROUP_EXACT = 8000    // group alias — exact or substring
const TIER_PRIMARY_FUZZY = 6000  // timezone name / label — fuzzy
const TIER_CITY_FUZZY = 4000     // main city — fuzzy
const TIER_GROUP_FUZZY = 2000    // group alias — fuzzy

/**
 * Computes a match score between a user query and an option item.
 * Higher score indicates a better match. A score <= 0 indicates no match.
 *
 * Ranking is strictly tiered, from highest to lowest priority:
 *   1. Exact/substring match on the timezone name, label, or a main city.
 *   2. Exact/substring match on a group alias.
 *   3. Fuzzy match on the timezone name/label.
 *   4. Fuzzy match on a main city.
 *   5. Fuzzy match on a group alias.
 *
 * This guarantees that an accurate/exact match always outranks an
 * approximate one, and that primary identifiers (timezone name, main
 * cities) always outrank secondary aliases (group), regardless of how
 * strong the underlying string-similarity score is within a tier.
 *
 * Reads precomputed `normalizedLabel` / `normalizedValue` /
 * `normalizedMainCities` / `normalizedGroup` when available (see
 * ../utils/timezones.js) so Unicode normalization doesn't have to be redone
 * for every option on every keystroke. Falls back to normalizing on the fly
 * if an option was built without those precomputed fields (e.g. in tests),
 * so behavior stays backward compatible either way.
 */
export function calculateMatchScore(query, option) {
  const cleanQuery = normalizeString(query)
  if (!cleanQuery) return 1

  const cleanLabel = option.normalizedLabel ?? normalizeString(option.label)
  const cleanValue = option.normalizedValue ?? normalizeString(option.value)
  const normalizedMainCities =
    option.normalizedMainCities ?? (option.mainCities ?? []).map((city) => normalizeString(city))
  const normalizedGroup =
    option.normalizedGroup ?? (option.group ?? []).map((alias) => normalizeString(alias))

  const primaryTexts = [cleanLabel, cleanValue, ...normalizedMainCities]

  // Tier 1: exact/substring match on timezone name, label, or main city.
  const primaryExactScore = bestSubstringScore(cleanQuery, primaryTexts)
  if (primaryExactScore > 0) {
    return TIER_PRIMARY_EXACT + primaryExactScore
  }

  // Tier 2: exact/substring match on group aliases.
  const groupExactScore = bestSubstringScore(cleanQuery, normalizedGroup)
  if (groupExactScore > 0) {
    return TIER_GROUP_EXACT + groupExactScore
  }

  // Tier 3: fuzzy match on timezone name/label.
  const primaryFuzzyScore = bestFuzzyScore(cleanQuery, [cleanLabel, cleanValue])
  if (primaryFuzzyScore > 0) {
    return TIER_PRIMARY_FUZZY + primaryFuzzyScore
  }

  // Tier 4: fuzzy match on main cities.
  const cityFuzzyScore = bestFuzzyScore(cleanQuery, normalizedMainCities)
  if (cityFuzzyScore > 0) {
    return TIER_CITY_FUZZY + cityFuzzyScore
  }

  // Tier 5: fuzzy match on group aliases.
  const groupFuzzyScore = bestFuzzyScore(cleanQuery, normalizedGroup)
  if (groupFuzzyScore > 0) {
    return TIER_GROUP_FUZZY + groupFuzzyScore
  }

  return 0
}

/**
 * Filters and ranks timezone options according to a search query.
 */
export function filterOptions(options, query) {
  if (!query || !query.trim()) {
    return options
  }

  const scored = []
  for (const option of options) {
    const score = calculateMatchScore(query, option)
    if (score > 0) {
      scored.push({ option, score })
    }
  }

  scored.sort((a, b) => b.score - a.score || a.option.label.localeCompare(b.option.label))

  return scored.map((item) => item.option)
}

