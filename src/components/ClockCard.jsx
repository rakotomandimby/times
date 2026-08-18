import { formatTimeInZone } from '../utils/time.js'
import CityAutocomplete from './CityAutocomplete.jsx'

function ClockCard({
  id,
  label,
  time,
  timezone,
  timezoneOptions,
  onTimezoneChange,
  onIncrement,
  onDecrement,
}) {
  const inputId = `${id}-city-input`
  const timeLabel = formatTimeInZone(time, timezone)

  return (
    <section className="clock-card" aria-label={label}>
      <CityAutocomplete
        id={inputId}
        selectedTimezone={timezone}
        options={timezoneOptions}
        onSelect={onTimezoneChange}
      />

      <div className="clock-card__display">
        <p className="clock-card__time">{timeLabel}</p>
      </div>

      <div className="clock-card__controls">
        <button
          type="button"
          className="clock-card__button"
          onClick={onDecrement}
          aria-label={`Subtract one hour from ${label}`}
        >
          −
        </button>
        <button
          type="button"
          className="clock-card__button"
          onClick={onIncrement}
          aria-label={`Add one hour to ${label}`}
        >
          +
        </button>
      </div>
    </section>
  )
}

export default ClockCard

