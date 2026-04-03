import { useState } from 'react';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 09 – 22

export default function TimePickerModal({ currentTime, onSave, onClose, loading }) {
  const [selected, setSelected] = useState(currentTime || '09:00');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Quiz-Uhrzeit ändern</h2>
        <p className="text-sm text-gray-500 mb-5">Wähle, wann du täglich dein Quiz erhalten möchtest (09:00 – 22:00 Uhr).</p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {HOURS.map(h => {
            const val = `${String(h).padStart(2, '0')}:00`;
            const active = selected === val;
            return (
              <button
                key={h}
                onClick={() => setSelected(val)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {val}
              </button>
            );
          })}
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
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
