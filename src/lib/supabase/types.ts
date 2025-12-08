export type Task = {
  id: string
  content: string
  completed: boolean
  due_date: string | null
  archived: boolean
  entry_id: string | null
  created_at: string
  updated_at: string
}

export type Entry = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}
