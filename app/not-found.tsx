export default function NotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--ds-color-text-primary)' }}>
        Page not found
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--ds-color-text-secondary)' }}>
        The page you requested does not exist.
      </p>
    </main>
  )
}
