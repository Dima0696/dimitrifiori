import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Autocomplete, Chip, FormControl, Select, MenuItem,
  Paper, Typography, Divider, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

interface SearchFilter {
  field: string;
  value: string;
  label: string;
}

interface AdvancedSearchProps {
  title: string;
  placeholder: string;
  data: any[];
  searchFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
  }>;
  onSearch?: (filteredData: any[]) => void;
  getOptionLabel?: (option: any) => string;
  renderOption?: (option: any) => React.ReactNode;
}

export default function AdvancedSearch({
  title,
  placeholder,
  data,
  searchFields,
  onSearch = () => {},
  getOptionLabel,
  renderOption
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Genera opzioni uniche per i campi select
  const getUniqueOptions = (fieldKey: string) => {
    const values = data
      .map(item => item[fieldKey])
      .filter(value => value && value !== '')
      .sort();
    return [...new Set(values)];
  };

  // Applica ricerca e filtri
  useEffect(() => {
    console.log('🔍 AdvancedSearch - Applicando filtri...');
    console.log('📋 Dati originali:', data.length);
    console.log('🔍 Termine di ricerca:', searchTerm);
    console.log('🔍 Filtri attivi:', filters);
    
    let filteredData = [...data];

    // Filtro per termine di ricerca generale
    if (searchTerm && searchTerm.trim() !== '') {
      filteredData = filteredData.filter(item => {
        return searchFields.some(field => {
          const value = item[field.key];
          if (!value) return false;
          return (value?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
      console.log('🔍 Dopo ricerca generale:', filteredData.length);
    }

    // Applica filtri specifici
    filters.forEach(filter => {
      if (filter.value && filter.value.trim() !== '') {
        filteredData = filteredData.filter(item => {
          const value = item[filter.field];
          if (!value) return false;
          return (value?.toString() || '').toLowerCase().includes(filter.value.toLowerCase());
        });
        console.log(`🔍 Dopo filtro ${filter.field}:`, filteredData.length);
      }
    });

    console.log('✅ Risultati finali:', filteredData.length);
    onSearch(filteredData);
  }, [searchTerm, filters, data]); // Rimossi 'searchFields' e 'onSearch' dalle dipendenze

  const addFilter = (field: string, label: string) => {
    console.log('🔍 Aggiungendo filtro:', field, label);
    if (!filters.find(f => f.field === field)) {
      setFilters([...filters, { field, value: '', label }]);
    }
  };

  const updateFilter = (field: string, value: string) => {
    setFilters(filters.map(f => f.field === field ? { ...f, value } : f));
  };

  const removeFilter = (field: string) => {
    setFilters(filters.filter(f => f.field !== field));
  };

  const clearAll = () => {
    setSearchTerm('');
    setFilters([]);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color="primary">
            {title}
          </Typography>
          <Chip 
            label={`${data.length} totali`} 
            size="small" 
            variant="outlined" 
            color="primary"
          />
        </Box>
        <Box>
          <Tooltip title="Mostra/Nascondi filtri">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          {(searchTerm || filters.length > 0) && (
            <Tooltip title="Cancella tutto">
              <IconButton onClick={clearAll} color="error" size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Ricerca generale */}
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ mb: 2 }}
      />

      {/* Filtri avanzati */}
      {showFilters && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Filtri avanzati
          </Typography>
          
          {/* Pulsanti per aggiungere filtri */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {searchFields.map(field => (
              <Chip
                key={field.key}
                label={field.label}
                onClick={() => addFilter(field.key, field.label)}
                variant={filters.find(f => f.field === field.key) ? 'filled' : 'outlined'}
                color={filters.find(f => f.field === field.key) ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Box>

          {/* Filtri attivi */}
          {filters.map(filter => (
            <Box key={filter.field} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                {filter.label}:
              </Typography>
              {searchFields.find(f => f.key === filter.field)?.type === 'select' ? (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.field, e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {getUniqueOptions(filter.field).map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  size="small"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.field, e.target.value)}
                  placeholder={`Cerca ${filter.label.toLowerCase()}...`}
                  sx={{ minWidth: 200 }}
                />
              )}
              <IconButton 
                size="small" 
                onClick={() => removeFilter(filter.field)}
                color="error"
              >
                <ClearIcon />
              </IconButton>
            </Box>
          ))}
        </>
      )}

      {/* Autocomplete per selezione rapida */}
      {getOptionLabel && (
        <Autocomplete
          options={data}
          getOptionLabel={getOptionLabel}
          renderOption={renderOption}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Seleziona rapidamente..."
              size="small"
            />
          )}
          onChange={(_, value) => {
            if (value) {
              // Qui puoi implementare la logica per selezionare l'elemento
              console.log('Elemento selezionato:', value);
            }
          }}
          sx={{ mt: 2 }}
          key={`autocomplete-${title}`} // Key unica per evitare conflitti
        />
      )}
    </Paper>
  );
} 