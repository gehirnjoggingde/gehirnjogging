import { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00 – 23

export default function TimePickerModal({ currentTime, onSave, onClose, loading }) {
  const [selected, setSelected] = useState(currentTime || '08:00');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Quiz-Uhrzeit ändern</h2>
        <p className="text-sm text-gray-400 mb-5">Wähle, wann du täglich dein Quiz auf WhatsApp erhalten möchtest.</p>

        <div className="grid grid-cols-4 gap-2 mb-6 max-h-64 overflow-y-auto pr-0.5">
          {HOURS.map(h => {
            const val = `${String(h).padStart(2, '0')}:00`;
            const active = selected === val;
            return (
              <button
                key={h}
                onClick={() => setSelected(val)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[.97] ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700 border border-gray-100'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm text-brand-700 font-medium">Ausgewählt:</span>
          <span className="text-sm font-extrabold text-brand-700">{selected} Uhr</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
            Abbrechen
          </button>
          <button
            onClick={() => onSave(selected)}
            disabled={loading}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Speichern…
              </span>
            ) : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
