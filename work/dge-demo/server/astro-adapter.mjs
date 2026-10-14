import { Readable } from 'node:stream';
import { createDemoHandler } from './auth.mjs';

// Reuses the exact server-side authentication checks; opens no ports and creates no daemon.
export async function createDemoResponseHandler(options) {
  const handler=await createDemoHandler(options);
  return async (request,{clientAddress='unknown'}={})=>{
    const incoming=request.body ? Readable.fromWeb(request.body) : Readable.from([]);
    const url=new URL(request.url);
    Object.assign(incoming,{url:url.pathname+url.search,method:request.method,headers:Object.fromEntries(request.headers),socket:{remoteAddress:clientAddress}});
    return new Promise((resolve,reject)=>{
      let status=200,headers={};
      const outgoing={
        writeHead(code,values){status=code;headers=values;},
        end(body=''){resolve(new Response(request.method==='HEAD'?null:body,{status,headers}));},
      };
      handler(incoming,outgoing).catch(reject);
    });
  };
}
