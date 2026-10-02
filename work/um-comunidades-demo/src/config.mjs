// Build-time values keep the package independent from any hosting provider.
export const BASE_PATH=typeof __APP_BASE__!=='undefined'?__APP_BASE__:'/';
export const ENABLE_SW=typeof __ENABLE_SW__!=='undefined'?__ENABLE_SW__:false;
export const STORAGE_MODE=typeof __STORAGE_MODE__!=='undefined'?__STORAGE_MODE__:'session';
export const RETURN_URL=typeof __RETURN_URL__!=='undefined'?__RETURN_URL__:'/software/gestion-de-comunidades-profesionales';
export const storageKey='um-comunidades-demo:v1'+(BASE_PATH==='/'?'':':'+BASE_PATH);
export const assetUrl=file=>new URL(BASE_PATH+file,globalThis.location?.origin||'http://localhost').href;
export const storage=()=>STORAGE_MODE==='local'?globalThis.localStorage:globalThis.sessionStorage;
