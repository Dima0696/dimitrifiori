import React from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';

interface Action {
  label: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick: () => void;
  tooltip?: string;
  active?: boolean;
}

interface ActionToolbarProps {
  actions: Action[];
  sticky?: boolean;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ actions, sticky }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        background: '#f7f8fa',
        borderBottom: '1.5px solid #e3e9f7',
        boxShadow: sticky ? '0 2px 12px 0 rgba(0,0,0,0.04)' : 'none',
        position: sticky ? 'sticky' : 'static',
        top: sticky ? 0 : 'auto',
        zIndex: sticky ? 100 : 'auto',
        mb: 2,
        minHeight: 56,
      }}
    >
      {actions.map((action, idx) => (
        <Tooltip title={action.tooltip || action.label} key={action.label + idx} arrow>
          <Button
            variant={action.active ? 'contained' : 'text'}
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{
              fontWeight: 700,
              fontSize: 16,
              px: 2.5,
              py: 1.2,
              borderRadius: 2,
              textTransform: 'uppercase',
              boxShadow: action.active ? '0 2px 8px 0 rgba(0,122,255,0.08)' : 'none',
              background: action.active ? 'linear-gradient(90deg, #007aff 60%, #00c6fb 100%)' : 'none',
              color: action.active ? '#fff' : undefined,
              '&:hover': {
                background: action.active
                  ? 'linear-gradient(90deg, #005ecb 60%, #009ecb 100%)'
                  : 'rgba(0,122,255,0.08)',
              },
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <Typography component="span" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              {action.label}
            </Typography>
          </Button>
        </Tooltip>
      ))}
    </Box>
  );
};

export default ActionToolbar; 