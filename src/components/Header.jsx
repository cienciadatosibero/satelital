function Header() {
  return (
    <header className="h-[68px] px-4 bg-slate-950 border-b border-white/10 flex items-center gap-3 shrink-0">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
        <img
          src="/logo.ico"
          alt="Logo"
          className="w-8 h-8 object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-white text-lg font-black leading-tight truncate">
          Detector de paneles solares
        </h1>
      </div>

      <div className="px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-200 text-xs font-black">
        React
      </div>
    </header>
  );
}

export default Header;