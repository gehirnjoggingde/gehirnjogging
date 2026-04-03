export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-semibold text-gray-600">Gehirnjogging</span>
        </div>
        <div className="flex gap-6">
          <a href="/datenschutz" className="hover:text-gray-700">Datenschutz</a>
          <a href="/impressum" className="hover:text-gray-700">Impressum</a>
          <a href="/agb" className="hover:text-gray-700">AGB</a>
        </div>
        <p>© {new Date().getFullYear()} Gehirnjogging. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}
