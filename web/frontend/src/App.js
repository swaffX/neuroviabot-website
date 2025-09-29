import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Backdrop } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GuildsPage from './pages/GuildsPage';
import GuildDashboard from './pages/GuildDashboard';
import SettingsPage from './pages/SettingsPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Services
import { authService } from './services/authService';
import { socketService } from './services/socketService';

// Hooks
import { useAuth } from './hooks/useAuth';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

function App() {
  const { user, loading, setUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is already authenticated
        const token = localStorage.getItem('discord_token');
        if (token) {
          authService.setToken(token);
          const userData = await authService.getUser();
          setUser(userData);
          
          // Initialize socket connection
          socketService.connect(token);
          
          // Setup socket event listeners
          socketService.on('connect', () => {
            console.log('Connected to socket server');
          });
          
          socketService.on('disconnect', () => {
            console.log('Disconnected from socket server');
          });
          
          socketService.on('error', (error) => {
            console.error('Socket error:', error);
            toast.error('Bağlantı hatası: ' + error.message);
          });
        }
      } catch (error) {
        console.error('App initialization error:', error);
        localStorage.removeItem('discord_token');
        authService.setToken(null);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [setUser]);

  // Handle authentication from Discord OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !user) {
      handleDiscordCallback(code);
    }
  }, [user]);

  const handleDiscordCallback = async (code) => {
    try {
      setInitialLoading(true);
      const { token, user: userData } = await authService.loginWithDiscord(code);
      
      localStorage.setItem('discord_token', token);
      authService.setToken(token);
      setUser(userData);
      
      // Initialize socket with new token
      socketService.connect(token);
      
      toast.success(`Hoş geldin, ${userData.username}!`);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Discord login error:', error);
      toast.error('Discord girişi başarısız: ' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('discord_token');
    authService.setToken(null);
    socketService.disconnect();
    setUser(null);
    toast.success('Başarıyla çıkış yapıldı');
  };

  if (initialLoading || loading) {
    return (
      <Backdrop open={true} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" size={60} />
      </Backdrop>
    );
  }

  // Check for public routes that don't require authentication
  const currentPath = window.location.pathname;
  const publicRoutes = ['/terms', '/privacy'];
  const isPublicRoute = publicRoutes.includes(currentPath);

  if (!user && !isPublicRoute) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <LoginPage />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Handle public routes without authentication
  if (!user && isPublicRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/terms" 
            element={
              <motion.div
                key="terms"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <TermsOfService />
              </motion.div>
            } 
          />
          <Route 
            path="/privacy" 
            element={
              <motion.div
                key="privacy"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <PrivacyPolicy />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          user={user}
        />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            marginLeft: sidebarOpen ? '240px' : '60px',
            transition: 'margin-left 0.3s ease',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/" 
                element={
                  <motion.div
                    key="dashboard"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <DashboardPage />
                  </motion.div>
                } 
              />
              <Route 
                path="/guilds" 
                element={
                  <motion.div
                    key="guilds"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <GuildsPage />
                  </motion.div>
                } 
              />
              <Route 
                path="/guild/:guildId" 
                element={
                  <motion.div
                    key="guild-dashboard"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <GuildDashboard />
                  </motion.div>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <motion.div
                    key="settings"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <SettingsPage />
                  </motion.div>
                } 
              />
              <Route 
                path="/terms" 
                element={
                  <motion.div
                    key="terms"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <TermsOfService />
                  </motion.div>
                } 
              />
              <Route 
                path="/privacy" 
                element={
                  <motion.div
                    key="privacy"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                  >
                    <PrivacyPolicy />
                  </motion.div>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

export default App;

