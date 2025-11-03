export default function Loading() {
  return (
    <div className="container mx-auto animate-pulse py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile sidebar skeleton */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-32 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </div>

          {/* Credibility card skeleton */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>

          {/* Activity card skeleton */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="h-5 w-20 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="md:col-span-2">
          <div className="mb-6 h-6 w-40 rounded bg-muted" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-4 h-5 w-3/4 rounded bg-muted" />
                <div className="flex space-x-4">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}