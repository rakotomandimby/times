import { useState, useMemo } from 'react'
import ClockCard from './components/ClockCard.jsx'
import { timezones } from './utils/timezones.js'
import './App.css'

const STORAGE_KEY = 'what-times-timezones'

function isKnownTimezone(value) {
  return timezones.some((timezone) => timezone.value === value)
}

function getFallbackTimezone(excludedValues) {
  const excludedSet = new Set(excludedValues)
  const fallback = timezones.find((timezone) => !excludedSet.has(timezone.value))
  return fallback ? fallback.value : timezones[0].value
}

function getInitialTimezone() {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isKnownTimezone(browserTimezone) ? browserTimezone : timezones[0].value
}

function loadStoredTimezones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length < 3) return null

    const validTimezones = []
    for (const tz of parsed) {
      if (typeof tz === 'string' && isKnownTimezone(tz) && !validTimezones.includes(tz)) {
        validTimezones.push(tz)
      }
    }

    if (validTimezones.length < 3) return null

    return [validTimezones[0], validTimezones[1], validTimezones[2]]
  } catch {
    return null
  }
}

function saveTimezones(tz1, tz2, tz3) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([tz1, tz2, tz3]))
  } catch {
    // Gracefully handle storage write errors (e.g., quota exceeded or restricted mode)
  }
}

function getInitialTimezones() {
  const stored = loadStoredTimezones()
  if (stored) {
    return stored
  }

  const tz1 = getInitialTimezone()
  const tz2 = getFallbackTimezone([tz1])
  const tz3 = getFallbackTimezone([tz1, tz2])
  return [tz1, tz2, tz3]
}

function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [timezonesState, setTimezonesState] = useState(getInitialTimezones)

  const [timezone1, timezone2, timezone3] = timezonesState

  const timezoneOptions1 = useMemo(
    () => timezones.filter((tz) => tz.value !== timezone2 && tz.value !== timezone3),
    [timezone2, timezone3],
  )

  const timezoneOptions2 = useMemo(
    () => timezones.filter((tz) => tz.value !== timezone1 && tz.value !== timezone3),
    [timezone1, timezone3],
  )

  const timezoneOptions3 = useMemo(
    () => timezones.filter((tz) => tz.value !== timezone1 && tz.value !== timezone2),
    [timezone1, timezone2],
  )

  const adjustTime = (direction) => {
    setCurrentTime((previousTime) => {
      const nextTime = new Date(previousTime)
      const hasFractionalHour =
        nextTime.getMinutes() !== 0 ||
        nextTime.getSeconds() !== 0 ||
        nextTime.getMilliseconds() !== 0

      if (direction > 0) {
        nextTime.setHours(nextTime.getHours() + 1, 0, 0, 0)
      } else if (hasFractionalHour) {
        nextTime.setMinutes(0, 0, 0)
      } else {
        nextTime.setHours(nextTime.getHours() - 1, 0, 0, 0)
      }

      return nextTime
    })
  }

  const resetTime = () => {
    setCurrentTime(new Date())
  }

  const handleTimezone1Change = (value) => {
    let nextTz2 = timezone2
    let nextTz3 = timezone3

    if (value === nextTz2) {
      nextTz2 = getFallbackTimezone([value, nextTz3])
    } else if (value === nextTz3) {
      nextTz3 = getFallbackTimezone([value, nextTz2])
    }

    setTimezonesState([value, nextTz2, nextTz3])
    saveTimezones(value, nextTz2, nextTz3)
  }

  const handleTimezone2Change = (value) => {
    let nextTz1 = timezone1
    let nextTz3 = timezone3

    if (value === nextTz1) {
      nextTz1 = getFallbackTimezone([value, nextTz3])
    } else if (value === nextTz3) {
      nextTz3 = getFallbackTimezone([nextTz1, value])
    }

    setTimezonesState([nextTz1, value, nextTz3])
    saveTimezones(nextTz1, value, nextTz3)
  }

  const handleTimezone3Change = (value) => {
    let nextTz1 = timezone1
    let nextTz2 = timezone2

    if (value === nextTz1) {
      nextTz1 = getFallbackTimezone([value, nextTz2])
    } else if (value === nextTz2) {
      nextTz2 = getFallbackTimezone([nextTz1, value])
    }

    setTimezonesState([nextTz1, nextTz2, value])
    saveTimezones(nextTz1, nextTz2, value)
  }

  return (
    <main id="app">
      <h1>What times?</h1>
      <div className="clocks">
        <ClockCard
          id="clock-1"
          label="Clock 1"
          time={currentTime}
          timezone={timezone1}
          timezoneOptions={timezoneOptions1}
          onTimezoneChange={handleTimezone1Change}
          onIncrement={() => adjustTime(1)}
          onDecrement={() => adjustTime(-1)}
          onReset={resetTime}
        />
        <ClockCard
          id="clock-2"
          label="Clock 2"
          time={currentTime}
          timezone={timezone2}
          timezoneOptions={timezoneOptions2}
          onTimezoneChange={handleTimezone2Change}
          onIncrement={() => adjustTime(1)}
          onDecrement={() => adjustTime(-1)}
          onReset={resetTime}
        />
        <ClockCard
          id="clock-3"
          label="Clock 3"
          time={currentTime}
          timezone={timezone3}
          timezoneOptions={timezoneOptions3}
          onTimezoneChange={handleTimezone3Change}
          onIncrement={() => adjustTime(1)}
          onDecrement={() => adjustTime(-1)}
          onReset={resetTime}
        />
      </div>
    </main>
  )
}

export default App
