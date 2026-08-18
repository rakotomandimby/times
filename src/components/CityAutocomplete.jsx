import { useState, useRef } from 'react'
import { filterOptions } from '../utils/fuzzySearch.js'

function buildMetaLabel(option) {
  // Builds the secondary metadata line shown under the timezone name,
  // combining main cities and group aliases so users can verify why a
  // suggestion matched their search before selecting it.
  const mainCities = option.mainCities ?? []
  const group = option.group ?? []

  const parts = []
  if (mainCities.length > 0) {
    parts.push(mainCities.join(', '))
  }
  if (group.length > 0) {
    parts.push(group.join(', '))
  }

  return parts.join(' • ')
}

function CityAutocomplete({
  id,
  selectedTimezone,
  options,
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === selectedTimezone)
  const displayValue = isOpen ? searchQuery : (selectedOption ? selectedOption.label : '')

  const filteredOptions = filterOptions(options, searchQuery)

  const handleInputChange = (event) => {
    const query = event.target.value
    setSearchQuery(query)
    setHighlightedIndex(0)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleFocus = () => {
    setSearchQuery('')
    setHighlightedIndex(0)
    setIsOpen(true)
  }

  const handleBlur = (event) => {
    // Only close if focus moves completely outside the autocomplete container
    if (containerRef.current && !containerRef.current.contains(event.relatedTarget)) {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleSelectOption = (option) => {
    onSelect(option.value)
    setIsOpen(false)
    setSearchQuery('')
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prevIndex) => {
        const nextIndex = prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0
        scrollOptionIntoView(nextIndex)
        return nextIndex
      })
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prevIndex) => {
        const nextIndex = prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1
        scrollOptionIntoView(nextIndex)
        return nextIndex
      })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setSearchQuery('')
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }
  }

  const scrollOptionIntoView = (index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.autocomplete__item')
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' })
      }
    }
  }

  const listboxId = `${id}-listbox`
  const activeOptionId =
    isOpen && filteredOptions[highlightedIndex]
      ? `${id}-option-${filteredOptions[highlightedIndex].value}`
      : undefined

  return (
    <div
      ref={containerRef}
      className="autocomplete"
      onBlur={handleBlur}
    >
      <div className="autocomplete__input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="autocomplete__input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-label="Search and select city or timezone"
          placeholder="Search city or timezone..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
        <span className="autocomplete__icon" aria-hidden="true">
          🔍
        </span>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          className="autocomplete__dropdown"
          role="listbox"
          tabIndex={-1}
        >
          {filteredOptions.length === 0 ? (
            <li className="autocomplete__no-results">No matching cities found</li>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === selectedTimezone
              const isHighlighted = index === highlightedIndex
              const optionId = `${id}-option-${option.value}`
              const metaLabel = buildMetaLabel(option)

              return (
                <li
                  key={option.value}
                  id={optionId}
                  role="option"
                  aria-selected={isSelected}
                  className={`autocomplete__item ${isHighlighted ? 'autocomplete__item--highlighted' : ''} ${isSelected ? 'autocomplete__item--selected' : ''}`}
                  onMouseDown={(event) => {
                    // Prevent blur from closing before click is registered
                    event.preventDefault()
                    handleSelectOption(option)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="autocomplete__item-text">
                    <span className="autocomplete__item-label">{option.label}</span>
                    {metaLabel && (
                      <span className="autocomplete__item-meta">{metaLabel}</span>
                    )}
                  </span>
                  {isSelected && <span className="autocomplete__item-check">✓</span>}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

export default CityAutocomplete

