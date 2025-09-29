import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  Dns,
  Settings,
  MusicNote,
  Security,
  EmojiEvents,
  AttachMoney,
  Forum,
  TrendingUp,
  People,
  VerifiedUser,
  Assignment,
  BarChart,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 60;

const Sidebar = ({ open, onClose, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Ana sayfa ve genel bilgiler',
    },
    {
      text: 'Sunucular',
      icon: <Dns />,
      path: '/guilds',
      description: 'Bot\'un bulunduğu sunucular',
      badge: '12',
    },
  ];

  const systemItems = [
    {
      text: 'Müzik Sistemi',
      icon: <MusicNote />,
      path: '/music',
      description: 'Müzik bot özellikleri',
      color: '#5865f2',
    },
    {
      text: 'Ticket Sistemi',
      icon: <Assignment />,
      path: '/tickets',
      description: 'Destek ticket yönetimi',
      color: '#43b581',
    },
    {
      text: 'Ekonomi',
      icon: <AttachMoney />,
      path: '/economy',
      description: 'Para ve ekonomi sistemi',
      color: '#faa61a',
    },
    {
      text: 'Çekilişler',
      icon: <EmojiEvents />,
      path: '/giveaways',
      description: 'Çekiliş yönetimi',
      color: '#f04747',
    },
    {
      text: 'Moderasyon',
      icon: <Security />,
      path: '/moderation',
      description: 'Güvenlik ve moderasyon',
      color: '#9b59b6',
    },
    {
      text: 'Seviye Sistemi',
      icon: <TrendingUp />,
      path: '/leveling',
      description: 'XP ve seviye yönetimi',
      color: '#e67e22',
    },
    {
      text: 'Üye Yönetimi',
      icon: <People />,
      path: '/members',
      description: 'Kullanıcı ve rol yönetimi',
      color: '#1abc9c',
    },
    {
      text: 'Doğrulama',
      icon: <VerifiedUser />,
      path: '/verification',
      description: 'Üye doğrulama sistemi',
      color: '#3498db',
    },
  ];

  const bottomItems = [
    {
      text: 'İstatistikler',
      icon: <BarChart />,
      path: '/statistics',
      description: 'Detaylı analitik veriler',
    },
    {
      text: 'Ayarlar',
      icon: <Settings />,
      path: '/settings',
      description: 'Bot ve panel ayarları',
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const isActive = (path) => location.pathname === path;

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Info */}
      <Box 
        sx={{ 
          p: 2, 
          mt: 8, // Account for navbar height
          borderBottom: '1px solid #42464d',
          minHeight: 80,
        }}
      >
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.guilds?.length || 0} sunucu yöneticisi
            </Typography>
          </motion.div>
        ) : (
          <Tooltip title={user?.username || 'User'} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#43b581',
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List dense>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ px: open ? 1 : 0.5 }}>
                <Tooltip title={!open ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      borderRadius: 2,
                      mx: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: '#5865f230',
                        borderLeft: '3px solid #5865f2',
                        '&:hover': {
                          backgroundColor: '#5865f240',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#42464d50',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive(item.path) ? '#5865f2' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText 
                        primary={item.text}
                        secondary={item.description}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive(item.path) ? 600 : 400,
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                    {open && item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        color="primary"
                        sx={{ ml: 1, fontSize: '0.7rem' }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </motion.div>
          ))}
        </List>

        <Divider sx={{ my: 1, mx: 2 }} />

        {/* System Features */}
        {open && (
          <Typography
            variant="overline"
            sx={{
              px: 3,
              py: 1,
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            Bot Sistemleri
          </Typography>
        )}

        <List dense>
          {systemItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (menuItems.length + index) * 0.1 }}
            >
              <ListItem disablePadding sx={{ px: open ? 1 : 0.5 }}>
                <Tooltip title={!open ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      borderRadius: 2,
                      mx: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: `${item.color}30`,
                        borderLeft: `3px solid ${item.color}`,
                        '&:hover': {
                          backgroundColor: `${item.color}40`,
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#42464d50',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive(item.path) ? item.color : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        secondary={item.description}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive(item.path) ? 600 : 400,
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>

      {/* Bottom Navigation */}
      <Box sx={{ borderTop: '1px solid #42464d' }}>
        <List dense>
          {bottomItems.map((item, index) => (
            <ListItem key={item.path} disablePadding sx={{ px: open ? 1 : 0.5 }}>
              <Tooltip title={!open ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#5865f230',
                      borderLeft: '3px solid #5865f2',
                    },
                    '&:hover': {
                      backgroundColor: '#42464d50',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? '#5865f2' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.text}
                      secondary={item.description}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: isActive(item.path) ? 600 : 400,
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
            boxSizing: 'border-box',
            backgroundColor: '#36393f',
            borderRight: '1px solid #42464d',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
      >
        <DrawerContent />
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            backgroundColor: '#36393f',
            borderRight: '1px solid #42464d',
          },
        }}
      >
        <DrawerContent />
      </Drawer>
    </>
  );
};

export default Sidebar;



