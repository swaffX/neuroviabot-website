#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorLog(message, color = 'white') {
    console.log(colors[color] + message + colors.reset);
}

function clearConsole() {
    process.stdout.write('\x1b[2J\x1b[0f');
}

function showHeader() {
    clearConsole();
    colorLog('========================================', 'cyan');
    colorLog('   DISCORD BOT FULL STACK STARTER', 'cyan');
    colorLog('========================================', 'cyan');
    console.log('');
    colorLog('🚀 Tüm sistemler başlatılıyor...', 'green');
    console.log('');
}

function showSystemInfo() {
    colorLog('🎯 Sistemler başlatılıyor:', 'cyan');
    colorLog('  • Database: SQLite (otomatik)', 'white');
    colorLog('  • Backend API: http://localhost:3001', 'white');
    colorLog('  • Frontend Web: http://localhost:3002', 'white');
    colorLog('  • Discord Bot: Online', 'white');
    console.log('');
}

function showLinks() {
    console.log('');
    colorLog('✅ TÜM SİSTEMLER BAŞLATILDI!', 'green');
    console.log('');
    colorLog('🌍 ERİŞİM LİNKLERİ:', 'cyan');
    console.log('  • Web Panel: ' + colors.blue + 'http://localhost:3002' + colors.reset);
    console.log('  • API Backend: ' + colors.blue + 'http://localhost:3001' + colors.reset);
    console.log('  • Socket.IO: ' + colors.blue + 'ws://localhost:3001' + colors.reset);
    console.log('');
    colorLog('💡 İPUÇLARI:', 'yellow');
    colorLog('  • Bot durumunu Discord\'da kontrol edin', 'white');
    colorLog('  • Web panel\'de giriş yapmak için Discord hesabınızı kullanın', 'white');
    colorLog('  • Hata logu için Backend penceresine bakın', 'white');
    console.log('');
    colorLog('🔧 KAPATMAK İÇİN: Ctrl+C tuşuna basın', 'red');
    console.log('');
}

async function killExistingProcesses() {
    return new Promise((resolve) => {
        colorLog('🔄 Eski processler temizleniyor...', 'yellow');
        
        const killCommand = process.platform === 'win32' 
            ? 'taskkill /F /IM node.exe 2>nul' 
            : 'pkill -f node';
            
        exec(killCommand, (error) => {
            // Ignore errors (process might not exist)
            setTimeout(resolve, 2000);
        });
    });
}

async function startBackend() {
    return new Promise((resolve, reject) => {
        colorLog('📡 Backend + Bot başlatılıyor...', 'blue');
        
        const backend = spawn('node', ['index.js'], {
            stdio: ['inherit', 'pipe', 'pipe']
        });

        backend.stdout.on('data', (data) => {
            const message = data.toString();
            if (message.includes('ready') || message.includes('başladı') || message.includes('logged in')) {
                resolve(backend);
            }
            process.stdout.write(colors.dim + '[Backend] ' + colors.reset + message);
        });

        backend.stderr.on('data', (data) => {
            process.stderr.write(colors.red + '[Backend Error] ' + colors.reset + data.toString());
        });

        backend.on('close', (code) => {
            colorLog(`Backend process exited with code ${code}`, 'red');
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            resolve(backend);
        }, 30000);
    });
}

async function startFrontend() {
    return new Promise((resolve) => {
        colorLog('🌐 Frontend başlatılıyor...', 'blue');
        
        const frontendDir = path.join(__dirname, 'web', 'frontend');
        
        const frontend = spawn('npm', ['start'], {
            cwd: frontendDir,
            stdio: ['inherit', 'pipe', 'pipe'],
            env: { ...process.env, PORT: '3002' }
        });

        frontend.stdout.on('data', (data) => {
            const message = data.toString();
            process.stdout.write(colors.dim + '[Frontend] ' + colors.reset + message);
        });

        frontend.stderr.on('data', (data) => {
            process.stderr.write(colors.magenta + '[Frontend] ' + colors.reset + data.toString());
        });

        frontend.on('close', (code) => {
            colorLog(`Frontend process exited with code ${code}`, 'red');
        });

        resolve(frontend);
    });
}

async function main() {
    const processes = [];
    
    try {
        showHeader();
        
        // Create logs directory
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
        
        // Kill existing processes
        await killExistingProcesses();
        
        showSystemInfo();
        
        // Start backend
        const backend = await startBackend();
        processes.push(backend);
        
        // Wait a bit for backend to initialize
        colorLog('⏳ Backend hazırlanırken bekleniyor... (5 saniye)', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Start frontend
        const frontend = await startFrontend();
        processes.push(frontend);
        
        // Wait for frontend to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        showLinks();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('');
            colorLog('🛑 Sistemler kapatılıyor...', 'yellow');
            
            processes.forEach(proc => {
                if (proc && !proc.killed) {
                    proc.kill('SIGTERM');
                }
            });
            
            setTimeout(() => {
                colorLog('✅ Tüm sistemler kapatıldı!', 'green');
                process.exit(0);
            }, 3000);
        });
        
        // Keep the process alive
        process.stdin.resume();
        
    } catch (error) {
        colorLog('❌ Sistem başlatılırken hata oluştu:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
}
