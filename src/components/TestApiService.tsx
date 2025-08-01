// Test del nuovo API Service
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import apiService from '../lib/apiService';

interface Stats {
  gruppi: number;
  prodotti: number;
  colori: number;
  provenienze: number;
  foto: number;
  imballaggi: number;
  altezze: number;
  articoli: number;
  fornitori: number;
}

export default function TestApiService() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sampleData, setSampleData] = useState<any>(null);

  useEffect(() => {
    testApi();
  }, []);

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test connessione
      console.log('🔍 Testing API connection...');
      const isConnected = await apiService.testConnection();
      setConnected(isConnected);

      if (!isConnected) {
        setError('Database non raggiungibile');
        return;
      }

      // Test statistiche
      console.log('📊 Getting stats...');
      const statistics = await apiService.getStats();
      setStats(statistics);

      // Test lettura dati campione
      console.log('📋 Getting sample data...');
      const [gruppi, prodotti, colori, altezze, articoli] = await Promise.all([
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getAltezze(),
        apiService.getArticoli()
      ]);

      setSampleData({
        gruppi: gruppi.slice(0, 3),
        prodotti: prodotti.slice(0, 3),
        colori: colori.slice(0, 5),
        altezze: altezze.slice(0, 5),
        articoli: articoli.slice(0, 3)
      });

      console.log('✅ Test completato con successo!');

    } catch (error) {
      console.error('❌ Errore durante il test:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Testing API Service...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Errore API: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test API Service - Nuovo Database
      </Typography>

      {/* Status connessione */}
      <Alert severity={connected ? "success" : "error"} sx={{ mb: 3 }}>
        <Typography variant="h6">
          Database: {connected ? '✅ Connesso' : '❌ Disconnesso'}
        </Typography>
        <Typography variant="body2">
          Sistema a 7 caratteristiche: Gruppo + Prodotto + Colore + Provenienza + Foto + Imballo + <strong>Altezza</strong>
        </Typography>
      </Alert>

      {/* Statistiche */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Statistiche Database
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Chip label={`Gruppi: ${stats.gruppi}`} color="primary" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Prodotti: ${stats.prodotti}`} color="secondary" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Colori: ${stats.colori}`} color="success" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Provenienze: ${stats.provenienze}`} color="info" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Foto: ${stats.foto}`} color="warning" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Imballaggi: ${stats.imballaggi}`} color="error" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Altezze: ${stats.altezze}`} color="primary" variant="outlined" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip label={`Articoli: ${stats.articoli}`} color="secondary" variant="outlined" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dati campione */}
      {sampleData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🌸 Gruppi Campione
                </Typography>
                {sampleData.gruppi.map((gruppo: any) => (
                  <Typography key={gruppo.id} variant="body2">
                    • {gruppo.nome}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🌺 Prodotti Campione
                </Typography>
                {sampleData.prodotti.map((prodotto: any) => (
                  <Typography key={prodotto.id} variant="body2">
                    • {prodotto.nome}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎨 Colori Campione
                </Typography>
                {sampleData.colori.map((colore: any) => (
                  <Chip
                    key={colore.id}
                    label={colore.nome}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📏 Altezze Campione (NUOVO!)
                </Typography>
                {sampleData.altezze.map((altezza: any) => (
                  <Chip
                    key={altezza.id}
                    label={`${altezza.altezza_cm}cm`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📦 Articoli Campione (7 caratteristiche)
                </Typography>
                {sampleData.articoli.map((articolo: any) => (
                  <Alert key={articolo.id} severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{articolo.nome_completo}</strong>
                    </Typography>
                    <Typography variant="caption">
                      Articolo con 7 caratteristiche complete
                    </Typography>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
