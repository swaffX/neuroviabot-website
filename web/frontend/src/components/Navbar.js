import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Chip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  Notifications,
  Dashboard,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Navbar = ({ onMenuClick, onLogout, user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#36393f',
        borderBottom: '1px solid #42464d',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Dashboard sx={{ mr: 1, color: '#5865f2' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #5865f2, #43b581)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Discord Bot Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Online Status */}
          <Chip
            label="Çevrimiçi"
            size="small"
            sx={{
              backgroundColor: '#43b58115',
              color: '#43b581',
              border: '1px solid #43b58130',
              fontWeight: 500,
            }}
          />

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.username || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                #{user?.discriminator || '0000'}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar
                src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined}
                sx={{ 
                  width: 40, 
                  height: 40,
                  border: '2px solid #5865f2',
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              minWidth: 200,
              backgroundColor: '#36393f',
              border: '1px solid #42464d',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email || `${user?.username}#${user?.discriminator}`}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            Profil
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Ayarlar
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#f04747' }}>
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: '#f04747' }} />
            </ListItemIcon>
            Çıkış Yap
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1.5,
              minWidth: 300,
              maxWidth: 400,
              backgroundColor: '#36393f',
              border: '1px solid #42464d',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #42464d' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Bildirimler
            </Typography>
          </Box>
          {[
            { title: 'Yeni üye katıldı', message: 'TestUser sunucuya katıldı', time: '2d önce' },
            { title: 'Çekiliş bitti', message: 'Discord Nitro çekilişi sonuçlandı', time: '1s önce' },
            { title: 'Sistem güncellemesi', message: 'Bot v2.1.0 güncellendi', time: '3s önce' },
          ].map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationClose}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;



