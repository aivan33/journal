import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Entry Not Found
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          The entry you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Back to Journal
        </Link>
      </div>
    </div>
  )
}
