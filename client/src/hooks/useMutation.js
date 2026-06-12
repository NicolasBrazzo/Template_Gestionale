import { useState, useCallback } from "react";

/**
 * useMutation — sostituto "fatto a mano" di useMutation di TanStack.
 *
 * Per le SCRITTURE (POST / PUT / DELETE). Gestisce loading ed errore
 * della singola operazione, così nelle pagine non ripeti ogni volta
 * try/catch + stato di caricamento.
 *
 * A differenza di useFetch NON parte da solo: lo lanci tu quando serve
 * (es. nel submit di un form o nell'onClick di un bottone).
 *
 * @param {Function} mutationFn  Funzione async che esegue la scrittura.
 *                               Riceve gli argomenti che passi a mutate().
 *                               Es: (payload) => createClient(payload)
 * @param {Object}   [options]
 *   - onSuccess(result): callback chiamata se la scrittura riesce
 *   - onError(message):  callback chiamata se la scrittura fallisce
 *
 * @returns {{ mutate, isLoading, error }}
 *   - mutate(...args): lancia la mutazione. Ritorna i dati in caso di successo,
 *                      altrimenti rilancia l'errore (così puoi anche usare try/catch).
 *   - isLoading:       true mentre la scrittura è in corso
 *   - error:           messaggio d'errore (null se tutto ok)
 *
 * Esempio:
 *   const { mutate: removeClient, isLoading } = useMutation(deleteClient, {
 *     onSuccess: () => { showSuccess("Eliminato"); refetch(); },
 *   });
 *   // poi: await removeClient(clientId);
 */
export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(...args);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        const message = err.message || "Si è verificato un errore";
        setError(message);
        if (onError) onError(message);
        // rilancio: così chi chiama mutate() può anche gestirlo con try/catch
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn]
  );

  return { mutate, isLoading, error };
}
