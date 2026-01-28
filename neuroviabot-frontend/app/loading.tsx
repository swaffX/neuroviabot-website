export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="text-center">
        {/* Animated Logo/Spinner */}
        <div className="relative inline-block mb-8">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl opacity-30 animate-pulse" />
          
          {/* Spinner rings */}
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin-slow" />
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Yükleniyor
        </h2>
        <p className="text-slate-400">
          Lütfen bekleyin...
        </p>

        {/* Loading dots animation */}
        <div className="flex gap-2 justify-center mt-4">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
