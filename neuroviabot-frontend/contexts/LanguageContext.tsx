'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'tr' | 'en';

interface Translations {
    common: {
        welcome: string;
        loading: string;
        error: string;
        success: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        search: string;
        filter: string;
        close: string;
        open: string;
    };
    nav: {
        home: string;
        features: string;
        commands: string;
        dashboard: string;
        about: string;
        support: string;
        login: string;
        logout: string;
        servers: string;
    };
    home: {
        hero_title: string;
        hero_subtitle: string;
        get_started: string;
        learn_more: string;
        trusted_by: string;
        servers_count: string;
        users_count: string;
        commands_count: string;
    };
    features: {
        moderation: string;
        moderation_desc: string;
        leveling: string;
        leveling_desc: string;
        automod: string;
        automod_desc: string;
        custom_commands: string;
        custom_commands_desc: string;
        analytics: string;
        analytics_desc: string;
    };
    dashboard: {
        settings: string;
        members: string;
        analytics: string;
        moderation: string;
        leveling: string;
        welcome: string;
        logs: string;
        overview: string;
        manage: string;
    };
    footer: {
        description: string;
        quick_links: string;
        resources: string;
        legal: string;
        privacy_policy: string;
        terms_of_service: string;
        copyright: string;
    };
}

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
    tr: {
        common: {
            welcome: 'Hoş Geldiniz',
            loading: 'Yükleniyor...',
            error: 'Hata',
            success: 'Başarılı',
            save: 'Kaydet',
            cancel: 'İptal',
            delete: 'Sil',
            edit: 'Düzenle',
            search: 'Ara',
            filter: 'Filtrele',
            close: 'Kapat',
            open: 'Aç',
        },
        nav: {
            home: 'Ana Sayfa',
            features: 'Özellikler',
            commands: 'Komutlar',
            dashboard: 'Panel',
            about: 'Hakkımızda',
            support: 'Destek',
            login: 'Giriş Yap',
            logout: 'Çıkış Yap',
            servers: 'Sunucular',
        },
        home: {
            hero_title: 'Discord Sunucunuzu Güçlendirin',
            hero_subtitle: 'Moderasyon, ekonomi, seviye sistemi ve daha fazlasıyla sunucunuzu profesyonelce yönetin',
            get_started: 'Başlayın',
            learn_more: 'Daha Fazla Bilgi',
            trusted_by: 'Binlerce Sunucu Tarafından Güvenilir',
            servers_count: 'Sunucu',
            users_count: 'Kullanıcı',
            commands_count: 'Komut',
        },
        features: {
            moderation: 'Moderasyon',
            moderation_desc: 'Güçlü moderasyon araçları ile sunucunuzu yönetin',
            leveling: 'Seviye Sistemi',
            leveling_desc: 'Seviye ve ödül sistemi ile etkileşimi artırın',
            automod: 'Otomatik Moderasyon',
            automod_desc: 'Anti-spam, link filtreleme ve kelime filtresi',
            custom_commands: 'Özel Komutlar',
            custom_commands_desc: 'Kendi özel komutlarınızı oluşturun',
            analytics: 'Analitik',
            analytics_desc: 'Detaylı sunucu istatistikleri ve raporlar',
        },
        dashboard: {
            settings: 'Ayarlar',
            members: 'Üyeler',
            analytics: 'Analitik',
            moderation: 'Moderasyon',
            leveling: 'Seviye Sistemi',
            welcome: 'Hoş Geldin Mesajı',
            logs: 'Loglar',
            overview: 'Genel Bakış',
            manage: 'Yönet',
        },
        footer: {
            description: 'Discord sunucunuz için en gelişmiş yönetim botu',
            quick_links: 'Hızlı Bağlantılar',
            resources: 'Kaynaklar',
            legal: 'Yasal',
            privacy_policy: 'Gizlilik Politikası',
            terms_of_service: 'Kullanım Koşulları',
            copyright: 'Tüm hakları saklıdır.',
        },
    },
    en: {
        common: {
            welcome: 'Welcome',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            filter: 'Filter',
            close: 'Close',
            open: 'Open',
        },
        nav: {
            home: 'Home',
            features: 'Features',
            commands: 'Commands',
            dashboard: 'Dashboard',
            about: 'About',
            support: 'Support',
            login: 'Login',
            logout: 'Logout',
            servers: 'Servers',
        },
        home: {
            hero_title: 'Supercharge Your Discord Server',
            hero_subtitle: 'Manage your server professionally with moderation, economy, leveling and more',
            get_started: 'Get Started',
            learn_more: 'Learn More',
            trusted_by: 'Trusted by Thousands of Servers',
            servers_count: 'Servers',
            users_count: 'Users',
            commands_count: 'Commands',
        },
        features: {
            moderation: 'Moderation',
            moderation_desc: 'Manage your server with powerful moderation tools',
            leveling: 'Leveling System',
            leveling_desc: 'Increase engagement with leveling and rewards',
            automod: 'Auto-Moderation',
            automod_desc: 'Anti-spam, link filtering, and word filter',
            custom_commands: 'Custom Commands',
            custom_commands_desc: 'Create your own custom commands',
            analytics: 'Analytics',
            analytics_desc: 'Detailed server statistics and reports',
        },
        dashboard: {
            settings: 'Settings',
            members: 'Members',
            analytics: 'Analytics',
            moderation: 'Moderation',
            leveling: 'Leveling',
            welcome: 'Welcome Message',
            logs: 'Logs',
            overview: 'Overview',
            manage: 'Manage',
        },
        footer: {
            description: 'The most advanced management bot for your Discord server',
            quick_links: 'Quick Links',
            resources: 'Resources',
            legal: 'Legal',
            privacy_policy: 'Privacy Policy',
            terms_of_service: 'Terms of Service',
            copyright: 'All rights reserved.',
        },
    },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('tr');

    useEffect(() => {
        // Load language from localStorage
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
            setLanguage(savedLang);
        }
    }, []);

    useEffect(() => {
        // Save language to localStorage
        localStorage.setItem('language', language);
    }, [language]);

    const value = {
        language,
        setLanguage,
        t: translations[language],
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

