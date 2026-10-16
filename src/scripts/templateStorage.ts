export interface TemplateDraft { id: string; html: string; updated: number }
export interface SavedPdf { id: string; templateId: string; title: string; created: number; blob: Blob }
const databaseName = 'umsa-template-workspace';
let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('drafts', { keyPath: 'id' });
      request.result.createObjectStore('pdfs', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error('Cerrá otras pestañas del editor y volvé a intentar.')); };
  });
  return database;
}

async function transaction<T>(store: 'drafts' | 'pdfs', mode: IDBTransactionMode, action: (target: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = action(tx.objectStore(store));
    // A successful request can still be rolled back by a failed commit (e.g. quota).
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error || request.error);
    tx.onabort = () => reject(tx.error || new Error('No se pudo guardar en este navegador.'));
  });
}

export const readDraft = (id: string) => transaction<TemplateDraft | undefined>('drafts', 'readonly', store => store.get(id));
export const saveDraft = (draft: TemplateDraft) => transaction<IDBValidKey>('drafts', 'readwrite', store => store.put(draft));
export const removeDraft = (id: string) => transaction<undefined>('drafts', 'readwrite', store => store.delete(id));
export const savePdf = (pdf: SavedPdf) => transaction<IDBValidKey>('pdfs', 'readwrite', store => store.put(pdf));
export const listPdfs = () => transaction<SavedPdf[]>('pdfs', 'readonly', store => store.getAll());
export const removePdf = (id: string) => transaction<undefined>('pdfs', 'readwrite', store => store.delete(id));
