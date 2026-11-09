# Helpdesk (prova pratica)

Angular 21, senza zone.js, solo CSS (nessuna libreria UI). Il server finto è in `mock-server` e gira su `http://localhost:3000`.

```
ng serve
```

Login di prova: `mario.rossi` / `password`.

## Scelte

- **Struttura.** `core/` ha modelli, service, interceptor e guard. `features/` ha una cartella per pagina. I componenti sono standalone con caricamento lazy.
- **Token.** Salvato in `localStorage` da `AuthService` e aggiunto dall'interceptor a ogni chiamata API. Su un `401` l'interceptor fa il logout e torna al login (escluso il login stesso).
- **Lista.** L'URL è la fonte di verità: filtri, ricerca e pagina stanno nei query params, quindi ricaricare la pagina o tornare indietro mantiene lo stato. La ricerca ha un debounce di 300 ms. `switchMap` scarta la richiesta precedente se i filtri cambiano mentre è in corso.
- **Form.** Reactive form tipizzati. Gli errori `400` del server vengono messi sul campo giusto da `applyServerErrors` (con test). Un messaggio non legato a un campo compare sopra il form.
- **Cambio stato.** Il dettaglio offre solo le transizioni valide, copiate dalle regole del server. Se il server rifiuta comunque (`422`), mostra il messaggio e ricarica il ticket.
- **Statistiche.** `/api/stats` fallisce a caso: l'errore compare con un pulsante "Riprova".
- **Test.** Uno solo, su `applyServerErrors`, l'unica logica non banale che non è già coperta dal server o dai tipi.

## Cosa farei con più tempo

- Spostare le regole di transizione dal client a un campo del server (oggi sono duplicate).
- Tradurre i messaggi del server (arrivano in inglese).
- Se le categorie o gli utenti non si caricano, `LookupService` mostra un trattino senza avvisare: serve un errore visibile e un nuovo tentativo.
- Ordinamento per colonna e selezione della dimensione della pagina.
- Test dell'interceptor e del flusso di login.
