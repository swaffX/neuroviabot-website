export default function LoginPage() {
  // Discord OAuth URL
  const DISCORD_CLIENT_ID = '1294392725863514122' // process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  const DISCORD_REDIRECT_URI = 'https://neuroviabot.onrender.com/api/auth/callback'
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`

  return (
    <html lang="tr" style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <head>
        <title>Discord Giriş - NeuroVia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="refresh" content={`0; url=${discordAuthUrl}`} />
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
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .container {
            text-align: center;
            padding: 2rem;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
          }
          
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .button {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 16px 32px;
            border-radius: 16px;
            text-decoration: none;
            font-size: 1.1rem;
            font-weight: 700;
            display: inline-block;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
          }
          
          .button:hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 20px 30px rgba(59, 130, 246, 0.4);
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="spinner"></div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Discord'a Yönlendiriliyorsunuz...
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              Birkaç saniye içinde Discord giriş sayfasına yönlendirileceksiniz.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Eğer yönlendirilmediyseniz aşağıdaki butona tıklayın:
            </p>
            <a href={discordAuthUrl} className="button">
              🎮 Discord ile Giriş Yap
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}