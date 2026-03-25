export default function ContractDetailPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Détail du contrat</h2>
        <span className="inline-block text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full mb-3">Phase 2</span>
        <p className="text-sm text-slate-500">La vue détaillée d'un contrat sera disponible prochainement.</p>
      </div>
    </div>
  );
}
