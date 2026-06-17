import { supabase } from './supabase';

// Table names map to our data keys
type TableName = 'engagements' | 'connections' | 'tasks' | 'deliverables' | 'cpd' | 'events' | 'leave_balances' | 'leave_records';

export async function loadData<T>(table: TableName, fallback: T[]): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('data');

  if (error) {
    console.error(`Failed to load ${table}:`, error);
    return fallback;
  }
  if (!data || data.length === 0) return [];
  return data.map((row: { data: T }) => row.data);
}

export async function saveData<T extends { id: string }>(
  table: TableName,
  items: T[]
): Promise<void> {
  // Upsert all items — insert or update based on id
  const rows = items.map(item => ({ id: item.id, data: item }));
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'id' });

  if (error) console.error(`Failed to save to ${table}:`, error);
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) console.error(`Failed to delete from ${table}:`, error);
}

export async function saveItem<T extends { id: string }>(
  table: TableName,
  item: T
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .upsert({ id: item.id, data: item }, { onConflict: 'id' });

  if (error) console.error(`Failed to save item to ${table}:`, error);
}