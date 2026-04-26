import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Generic hook that subscribes to a Supabase table via Realtime
 * and returns its rows + loading state.
 *
 * @param {string} table - Table name
 * @param {object} options
 * @param {string} [options.orderBy] - Column to order by
 * @param {boolean} [options.ascending]
 * @param {object} [options.filter] - { column, operator, value } for a single eq filter
 * @param {string} [options.select] - Select string (default '*')
 */
export function useRealtimeTable(table, options = {}) {
  const {
    orderBy = 'created_at',
    ascending = false,
    filter = null,
    select = '*'
  } = options

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from(table).select(select)

      if (filter) {
        query = query.filter(filter.column, filter.operator ?? 'eq', filter.value)
      }

      if (orderBy) {
        query = query.order(orderBy, { ascending })
      }

      const { data, error: err } = await query
      if (err) throw err
      setRows(data ?? [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [table, select, orderBy, ascending, filter?.column, filter?.value]) // eslint-disable-line

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetch, table])

  return { rows, loading, error, refresh: fetch }
}
