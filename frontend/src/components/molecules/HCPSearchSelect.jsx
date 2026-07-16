import { useState, useEffect, useRef } from 'react'
import apiClient from '../../api/axiosClient'

export default function HCPSearchSelect({ value, onSelect }) {
  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!query || (value && query === value.name)) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await apiClient.get('/hcps/', { params: { search: query } })
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="search-dropdown-wrap" ref={wrapRef}>
      <input
        className="input"
        placeholder="Search or select HCP..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown-menu">
          {results.map((hcp) => (
            <div
              key={hcp.id}
              className="search-dropdown-item"
              onClick={() => {
                onSelect(hcp)
                setQuery(hcp.name)
                setOpen(false)
              }}
            >
              {hcp.name}
              <small>{[hcp.specialty, hcp.hospital_or_clinic].filter(Boolean).join(' · ')}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
