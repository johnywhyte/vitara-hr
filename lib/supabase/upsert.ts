import type { SupabaseClient } from '@supabase/supabase-js'

// Columns introduced with the expanded application form. Until the DB migration
// (supabase/add-application-fields.sql) is applied these columns don't exist,
// so writes that include them would fail. `upsertTolerant` transparently drops
// them and retries, letting the app keep working before/after the migration.
export const NEW_APPLICANT_COLUMNS = [
  'drivers_license_number',
  'has_motorbike',
  'compensation_expectation',
  'possible_start_date',
  'drivers_license_url',
] as const

export const NEW_GUARANTOR_COLUMNS = ['place_of_work'] as const

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  // PostgREST returns PGRST204 with "Could not find the 'x' column of 'y' in
  // the schema cache" when writing to a column that doesn't exist yet.
  return (
    error.code === 'PGRST204' ||
    /could not find the .* column/i.test(error.message ?? '') ||
    /column .* schema cache/i.test(error.message ?? '')
  )
}

/**
 * Upsert that survives a not-yet-migrated schema: if the write fails because
 * one of `optionalColumns` doesn't exist, it retries once without those columns.
 * Returns `degraded: true` when the fallback path was taken.
 */
export async function upsertTolerant(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
  onConflict: string,
  optionalColumns: readonly string[]
): Promise<{ error: { message: string } | null; degraded: boolean }> {
  const { error } = await supabase.from(table).upsert(payload, { onConflict })

  if (error && isMissingColumnError(error)) {
    const reduced = { ...payload }
    for (const key of optionalColumns) delete reduced[key]
    console.warn(
      `[upsertTolerant] ${table}: new columns missing (schema not migrated) — ` +
        `saving without ${optionalColumns.join(', ')}. Run supabase/add-application-fields.sql to enable them.`
    )
    const retry = await supabase.from(table).upsert(reduced, { onConflict })
    return { error: retry.error, degraded: true }
  }

  return { error, degraded: false }
}
