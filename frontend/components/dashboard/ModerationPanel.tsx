'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Badge from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { 
    ShieldCheckIcon, 
    ExclamationTriangleIcon, 
    UserMinusIcon,
    ClockIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    BellAlertIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ModerationPanelProps {
    guildId: string;
}

interface ModerationStats {
    totalWarnings: number;
    totalBans: number;
    totalKicks: number;
    totalMutes: number;
    totalTempBans: number;
    recentCases: number;
    activeMutes: number;
    activeTempBans: number;
}

interface ModerationCase {
    caseNumber: number;
    type: string;
    userId: string;
    username: string;
    moderatorId: string;
    moderatorName: string;
    reason: string;
    createdAt: string;
}

interface ActiveAction {
    id: string;
    type: 'mute' | 'tempban';
    userId: string;
    username: string;
    reason: string;
    expiresAt: string;
    createdAt: string;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ guildId }) => {
    const [stats, setStats] = useState<ModerationStats | null>(null);
    const [cases, setCases] = useState<ModerationCase[]>([]);
    const [activeActions, setActiveActions] = useState<ActiveAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        fetchModerationData();
    }, [guildId]);

    const fetchModerationData = async () => {
        setLoading(true);
        setError(null);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neuroviabot.xyz';
            
            // Fetch stats
            const statsResponse = await axios.get(`${API_URL}/api/moderation/stats/${guildId}`, {
                withCredentials: true
            });
            
            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }

            // Fetch recent cases
            const casesResponse = await axios.get(`${API_URL}/api/moderation/cases/${guildId}?limit=20`, {
                withCredentials: true
            });
            
            if (casesResponse.data.success) {
                setCases(casesResponse.data.cases || []);
            }

            // Fetch active actions (mutes, tempbans)
            const actionsResponse = await axios.get(`${API_URL}/api/moderation/active/${guildId}`, {
                withCredentials: true
            });
            
            if (actionsResponse.data.success) {
                setActiveActions(actionsResponse.data.actions || []);
            }

        } catch (err: any) {
            console.error('Failed to fetch moderation data:', err);
            setError(err.response?.data?.error || 'Failed to load moderation data');
        } finally {
            setLoading(false);
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} gün ${hours % 24} saat`;
        }
        
        return `${hours} saat ${minutes} dakika`;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            kick: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            ban: 'bg-red-500/20 text-red-400 border-red-500/50',
            tempban: 'bg-orange-600/20 text-orange-300 border-orange-600/50',
            mute: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
            unmute: 'bg-green-500/20 text-green-400 border-green-500/50',
            unban: 'bg-green-500/20 text-green-400 border-green-500/50'
        };
        return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warn': return '⚠️';
            case 'kick': return '👢';
            case 'ban': return '🔨';
            case 'tempban': return '⏰';
            case 'mute': return '🔇';
            case 'unmute': return '🔊';
            case 'unban': return '🔓';
            default: return '📋';
        }
    };

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-purple-600">🛡️ Moderasyon Paneli</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Yükleniyor...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-purple-600">🛡️ Moderasyon Paneli</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                        <p className="text-red-400">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-purple-600">🛡️ Moderasyon Paneli</CardTitle>
                <p className="text-sm text-gray-500">Sunucu moderasyon sisteminizi yönetin.</p>
            </CardHeader>
            <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid grid-cols-4 gap-4 mb-6">
                        <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                        <TabsTrigger value="cases">Vakalar</TabsTrigger>
                        <TabsTrigger value="active">Aktif İşlemler</TabsTrigger>
                        <TabsTrigger value="settings">Ayarlar</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Uyarılar</p>
                                        <p className="text-2xl font-bold text-yellow-400">{stats?.totalWarnings || 0}</p>
                                    </div>
                                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Atılanlar</p>
                                        <p className="text-2xl font-bold text-orange-400">{stats?.totalKicks || 0}</p>
                                    </div>
                                    <UserMinusIcon className="w-8 h-8 text-orange-400" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Yasaklamalar</p>
                                        <p className="text-2xl font-bold text-red-400">{stats?.totalBans || 0}</p>
                                    </div>
                                    <ShieldCheckIcon className="w-8 h-8 text-red-400" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Susturmalar</p>
                                        <p className="text-2xl font-bold text-gray-400">{stats?.totalMutes || 0}</p>
                                    </div>
                                    <ClockIcon className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Recent Activity */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5" />
                                Son Aktiviteler
                            </h3>
                            <div className="space-y-2">
                                {cases.slice(0, 5).map((case_) => (
                                    <div
                                        key={case_.caseNumber}
                                        className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{getTypeIcon(case_.type)}</span>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={getTypeColor(case_.type)}>
                                                            {case_.type.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-sm text-gray-400">Case #{case_.caseNumber}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        <span className="font-semibold">{case_.username}</span> - {case_.reason}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Moderatör: {case_.moderatorName} • {new Date(case_.createdAt).toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Cases Tab */}
                    <TabsContent value="cases" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tüm Moderasyon Vakaları</h3>
                            <Badge>Toplam: {cases.length}</Badge>
                        </div>

                        <div className="space-y-2">
                            {cases.map((case_) => (
                                <div
                                    key={case_.caseNumber}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <span className="text-3xl">{getTypeIcon(case_.type)}</span>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={getTypeColor(case_.type)}>
                                                        {case_.type.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-sm font-semibold text-gray-300">Case #{case_.caseNumber}</span>
                                                </div>
                                                <p className="text-sm text-gray-300 mb-1">
                                                    <span className="font-semibold text-white">{case_.username}</span>
                                                </p>
                                                <p className="text-sm text-gray-400 mb-2">
                                                    <span className="font-semibold">Sebep:</span> {case_.reason}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Moderatör: {case_.moderatorName} • {new Date(case_.createdAt).toLocaleString('tr-TR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Active Actions Tab */}
                    <TabsContent value="active" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Aktif Moderasyon İşlemleri</h3>
                            <Badge>
                                {stats?.activeMutes || 0} Mute • {stats?.activeTempBans || 0} TempBan
                            </Badge>
                        </div>

                        {activeActions.length === 0 ? (
                            <div className="text-center py-12">
                                <ClockIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                                <p className="text-gray-400">Aktif moderasyon işlemi bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeActions.map((action) => (
                                    <div
                                        key={action.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <span className="text-3xl">
                                                    {action.type === 'mute' ? '🔇' : '⏰'}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={getTypeColor(action.type)}>
                                                            {action.type.toUpperCase()}
                                                        </Badge>
                                                        <Badge variant="warning" className="text-yellow-400">
                                                            {getTimeRemaining(action.expiresAt)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-semibold text-white mb-1">
                                                        {action.username}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mb-1">
                                                        <span className="font-semibold">Sebep:</span> {action.reason}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Başlangıç: {new Date(action.createdAt).toLocaleString('tr-TR')} • 
                                                        Bitiş: {new Date(action.expiresAt).toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Cog6ToothIcon className="w-5 h-5" />
                                Moderasyon Ayarları
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-white">Auto-Mod</p>
                                            <p className="text-sm text-gray-400">Otomatik moderasyon sistemi</p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Yapılandır
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-white">Raid Protection</p>
                                            <p className="text-sm text-gray-400">Raid saldırılarına karşı koruma</p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Yapılandır
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-white">Mod Log Kanalı</p>
                                            <p className="text-sm text-gray-400">Moderasyon loglarının gönderileceği kanal</p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Seç
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default ModerationPanel;

