from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess, os, time, platform

app = FastAPI(title="UMBot Emergency Backend", version="1.0")

# Permitir peticiones del dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_time = time.time()

@app.get("/api/uptime")
async def uptime():
    """Devuelve uptime del backend y del sistema"""
    try:
        sys_uptime = subprocess.check_output(["uptime", "-p"], text=True).strip()
    except Exception:
        sys_uptime = "unknown"
    return {
        "app_seconds": int(time.time() - start_time),
        "system": sys_uptime
    }

@app.get("/api/services")
async def services():
    """Devuelve lista de contenedores Docker"""
    try:
        output = subprocess.check_output(["docker", "ps", "--format", "{{.Names}}|{{.Status}}|{{.Ports}}"], text=True)
        services = []
        for line in output.splitlines():
            name, status, ports = line.split("|", 2)
            services.append({"name": name, "status": status, "ports": ports})
        return services
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/exec")
async def exec_cmd(cmd: str):
    """Ejecuta comando seguro (whitelist)"""
    allowed = {
        "docker ps": ["docker", "ps"],
        "docker stats": ["docker", "stats", "--no-stream"],
        "df -h": ["df", "-h"],
        "free -h": ["free", "-h"] if platform.system() != "Darwin" else ["vm_stat"],
        "uptime": ["uptime"],
        "netstat -tlpn": ["netstat", "-tlpn"]
    }
    if cmd not in allowed:
        raise HTTPException(status_code=400, detail="Comando no permitido")
    try:
        output = subprocess.check_output(allowed[cmd], text=True)
        return {"output": output}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start-all")
async def start_all():
    """Ejecuta protocolo de arranque: docker-compose restart"""
    try:
        output = subprocess.check_output(["docker-compose", "-f", "/root/fumbling-field/docker-compose.monitoring.yml", "restart"], text=True)
        return {"output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 