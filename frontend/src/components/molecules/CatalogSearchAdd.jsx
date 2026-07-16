import { useState, useEffect, useRef } from 'react'
import apiClient from '../../api/axiosClient'

export default function CatalogSearchAdd({ endpoint, placeholder, selectedItems, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await apiClient.get(endpoint, { params: { search: query } })
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, endpoint])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div>
      <div className="search-dropdown-wrap" ref={wrapRef}>
        <input
          className="input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {open && results.length > 0 && (
          <div className="search-dropdown-menu">
            {results.map((item) => (
              <div
                key={item.id}
                className="search-dropdown-item"
                onClick={() => {
                  onAdd(item)
                  setQuery('')
                  setOpen(false)
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItems.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 'var(--space-2)' }}>No items added</p>
      ) : (
        <div className="chip-list">
          {selectedItems.map((item) => (
            <span key={item.id} className="chip">
              {item.name}
              <span className="chip-remove" onClick={() => onRemove(item.id)}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
