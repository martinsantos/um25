import { createServer } from 'node:http';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const scrypt = promisify(scryptCallback);
const here = dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.png':'image/png', '.jpg':'image/jpeg', '.pdf':'application/pdf', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };

export async function createDemoHandler({ credentials, origin, clientDir=resolve(here,'../dist/client'), loginDir=here, base='/ofertas/dge/', secure=true, clock=Date.now, limit=10 }) {
  if (!origin || new URL(origin).origin !== origin || (secure && !origin.startsWith('https://')) || base !== '/ofertas/dge/') throw new Error('Invalid demo origin/base');
  if (!credentials?.username || !/^[a-zA-Z0-9_-]{3,64}$/.test(credentials.username) || !/^[0-9a-f]{32}$/.test(credentials.salt) || !/^[0-9a-f]{128}$/.test(credentials.hash)) throw new Error('Invalid demo credential configuration');
  const root = await realpath(clientDir);
  const sessions=new Map(), attempts=new Map();
  let activeChecks=0;
  const cookieName=secure?'__Secure-um_dge_demo':'um_dge_demo';
  const lifetime=8*60*60*1000, rateWindow=15*60*1000;
  const login = await readFile(resolve(loginDir,'login.html'),'utf8');
  const baseHeaders = { 'Cache-Control':'private, no-store, max-age=0', 'Pragma':'no-cache', 'X-Robots-Tag':'noindex, nofollow, noarchive', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" };
  // Same-origin preserves the Origin header on native form POSTs without leaking referrers to other sites.
  baseHeaders['Referrer-Policy']='same-origin';
  function respond(res, status, body='', extra={}) { res.writeHead(status,{...baseHeaders,...extra}); res.end(body); }
  function redirect(res, path, extra={}) { respond(res,303,'',{ Location:base+path,...extra }); }
  function renderLogin(res,error='',status=200,extra={},next='') { respond(res,status,login.replace('{{ERROR}}',error).replace('{{NEXT}}',next==='manual'?'manual':''),{'Content-Type':'text/html; charset=utf-8',...extra}); }
  function cookie(token,age) { return `${cookieName}=${token}; Path=${base}; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`; }
  function sweep() { const now=clock(); for(const [key,expires] of sessions) if(expires<=now) sessions.delete(key); for(const [key,item] of attempts) if(item.until<=now) attempts.delete(key); }
  async function file(res,path,head=false) {
    try {
      const actual=await realpath(path);
      if (!(actual.startsWith(root+sep) || actual===resolve(loginDir,'login.css'))) return respond(res,404,'No encontrado');
      if (!(await stat(actual)).isFile() || !mime[extname(actual)]) return respond(res,404,'No encontrado');
      const data=await readFile(actual); respond(res,200,head?'':data,{'Content-Type':mime[extname(actual)]});
    } catch { respond(res,404,'No encontrado'); }
  }
  return async (req,res)=>{
    try {
      sweep();
      let path; try { path=decodeURIComponent(new URL(req.url,origin).pathname); } catch { return respond(res,400,'Solicitud inválida'); }
      if (path===base.slice(0,-1)) return redirect(res,'');
      if (!path.startsWith(base)) return respond(res,404,'No encontrado');
      const relative=path.slice(base.length);
      if (relative.includes('..') || relative.includes('\\') || relative.includes('\0') || relative.split('/').some(part=>part.startsWith('.'))) return respond(res,400,'Ruta inválida');
      if (req.method==='POST' && req.headers.origin!==origin) return respond(res,403,'Origen no permitido');
      const rawCookie=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(cookieName+'='));
      const token=rawCookie?.slice(cookieName.length+1);
      const authenticated=token && sessions.has(token);
      if (relative==='logout' && req.method==='POST') {
        if(token) sessions.delete(token);
        return redirect(res,'login',{'Set-Cookie':cookie('',0)});
      }
      if (relative==='login' && req.method==='POST') {
        if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers['content-type']||'')) return respond(res,415,'Formato no permitido');
        const address=req.socket.remoteAddress || 'unknown';
        const trustedLoopback=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address);
        const ip=trustedLoopback && req.headers['x-real-ip'] ? String(req.headers['x-real-ip']).slice(0,128) : address;
        if(attempts.size>=1000 && !attempts.has(ip)) return renderLogin(res,'Demasiados intentos. Reintentar más tarde.',429,{'Retry-After':'900'});
        const entry=attempts.get(ip)||{ count:0, until:clock()+rateWindow };
        if(entry.count>=limit) return renderLogin(res,'Demasiados intentos. Reintentar dentro de 15 minutos.',429,{'Retry-After':'900'});
        entry.count++; attempts.set(ip,entry);
        let body=''; for await (const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>4096) return respond(res,413,'Solicitud demasiado grande'); }
        const form=new URLSearchParams(body); const username=form.get('username')||'', password=form.get('password')||'';
        if(username.length>64 || password.length>128 || !password) return renderLogin(res,'Usuario o clave incorrectos.',401);
        if(activeChecks>=4) return renderLogin(res,'Acceso ocupado. Reintentar dentro de unos segundos.',503,{'Retry-After':'5'});
        let hash; activeChecks++;
        try { hash=await scrypt(password,credentials.salt,64,{N:16384,r:8,p:1}); } finally { activeChecks--; }
        const valid=timingSafeEqual(hash,Buffer.from(credentials.hash,'hex')) && username===credentials.username;
        if(!valid) return renderLogin(res,'Usuario o clave incorrectos.',401,{},form.get('next'));
        if(sessions.size>=1000) return renderLogin(res,'No hay sesiones disponibles. Reintentar más tarde.',503);
        if(token) sessions.delete(token);
        const fresh=randomBytes(32).toString('hex'); sessions.set(fresh,clock()+lifetime);
        return redirect(res,form.get('next')==='manual'?'manual':'',{'Set-Cookie':cookie(fresh,lifetime/1000)});
      }
      if(!['GET','HEAD'].includes(req.method)) return respond(res,405,'Método no permitido',{'Allow':'GET, HEAD'});
      if(relative.startsWith('login-assets/')) {
        const asset=relative.slice('login-assets/'.length);
        if(asset==='login.css') return file(res,resolve(loginDir,'login.css'),req.method==='HEAD');
        if(!['um-logo.svg','UMSans-Regular.ttf','UMSans-Bold.ttf'].includes(asset)) return respond(res,404,'No encontrado');
        return file(res,resolve(root,'assets',asset),req.method==='HEAD');
      }
      if(relative==='login') { const next=new URL(req.url,origin).searchParams.get('next'); return authenticated?redirect(res,next==='manual'?'manual':''):renderLogin(res,'',200,{},next); }
      if(!authenticated) return redirect(res,relative==='manual'||relative==='manual/'?'login?next=manual':'login');
      if(relative==='manual/') return redirect(res,'manual');
      if(!relative || relative==='index.html' || relative==='manual') return file(res,resolve(root,'index.html'),req.method==='HEAD');
      if(!relative.startsWith('assets/')) return respond(res,404,'No encontrado');
      return file(res,resolve(root,relative),req.method==='HEAD');
    } catch { respond(res,500,'No se pudo completar la solicitud.'); }
  };
}
export async function createDemoServer(options) {
  const server=createServer(await createDemoHandler(options));
  server.requestTimeout=15000; server.headersTimeout=10000; server.maxHeadersCount=40;
  return server;
}
