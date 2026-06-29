'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'

export function SearchBar({ placeholder = 'Buscar...' }: { placeholder?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const q = searchParams.get('q') ?? ''
  const [value, setValue] = useState(q)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setValue(q)
  }, [q])

  const navigateWithParams = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val.trim()) params.set('q', val.trim())
    else params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  function handleChange(val: string) {
    setValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigateWithParams(val), 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigateWithParams(value)
  }

  function handleClear() {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-9 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </form>
  )
}
