'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import './investments.scss';

interface Investment {
    id: string;
    userId: string;
    amount: number;
    startDate: string;
    endDate: string;
    apy: number;
    status: 'active' | 'completed' | 'withdrawn_early';
    earnedInterest: number;
}

interface InvestmentPlan {
    duration: number;
    apy: number;
    minAmount: number;
    maxAmount: number;
}

export default function Investments() {
    const params = useParams();
    const serverId = params?.id as string;

    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
    const [investAmount, setInvestAmount] = useState<string>('');

    const plans: InvestmentPlan[] = [
        { duration: 7, apy: 5, minAmount: 100, maxAmount: 50000 },
        { duration: 30, apy: 15, minAmount: 500, maxAmount: 100000 },
        { duration: 90, apy: 35, minAmount: 1000, maxAmount: 500000 }
    ];

    useEffect(() => {
        fetchInvestments();
    }, [serverId]);

    const fetchInvestments = async () => {
        try {
            const userId = 'USER_ID_HERE';
            const response = await fetch(`/api/nrc/investments/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setInvestments(data.investments || []);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching investments:', error);
            setLoading(false);
        }
    };

    const handleCreateInvestment = async () => {
        if (!selectedPlan || !investAmount) {
            alert('Lütfen bir plan seçin ve miktar girin!');
            return;
        }

        const amount = parseInt(investAmount);
        if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
            alert(`Miktar ${selectedPlan.minAmount}-${selectedPlan.maxAmount} NRC arasında olmalıdır!`);
            return;
        }

        try {
            const response = await fetch('/api/nrc/invest/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'USER_ID_HERE',
                    amount,
                    duration: selectedPlan.duration
                })
            });

            if (response.ok) {
                alert('Yatırım başarıyla oluşturuldu!');
                setInvestAmount('');
                setSelectedPlan(null);
                fetchInvestments();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating investment:', error);
            alert('Yatırım oluşturulurken bir hata oluştu!');
        }
    };

    const handleWithdraw = async (investmentId: string, forceEarly: boolean = false) => {
        try {
            const response = await fetch(`/api/nrc/invest/withdraw/${investmentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'USER_ID_HERE',
                    forceEarly
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Yatırım çekildi! Toplam: ${data.withdrawal.totalReturn.toLocaleString()} NRC`);
                fetchInvestments();
            } else {
                const data = await response.json();
                alert(`Hata: ${data.error}`);
            }
        } catch (error) {
            console.error('Error withdrawing investment:', error);
            alert('Çekim sırasında bir hata oluştu!');
        }
    };

    const calculatePotentialEarnings = (amount: number, apy: number) => {
        return Math.floor(amount * (apy / 100));
    };

    const getDaysRemaining = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getProgressPercentage = (startDate: string, endDate: string) => {
        const now = new Date().getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const progress = ((now - start) / (end - start)) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    if (loading) {
        return (
            <div className="investments-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yatırımlar Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="investments-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>💰 NRC Yatırımları</h1>
                <p>NRC\'nizi kilitleyin ve pasif gelir kazanın</p>
            </motion.div>

            <div className="create-investment-section">
                <h2>📈 Yeni Yatırım Oluştur</h2>
                
                <div className="plans-grid">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.duration}
                            className={`plan-card ${selectedPlan?.duration === plan.duration ? 'selected' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedPlan(plan)}
                        >
                            <div className="plan-header">
                                <h3>{plan.duration} Gün</h3>
                                <div className="plan-apy">{plan.apy}% APY</div>
                            </div>
                            <div className="plan-details">
                                <div className="plan-range">
                                    Min: {plan.minAmount.toLocaleString()} NRC
                                </div>
                                <div className="plan-range">
                                    Max: {plan.maxAmount.toLocaleString()} NRC
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {selectedPlan && (
                    <motion.div
                        className="investment-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <div className="form-group">
                            <label>Yatırım Miktarı (NRC)</label>
                            <input
                                type="number"
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                placeholder={`${selectedPlan.minAmount} - ${selectedPlan.maxAmount}`}
                                min={selectedPlan.minAmount}
                                max={selectedPlan.maxAmount}
                            />
                        </div>

                        {investAmount && parseInt(investAmount) >= selectedPlan.minAmount && (
                            <div className="earnings-preview">
                                <h4>💵 Tahmini Kazanç</h4>
                                <div className="preview-grid">
                                    <div className="preview-item">
                                        <span className="label">Yatırım</span>
                                        <span className="value">{parseInt(investAmount).toLocaleString()} NRC</span>
                                    </div>
                                    <div className="preview-item">
                                        <span className="label">Faiz</span>
                                        <span className="value green">
                                            +{calculatePotentialEarnings(parseInt(investAmount), selectedPlan.apy).toLocaleString()} NRC
                                        </span>
                                    </div>
                                    <div className="preview-item">
                                        <span className="label">Toplam Geri Dönüş</span>
                                        <span className="value total">
                                            {(parseInt(investAmount) + calculatePotentialEarnings(parseInt(investAmount), selectedPlan.apy)).toLocaleString()} NRC
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            className="create-button"
                            onClick={handleCreateInvestment}
                        >
                            Yatırım Yap
                        </button>

                        <p className="warning-text">
                            ⚠️ Erken çekim durumunda %25 ceza uygulanır!
                        </p>
                    </motion.div>
                )}
            </div>

            <div className="active-investments-section">
                <h2>📊 Aktif Yatırımlarım</h2>

                {investments.length > 0 ? (
                    <div className="investments-grid">
                        {investments.map((investment, index) => {
                            const daysRemaining = getDaysRemaining(investment.endDate);
                            const progress = getProgressPercentage(investment.startDate, investment.endDate);
                            const isMatured = daysRemaining <= 0;

                            return (
                                <motion.div
                                    key={investment.id}
                                    className={`investment-card ${investment.status}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="investment-header">
                                        <h3>💰 {investment.amount.toLocaleString()} NRC</h3>
                                        <span className={`status-badge ${investment.status}`}>
                                            {investment.status === 'active' ? '🟢 Aktif' : 
                                             investment.status === 'completed' ? '✅ Tamamlandı' : 
                                             '⏸️ Erken Çekildi'}
                                        </span>
                                    </div>

                                    <div className="investment-details">
                                        <div className="detail-row">
                                            <span className="label">APY:</span>
                                            <span className="value">{investment.apy}%</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Başlangıç:</span>
                                            <span className="value">
                                                {new Date(investment.startDate).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Bitiş:</span>
                                            <span className="value">
                                                {new Date(investment.endDate).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        {investment.status === 'active' && (
                                            <div className="detail-row">
                                                <span className="label">Kalan:</span>
                                                <span className="value">
                                                    {isMatured ? '✅ Vadesi Doldu!' : `${daysRemaining} gün`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {investment.status === 'active' && (
                                        <>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>

                                            <div className="investment-actions">
                                                {isMatured ? (
                                                    <button
                                                        className="withdraw-button matured"
                                                        onClick={() => handleWithdraw(investment.id, false)}
                                                    >
                                                        ✅ Çek (Faiz İle)
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="withdraw-button early"
                                                        onClick={() => {
                                                            if (confirm('Erken çekim %25 ceza içerir. Devam etmek istiyor musunuz?')) {
                                                                handleWithdraw(investment.id, true);
                                                            }
                                                        }}
                                                    >
                                                        ⚠️ Erken Çek (-%25)
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {investment.status === 'completed' && (
                                        <div className="completed-info">
                                            <span className="earned-label">Kazanılan Faiz:</span>
                                            <span className="earned-value">
                                                +{investment.earnedInterest.toLocaleString()} NRC
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Henüz aktif yatırımınız yok.</p>
                        <p>Yukarıdaki planlardan birini seçerek yatırım yapabilirsiniz.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

