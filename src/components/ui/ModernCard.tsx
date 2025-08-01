import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface ModernCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  gradient?: string[];
  onClick?: () => void;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function ModernCard({
  title,
  subtitle,
  value,
  trend,
  icon,
  gradient,
  onClick,
  children,
  action,
}: ModernCardProps) {
  const theme = useTheme();

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          background: gradient 
            ? `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
            : theme.palette.background.paper,
          color: gradient ? '#ffffff' : 'inherit',
          position: 'relative',
          overflow: 'hidden',
          '&::before': gradient ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {icon && (
                <Avatar
                  sx={{
                    bgcolor: gradient ? alpha('#ffffff', 0.2) : alpha(theme.palette.primary.main, 0.1),
                    color: gradient ? '#ffffff' : theme.palette.primary.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  {icon}
                </Avatar>
              )}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: gradient ? alpha('#ffffff', 0.8) : theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: gradient ? alpha('#ffffff', 0.6) : theme.palette.text.disabled,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
            {action || (
              <IconButton
                size="small"
                sx={{
                  color: gradient ? alpha('#ffffff', 0.7) : theme.palette.text.secondary,
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: trend ? 1 : 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: gradient ? '#ffffff' : theme.palette.text.primary,
              }}
            >
              {value}
            </Typography>
          </Box>

          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                icon={trend.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${Math.abs(trend.value)}%`}
                size="small"
                sx={{
                  bgcolor: trend.direction === 'up' 
                    ? alpha(theme.palette.success.main, gradient ? 0.2 : 0.1)
                    : alpha(theme.palette.error.main, gradient ? 0.2 : 0.1),
                  color: trend.direction === 'up' 
                    ? gradient ? '#ffffff' : theme.palette.success.main
                    : gradient ? '#ffffff' : theme.palette.error.main,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
            </Box>
          )}

          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ModernCard;
