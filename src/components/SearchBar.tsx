import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
  sx?: object;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Cerca...', 
  onSearch, 
  initialValue = '', 
  sx 
}) => {
  const [value, setValue] = useState(initialValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, ...sx }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchBar; 