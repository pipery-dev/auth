export default function InvalidState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Login blocked</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-3">Auth request could not be verified</h1>
          <p className="text-gray-600 text-sm mb-6">
            Pipery Auth could not verify which Pipery app started this login request.
          </p>
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
