export const metadata = {
  title: "Offline — Ordix",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-2xl border border-black/10 bg-black/5 grid place-items-center">
          <span className="text-xl">⬚</span>
        </div>
        <h1 className="text-xl font-medium text-black">You’re offline</h1>
        <p className="mt-2 text-sm text-black/60">
          Ordix can’t reach the network right now. Please reconnect and try again.
        </p>
      </div>
    </div>
  );
}

