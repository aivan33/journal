import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EntryDetail } from '@/components/entry-detail'
import { getRelatedEntries } from '@/lib/supabase/queries'
import { RelativeTime } from '@/components/relative-time'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function EntryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !entry) {
    notFound()
  }

  // Fetch related entries using vector similarity
  const relatedEntries = await getRelatedEntries(id, 3)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to all entries
        </Link>

        <EntryDetail entry={entry} />

        {relatedEntries.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Related Entries
            </h2>
            <div className="space-y-4">
              {relatedEntries.map((relatedEntry) => {
                const contentPreview =
                  relatedEntry.content.length > 150
                    ? relatedEntry.content.slice(0, 150) + '...'
                    : relatedEntry.content

                return (
                  <Link
                    key={relatedEntry.id}
                    href={`/entries/${relatedEntry.id}`}
                    className="block"
                  >
                    <article className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {relatedEntry.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {Math.round(relatedEntry.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {contentPreview}
                      </p>
                      <RelativeTime
                        date={relatedEntry.created_at}
                        className="text-xs text-zinc-500 dark:text-zinc-500"
                      />
                    </article>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
