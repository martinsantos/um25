import { Plant } from '../game/types';

/**
 * Sistema inteligente de guardado de sesión
 * - Comprime datos para ahorrar memoria
 * - Mantiene ID único por sesión
 * - Guarda logs, puntos, estados, disposiciones
 */

export interface SessionData {
  id: string;
  timestamp: number;
  userId: string;
  gameState: {
    plants: Plant[];
    money: number;
    gameDay: number;
    season: string;
    weather: string;
    environment: string;
    greenhouse: string;
    temperature: number;
    humidity: number;
  };
  logs: SessionLog[];
  stats: {
    totalPointsGained: number;
    totalPointsInvested: number;
    plantsHarvested: number;
    plantsDead: number;
    totalGameTime: number;
  };
}

export interface SessionLog {
  timestamp: number;
  action: string;
  plantId?: number;
  details?: Record<string, any>;
}

/**
 * Genera ID único para cada sesión
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Guarda la sesión actual en localStorage (comprimida)
 */
export function saveSession(gameState: any, userId: string = 'anonymous'): SessionData {
  const sessionData: SessionData = {
    id: generateSessionId(),
    timestamp: Date.now(),
    userId,
    gameState: {
      plants: gameState.plants || [],
      money: gameState.money || 0,
      gameDay: gameState.gameDay || 0,
      season: gameState.season || 'Primavera',
      weather: gameState.weather || 'Soleado',
      environment: gameState.environment || 'outdoor',
      greenhouse: gameState.greenhouse || 'geodesic',
      temperature: gameState.temperature || 20,
      humidity: gameState.humidity || 50,
    },
    logs: gameState.sessionLogs || [],
    stats: {
      totalPointsGained: gameState.totalPointsGained || 0,
      totalPointsInvested: gameState.totalPointsInvested || 0,
      plantsHarvested: gameState.plantsHarvested || 0,
      plantsDead: gameState.plantsDead || 0,
      totalGameTime: gameState.totalGameTime || 0,
    },
  };

  // Comprimir JSON para ahorrar memoria
  const compressed = JSON.stringify(sessionData);
  const key = `cannaval_session_${sessionData.id}`;
  
  try {
    localStorage.setItem(key, compressed);
    // Guardar índice de sesiones
    updateSessionIndex(sessionData.id);
    return sessionData;
  } catch (e) {
    console.error('Error guardando sesión:', e);
    throw new Error('No hay espacio en localStorage');
  }
}

/**
 * Carga una sesión guardada
 */
export function loadSession(sessionId: string): SessionData | null {
  const key = `cannaval_session_${sessionId}`;
  const data = localStorage.getItem(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SessionData;
  } catch (e) {
    console.error('Error cargando sesión:', e);
    return null;
  }
}

/**
 * Lista todas las sesiones guardadas
 */
export function listSessions(): string[] {
  const indexKey = 'cannaval_session_index';
  const index = localStorage.getItem(indexKey);
  
  if (!index) return [];
  
  try {
    return JSON.parse(index) as string[];
  } catch (e) {
    return [];
  }
}

/**
 * Actualiza el índice de sesiones
 */
function updateSessionIndex(sessionId: string): void {
  const indexKey = 'cannaval_session_index';
  const sessions = listSessions();
  
  if (!sessions.includes(sessionId)) {
    sessions.push(sessionId);
    // Mantener solo las últimas 10 sesiones para ahorrar memoria
    if (sessions.length > 10) {
      const oldSessionId = sessions.shift();
      if (oldSessionId) {
        localStorage.removeItem(`cannaval_session_${oldSessionId}`);
      }
    }
    localStorage.setItem(indexKey, JSON.stringify(sessions));
  }
}

/**
 * Agrega un log a la sesión actual
 */
export function addSessionLog(action: string, plantId?: number, details?: Record<string, any>): SessionLog {
  const log: SessionLog = {
    timestamp: Date.now(),
    action,
    plantId,
    details,
  };
  
  return log;
}

/**
 * Exporta una sesión como JSON descargable
 */
export function exportSession(sessionId: string): string | null {
  const session = loadSession(sessionId);
  if (!session) return null;
  
  return JSON.stringify(session, null, 2);
}

/**
 * Importa una sesión desde JSON
 */
export function importSession(jsonData: string): SessionData | null {
  try {
    const session = JSON.parse(jsonData) as SessionData;
    // Generar nuevo ID para la sesión importada
    session.id = generateSessionId();
    session.timestamp = Date.now();
    
    const key = `cannaval_session_${session.id}`;
    localStorage.setItem(key, JSON.stringify(session));
    updateSessionIndex(session.id);
    
    return session;
  } catch (e) {
    console.error('Error importando sesión:', e);
    return null;
  }
}

/**
 * Elimina una sesión guardada
 */
export function deleteSession(sessionId: string): boolean {
  const key = `cannaval_session_${sessionId}`;
  
  try {
    localStorage.removeItem(key);
    
    // Actualizar índice
    const indexKey = 'cannaval_session_index';
    const sessions = listSessions().filter(id => id !== sessionId);
    localStorage.setItem(indexKey, JSON.stringify(sessions));
    
    return true;
  } catch (e) {
    console.error('Error eliminando sesión:', e);
    return false;
  }
}

/**
 * Obtiene estadísticas de almacenamiento
 */
export function getStorageStats(): { used: number; available: number; percentage: number } {
  let used = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('cannaval_')) {
      used += localStorage.getItem(key)?.length || 0;
    }
  }
  
  // Aproximadamente 5-10MB disponibles en localStorage
  const available = 5 * 1024 * 1024; // 5MB
  const percentage = (used / available) * 100;
  
  return { used, available, percentage };
}
