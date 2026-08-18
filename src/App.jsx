import { useState, useMemo } from 'react'
import ClockCard from './components/ClockCard.jsx'
import { timezones } from './utils/timezones.js'
import './App.css'

const HOUR_IN_MS = 60 * 60 * 1000

function isKnownTimezone(value) {
  return timezones.some((timezone) => timezone.value === value)
}

function getFallbackTimezone(excludedValue) {
  const fallback = timezones.find((timezone) => timezone.value !== excludedValue)
  return fallback ? fallback.value : timezones[0].value
}

function getInitialTimezone() {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isKnownTimezone(browserTimezone) ? browserTimezone : timezones[0].value
}

function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [timezone1, setTimezone1] = useState(getInitialTimezone)
  const [timezone2, setTimezone2] = useState(() => getFallbackTimezone(getInitialTimezone()))

  const timezoneOptions2 = useMemo(
    () => timezones.filter((timezone) => timezone.value !== timezone1),
    [timezone1],
  )

  const adjustTime = (hours) => {
    setCurrentTime((previousTime) => new Date(previousTime.getTime() + hours * HOUR_IN_MS))
  }

  const handleTimezone1Change = (value) => {
    setTimezone1(value)
    if (value === timezone2) {
      setTimezone2(getFallbackTimezone(value))
    }
  }

  return (
    <main id="app">
      <h1>World Clock</h1>
      <div className="clocks">
        <ClockCard
          id="clock-1"
          label="Clock 1"
          time={currentTime}
          timezone={timezone1}
          timezoneOptions={timezones}
          onTimezoneChange={handleTimezone1Change}
          onIncrement={() => adjustTime(1)}
          onDecrement={() => adjustTime(-1)}
        />
        <ClockCard
          id="clock-2"
          label="Clock 2"
          time={currentTime}
          timezone={timezone2}
          timezoneOptions={timezoneOptions2}
          onTimezoneChange={setTimezone2}
          onIncrement={() => adjustTime(1)}
          onDecrement={() => adjustTime(-1)}
        />
      </div>
    </main>
  )
}

export default App

