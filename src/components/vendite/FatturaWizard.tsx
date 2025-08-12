import React from 'react';
import SalesDocWizardCore from './SalesDocWizardCore';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../lib/apiService';

export default function FatturaWizard() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const id = Number(params.get('id') || 0);
  const [prefill, setPrefill] = React.useState<any | null>(null);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (id > 0) {
        try {
          const { fattura, righe } = await (apiService as any).getFatturaVenditaById(id);
          if (!ignore) setPrefill({ fattura, righe });
        } catch (e) { console.error('Errore caricamento Fattura', e); }
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  return <SalesDocWizardCore mode="fattura" existing={id>0 && prefill ? { id, fattura: prefill.fattura, righe: prefill.righe } : undefined} />;
}
