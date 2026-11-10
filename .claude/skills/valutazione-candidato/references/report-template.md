# Template del report

Il report va in `valutazioni/<id>/valutazione.md`. Compila ogni sezione. Dove un dato manca, scrivi "non verificato" o "non valutabile" con il motivo.

```markdown
# Valutazione: <id candidato>

- **Data valutazione:** <aaaa-mm-gg>
- **Progetto:** <path>
- **Note dell'intervistatore:** sì | no
- **Raccomandazione:** Procedere | Da approfondire | Non procedere
- **Media pesata:** <n,nn> su 4 (<aree incluse>)

> Se l'area "Comprensione e comunicazione" non è valutabile: la media è calcolata sulle altre aree.

## Esito tecnico

| Controllo | Esito | Note |
| --- | --- | --- |
| `package.json` (script e dipendenze) | ok / da segnalare | |
| `npm install --ignore-scripts` | ok / errore | |
| `ng build` | ok / errore | primi errori |
| `ng test` | ok / errore / nessun test | n. test, cosa coprono |

## Funzionalità del brief

| Funzionalità | Stato | Evidenza |
| --- | --- | --- |
| Login, token, logout, 401 | funziona / parziale / manca / non verificato | `path:riga` |
| Lista: paginazione, filtri, ricerca | | |
| Dettaglio e commenti | | |
| Creazione e modifica con errori per campo | | |
| Cambio stato con 422 | | |
| Stati: caricamento, vuoto, errore | | |

Extra presenti: <elenco, o "nessuno">

## Punteggi

| Area | Peso | Punteggio | Motivo ed evidenze |
| --- | --- | --- | --- |
| Funzionalità obbligatorie | <da guida> | n | `path:riga` |
| Angular moderno | | | |
| Gestione HTTP ed errori | | | |
| Form | | | |
| Struttura e leggibilità | | | |
| Comprensione e comunicazione | | n / non valutabile | dalle note |

## Segnali d'allarme

Elenco con evidenza `path:riga`. Indica quali sono bloccanti. Se non ce ne sono, scrivi "nessuno".

## Adattamento a Titano

| Pratica | Cosa si osserva | Gap |
| --- | --- | --- |
| Errori HTTP centralizzati | | da formare / strutturale / nessuno |
| Signal, `inject()`, OnPush/zoneless | | |
| Tipi ai confini | | |
| Dipendenze tra feature | | |
| Test su logica reale | | |
| Stringhe e i18n | | |
| Codice in inglese | | |
| Ambiguità sul contratto BE | | |
| Librerie UI | | |

## Punti di forza

Massimo tre, ognuno con evidenza.

## Domande per un secondo colloquio

Solo se la raccomandazione è "Da approfondire". Domande legate a gap concreti, ognuna con la riga di codice da cui nasce.

## Raccomandazione

Due o tre frasi: la decisione, i tre punti che l'hanno determinata, il rischio principale se si procede.
```
