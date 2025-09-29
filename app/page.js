export default function HomePage() {
  return (
    <html lang="tr" style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <head>
        <title>NeuroVia - Discord Bot Dashboard</title>
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3rem;
          }
          
          .title {
            font-size: 4rem;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
          }
          
          .subtitle {
            font-size: 1.5rem;
            color: #cbd5e1;
            margin-bottom: 1rem;
          }
          
          .description {
            font-size: 1rem;
            color: #94a3b8;
            max-width: 600px;
            line-height: 1.6;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            margin-bottom: 2rem;
            max-width: 600px;
            width: 100%;
          }
          
          .button {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 16px 32px;
            border-radius: 16px;
            text-decoration: none;
            font-size: 1.2rem;
            font-weight: 700;
            display: inline-block;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .button:hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 20px 30px rgba(59, 130, 246, 0.4);
          }
          
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
            max-width: 800px;
            width: 100%;
          }
          
          .feature-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            transition: all 0.3s ease;
          }
          
          .feature-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
          }
          
          .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          
          .feature-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          
          .feature-desc {
            color: #94a3b8;
            font-size: 0.9rem;
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            max-width: 600px;
            width: 100%;
          }
          
          .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
          }
          
          .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #3b82f6;
          }
          
          .stat-label {
            font-size: 0.8rem;
            color: #94a3b8;
          }
          
          @media (max-width: 768px) {
            .title {
              font-size: 2.5rem;
            }
            .container {
              padding: 1rem;
            }
            .features {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1 className="title">🤖 NeuroVia</h1>
            <p className="subtitle">Modern Discord Bot Dashboard</p>
            <p className="description">
              Gelişmiş müzik sistemi, güçlü moderasyon araçları ve ekonomi sistemi ile sunucunuzu yönetin.
            </p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Discord Bot Dashboard'a Hoş Geldiniz! 🎉
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Botunuzu yönetmek için Discord ile giriş yapın
            </p>
            <a href="/auth/login" className="button">
              🎮 Discord ile Giriş Yap
            </a>
          </div>

          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">🎵</div>
              <h3 className="feature-title">Müzik Sistemi</h3>
              <p className="feature-desc">Yüksek kaliteli müzik çalma, playlist yönetimi ve ses kontrolü.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Moderasyon</h3>
              <p className="feature-desc">Güçlü moderasyon araçları ile sunucunuzu güvende tutun.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Ekonomi</h3>
              <p className="feature-desc">Sanal para sistemi, mağaza ve oyunlar ile eğlence.</p>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Aktif Sunucu</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Kullanıcı</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">99%</div>
              <div className="stat-label">Memnuniyet</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}