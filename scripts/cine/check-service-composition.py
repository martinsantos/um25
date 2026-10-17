import importlib.util, math, json, sys
spec=importlib.util.spec_from_file_location('movies',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def verts(s):
    groups={None:[]}
    for b in s.boxes:
        groups.setdefault(b['group'],[]).extend((b['x']+dx*b['w']/2,b['y']+dy*b['d']/2,b['z']+dz*b['h']) for dx in [-1,1] for dy in [-1,1] for dz in [0,1])
    for c in s.cylinders:
        for h,r in [(0,c['r']),(c['h'],c['top'])]:
            for j in range(48):
                u,v=r*math.cos(j*math.tau/48),r*math.sin(j*math.tau/48)
                groups[None].append((c['x']+u,c['y']+v,c['z']+h) if c['axis']=='z' else (c['x']+u,c['y']-h,c['z']+v) if c['axis']=='y' else (c['x']+h,c['y']+u,c['z']+v))
    for line in s.lines:groups[None].extend(line['pts'])
    return groups
out=[]
for code in (sys.argv[2].split(',') if len(sys.argv)>2 else m.SERVICES):
    s=m.Studio(code);m.BUILDERS[code](s);groups=verts(s);rows=[]
    for f in range(m.FRAMES):
        size,angle,pan,lift=m.pose(f);size*=1.025
        sin,cos=math.sin(angle),math.cos(angle);sn=22/math.hypot(22,24);cs=24/math.hypot(22,24)
        points=groups[None][:]
        for door in s.doors:
            a=-math.radians(68)*math.sin(math.pi*f/(m.FRAMES-1))**2
            px,py,pz=door['pivot']
            points.extend((px+x*math.cos(a)-y*math.sin(a),py+x*math.sin(a)+y*math.cos(a),pz+z) for x,y,z in groups[door['name']])
        xs=[];ys=[]
        for x,y,z in points:
            x-=pan;y-=1.3;z-=1.05+lift
            xs.append(.6+(-sin*x+cos*y)/size)
            ys.append(.5+(-cos*sn*x-sin*sn*y+cs*z)*16/9/size-.004*16/9)
        rows.append([min(xs),min(ys),max(xs),max(ys)])
    overall=[min(r[0] for r in rows),min(r[1] for r in rows),max(r[2] for r in rows),max(r[3] for r in rows)]
    assert overall[0]>.215 and overall[1]>.07 and overall[2]<.98 and overall[3]<.93,(code,overall)
    out.append({'code':code,'framesChecked':m.FRAMES,'overall':overall})
print(json.dumps(out,indent=2))
