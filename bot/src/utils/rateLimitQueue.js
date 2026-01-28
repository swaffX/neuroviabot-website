const { EventEmitter } = require('events');

class RateLimitQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
        this.requestCount = 0;
        this.windowStart = Date.now();
        this.maxRequests = 50; // Discord API limit
        this.windowSize = 1000; // 1 saniye
        
        // Her saniye request sayacını sıfırla
        setInterval(() => {
            this.requestCount = 0;
            this.windowStart = Date.now();
            this.processQueue();
        }, this.windowSize);
    }

    // İsteği kuyruğa ekle
    addRequest(requestData) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                ...requestData,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }

    // Kuyruğu işle
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0 && this.requestCount < this.maxRequests) {
            const request = this.queue.shift();
            
            try {
                // Rate limit kontrolü
                if (this.requestCount >= this.maxRequests) {
                    // Kuyruğa geri koy
                    this.queue.unshift(request);
                    break;
                }

                this.requestCount++;
                
                // İsteği gönder
                const result = await this.executeRequest(request);
                request.resolve(result);
                
                // İstekler arası kısa bekleme (rate limit için)
                await this.sleep(20); // 20ms bekleme
                
            } catch (error) {
                request.reject(error);
            }
        }

        this.isProcessing = false;
    }

    // Gerçek API isteğini gönder
    async executeRequest(request) {
        const { method, url, data, headers } = request;
        
        // Discord API isteği
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
                ...headers
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            if (response.status === 429) {
                // Rate limit exceeded
                const retryAfter = response.headers.get('Retry-After') || 1;
                await this.sleep(retryAfter * 1000);
                throw new Error(`Rate limit exceeded. Retry after ${retryAfter}s`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Bekleme fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Kuyruk durumu
    getQueueStatus() {
        return {
            queueLength: this.queue.length,
            requestCount: this.requestCount,
            maxRequests: this.maxRequests,
            isProcessing: this.isProcessing,
            windowRemaining: this.windowSize - (Date.now() - this.windowStart)
        };
    }

    // Kuyruğu temizle
    clearQueue() {
        this.queue.forEach(request => {
            request.reject(new Error('Queue cleared'));
        });
        this.queue = [];
    }
}

module.exports = new RateLimitQueue();
