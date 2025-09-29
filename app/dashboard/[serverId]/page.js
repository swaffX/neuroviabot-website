export default function DashboardPage({ params }) {
  const serverId = params.serverId

  const serverName = serverId === '1' ? 'Awesome Gaming Community' : 
                     serverId === '2' ? 'Chill Zone' : 
                     serverId === '3' ? 'Developer Hub' : 
                     `Server ${serverId}`

  const memberCount = serverId === '1' ? 1250 : serverId === '2' ? 89 : 456

  return (
    <html lang="tr" style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <head>
        <title>{`Dashboard - ${serverName} - NeuroVia`}</title>
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
            display: flex;
            min-height: 100vh;
          }
          
          .sidebar {
            width: 300px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2rem;
          }
          
          .main-content {
            flex: 1;
            padding: 2rem;
          }
          
          .server-info {
            margin-bottom: 2rem;
            text-align: center;
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
            margin: 0 auto 1rem;
          }
          
          .nav-item {
            display: block;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            text-decoration: none;
            color: #94a3b8;
            transition: all 0.3s ease;
          }
          
          .nav-item:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }
          
          .nav-item.active {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 1.5rem;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
          }
          
          .stat-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          
          .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          
          .stat-label {
            color: #94a3b8;
            font-size: 0.9rem;
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
            margin-right: 1rem;
            margin-bottom: 1rem;
          }
          
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          }
          
          .button-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
          }
          
          .feature-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            transition: all 0.3s ease;
          }
          
          .feature-card:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .container {
              flex-direction: column;
            }
            .sidebar {
              width: 100%;
              padding: 1rem;
            }
            .main-content {
              padding: 1rem;
            }
            .stats-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="sidebar">
            <div className="server-info">
              <div className="server-icon">
                {serverName[0].toUpperCase()}
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {serverName}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {memberCount.toLocaleString()} üye
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
                <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Bot Aktif</span>
              </div>
              <a href="/servers" className="button button-secondary" style={{ width: '100%', textAlign: 'center' }}>
                🏰 Sunuculara Dön
              </a>
            </div>

            <nav>
              <a href="#" className="nav-item active">📊 Genel Bakış</a>
              <a href="#" className="nav-item">🎵 Müzik</a>
              <a href="#" className="nav-item">🛡️ Moderasyon</a>
              <a href="#" className="nav-item">💰 Ekonomi</a>
              <a href="#" className="nav-item">⚙️ Ayarlar</a>
            </nav>
          </div>

          <div className="main-content">
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                📊 Genel Bakış
              </h1>
              <p style={{ color: '#94a3b8' }}>
                {serverName} sunucusu için bot yönetim paneli
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-number">{memberCount.toLocaleString()}</div>
                <div className="stat-label">Üye Sayısı</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-number" style={{ color: '#22c55e' }}>Aktif</div>
                <div className="stat-label">Bot Durumu</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-number">1,234</div>
                <div className="stat-label">Komut Kullanımı</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎵</div>
                <div className="stat-number">-</div>
                <div className="stat-label">Müzik Oturumu</div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                🚀 Hızlı İşlemler
              </h3>
              <div className="features-grid">
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎵</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Müzik Başlat</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Müzik çalmaya başla</p>
                </div>
                
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Moderasyon</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sunucu moderasyonu</p>
                </div>
                
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Ekonomi</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Ekonomi sistemi</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                ℹ️ Bot Özellikleri
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                Bu dashboard yakında daha fazla özellik ile güncellenecek. Şu anda temel bot fonksiyonları aktif durumda.
              </p>
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '8px', 
                padding: '1rem' 
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#3b82f6' }}>
                  🚧 Yakında Gelecek Özellikler:
                </h4>
                <ul style={{ color: '#94a3b8', paddingLeft: '1rem' }}>
                  <li>Gerçek zamanlı müzik kontrolü</li>
                  <li>Gelişmiş moderasyon araçları</li>
                  <li>Kullanıcı istatistikleri</li>
                  <li>Özelleştirilebilir komutlar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}