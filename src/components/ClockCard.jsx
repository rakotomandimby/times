import { formatTimeInZone } from '../utils/time.js'

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
  const selectId = `${id}-timezone`
  const timeLabel = formatTimeInZone(time, timezone)

  return (
    <section className="clock-card" aria-label={label}>
      <select
        id={selectId}
        className="clock-card__select"
        value={timezone}
        onChange={(event) => onTimezoneChange(event.target.value)}
      >
        {timezoneOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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

