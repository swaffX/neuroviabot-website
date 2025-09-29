export default function ServersPage() {
  return (
    <html lang="tr" style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <head>
        <title>Sunucularım - NeuroVia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            background: linear-gradient(135deg, #0f172a 0%, #3730a3 50%, #0f172a 100%);
            color: white;
            min-height: 100vh;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          
          .container {
            padding: 2rem;
            min-height: 100vh;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3rem;
          }
          
          .title {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 2rem;
            transition: all 0.3s ease;
          }
          
          .card:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
          }
          
          .button {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          }
          
          .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .server-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          
          .server-card:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-5px);
          }
          
          .server-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          
          .status-active {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }
          
          .status-inactive {
            background: rgba(156, 163, 175, 0.2);
            color: #9ca3af;
            border: 1px solid rgba(156, 163, 175, 0.3);
          }
          
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            .title {
              font-size: 2rem;
            }
            .servers-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1 className="title">🏰 Sunucularım</h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
              Botun bulunduğu sunucuları yönet veya yeni sunuculara ekle
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Giriş Yapmanız Gerekiyor</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Sunucularınızı görmek için Discord ile giriş yapmanız gerekiyor.
            </p>
            <a href="/auth/login" className="button">
              🎮 Discord ile Giriş Yap
            </a>
          </div>

          <div className="servers-grid">
            <div className="server-card">
              <div className="server-icon">A</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Awesome Gaming Community
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                1,250 üye
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span className="status-badge status-active">
                  Bot aktif
                </span>
              </div>
              <a href="/dashboard/1" className="button">
                🎛️ Dashboard
              </a>
            </div>

            <div className="server-card">
              <div className="server-icon">C</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Chill Zone
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                89 üye
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span className="status-badge status-inactive">
                  Bot yok
                </span>
              </div>
              <button className="button" style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
                ➕ Bot Ekle
              </button>
            </div>

            <div className="server-card">
              <div className="server-icon">D</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Developer Hub
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                456 üye
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <span className="status-badge status-active">
                  Bot aktif
                </span>
              </div>
              <a href="/dashboard/3" className="button">
                🎛️ Dashboard
              </a>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🤖 Yeni Sunucuya Bot Ekle
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              NeuroVia botunu başka sunucularına da ekleyebilirsin. Müzik, moderasyon ve ekonomi özelliklerinden faydalanmaya başla!
            </p>
            <button className="button" style={{ 
              background: 'linear-gradient(135deg, #16a34a, #059669)',
              fontSize: '1.1rem',
              padding: '16px 32px'
            }}>
              🚀 Bot Davet Et
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <a href="/" className="button" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              🏠 Ana Sayfaya Dön
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}