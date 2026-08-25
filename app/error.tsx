"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button
        type="button"
        className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  )
}
