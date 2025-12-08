import { createClient } from '@/lib/supabase/server'
import { EntryForm } from '@/components/entry-form'
import { Markdown } from '@/components/markdown'
import { RelativeTime } from '@/components/relative-time'
import Link from 'next/link'

type Entry = {
  id: string
  title: string
  content: string
  created_at: string
}

export default async function Home() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Journal
          </h1>
          <Link
            href="/todo"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View Todo
          </Link>
        </div>

        <div className="mb-12">
          <EntryForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Entries
          </h2>

          {!entries || entries.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              No entries yet. Create your first entry above!
            </p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry: Entry) => {
                const contentPreview = entry.content.length > 200
                  ? entry.content.slice(0, 200) + '...'
                  : entry.content

                return (
                  <article
                    key={entry.id}
                    className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <Link href={`/entries/${entry.id}`}>
                      <h3 className="mb-2 text-xl font-semibold text-zinc-900 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300">
                        {entry.title}
                      </h3>
                    </Link>
                    <div className="mb-4 line-clamp-3">
                      <Markdown content={contentPreview} />
                    </div>
                    <div className="flex items-center justify-between">
                      <RelativeTime
                        date={entry.created_at}
                        className="text-sm text-zinc-500 dark:text-zinc-400"
                      />
                      {entry.content.length > 200 && (
                        <Link
                          href={`/entries/${entry.id}`}
                          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          Read more →
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
