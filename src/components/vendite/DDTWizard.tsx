import React from 'react';
import SalesDocWizardCore from './SalesDocWizardCore';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../lib/apiService';

export default function DDTWizard() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const id = Number(params.get('id') || 0);
  const [prefill, setPrefill] = React.useState<any | null>(null);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (id > 0) {
        try {
          const { ddt, righe } = await apiService.getDDTVenditaById(id);
          if (!ignore) setPrefill({ ddt, righe });
        } catch (e) { console.error('Errore caricamento DDT', e); }
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  return <SalesDocWizardCore mode="ddt" existing={id>0 && prefill ? { id, ddt: prefill.ddt, righe: prefill.righe } : undefined} />;
}
