import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Chip, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

type Option = { label: string; value: string|number };

export default function ModernSearchBar({
  placeholder,
  value,
  onChange,
  chips,
  onClear,
  extra,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  chips?: Array<{ label: string; onClick: () => void; color?: 'default'|'primary'|'secondary'|'success'|'warning'|'error' }>
  onClear?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <Box sx={{ display:'flex', gap:1, alignItems:'center', flexWrap:'wrap', mb: 1.5 }}>
      <TextField
        placeholder={placeholder||'Cerca...'}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        sx={{
          minWidth: 260,
          '& .MuiOutlinedInput-root': { borderRadius: 0, background:'rgba(255,255,255,0.9)' },
        }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          endAdornment: value && <InputAdornment position="end"><IconButton size="small" onClick={onClear}><ClearIcon /></IconButton></InputAdornment>
        }}
      />
      {chips?.map((c, idx)=> (
        <Chip key={idx} label={c.label} onClick={c.onClick} color={c.color} variant="outlined" sx={{ borderRadius:0 }} />
      ))}
      <Box sx={{ flex:1 }} />
      {extra}
    </Box>
  );
}


