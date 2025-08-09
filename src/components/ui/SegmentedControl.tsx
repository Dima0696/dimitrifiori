import React from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

export default function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      sx={{
        '& .MuiToggleButton-root': {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 600,
        }
      }}
    >
      {options.map(opt => (
        <ToggleButton key={opt.value} value={opt.value}>{opt.label}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}


