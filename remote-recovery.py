#!/usr/bin/env python3

"""
🚨 SCRIPT DE RECUPERACIÓN REMOTA
UMBot - Fumbling Field
Conexión SSH via Python para recuperar servicios
"""

import paramiko
import time
import sys

def log_info(msg):
    print(f"🔍 [INFO] {msg}")

def log_success(msg):
    print(f"✅ [SUCCESS] {msg}")

def log_error(msg):
    print(f"❌ [ERROR] {msg}")

def log_warning(msg):
    print(f"⚠️ [WARNING] {msg}")

def execute_command(ssh, command, timeout=30):
    """Ejecuta un comando SSH y retorna el resultado"""
    try:
        log_info(f"Ejecutando: {command}")
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        
        # Leer output
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        exit_code = stdout.channel.recv_exit_status()
        
        if output:
            print(f"Output: {output}")
        if error:
            print(f"Error: {error}")
            
        return exit_code == 0, output, error
    except Exception as e:
        log_error(f"Error ejecutando comando: {e}")
        return False, "", str(e)

def main():
    # Configuración de conexión
    hostname = "23.105.176.45"
    username = "root"
    password = "gsiB%s@0yD"
    
    log_info("🚨 INICIANDO RECUPERACIÓN REMOTA DE EMERGENCIA")
    log_info(f"Conectando a {hostname}...")
    
    # Crear cliente SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar
        ssh.connect(hostname, username=username, password=password, timeout=10)
        log_success("Conexión SSH establecida")
        
        # PASO 1: Verificar estado actual
        log_info("PASO 1: Verificando estado actual...")
        success, output, error = execute_command(ssh, "docker ps")
        if not success:
            log_warning("Docker no responde, intentando reiniciar...")
            execute_command(ssh, "systemctl restart docker")
            time.sleep(5)
        
        # PASO 2: Ir al directorio del proyecto
        log_info("PASO 2: Navegando al directorio del proyecto...")
        execute_command(ssh, "cd /root/fumbling-field && pwd")
        
        # PASO 3: Verificar docker-compose
        log_info("PASO 3: Verificando docker-compose...")
        execute_command(ssh, "cd /root/fumbling-field && docker-compose ps")
        
        # PASO 4: Intentar levantar servicios
        log_info("PASO 4: Levantando servicios...")
        success, output, error = execute_command(ssh, "cd /root/fumbling-field && docker-compose up -d", timeout=60)
        
        if success:
            log_success("Docker-compose ejecutado exitosamente")
        else:
            log_warning("Error en docker-compose, intentando limpieza...")
            execute_command(ssh, "cd /root/fumbling-field && docker-compose down")
            time.sleep(5)
            execute_command(ssh, "cd /root/fumbling-field && docker-compose up -d", timeout=60)
        
        # PASO 5: Verificar nginx
        log_info("PASO 5: Verificando nginx...")
        execute_command(ssh, "systemctl status nginx")
        execute_command(ssh, "systemctl restart nginx")
        
        # PASO 6: Verificar estado final
        log_info("PASO 6: Verificando estado final...")
        execute_command(ssh, "docker ps")
        execute_command(ssh, "curl -I http://localhost/")
        
        # PASO 7: Mostrar puertos
        log_info("PASO 7: Verificando puertos...")
        execute_command(ssh, "netstat -tlnp | grep -E ':(80|443|8080|8055)'")
        
        log_success("🎉 Recuperación completada")
        
    except paramiko.AuthenticationException:
        log_error("Error de autenticación SSH")
    except paramiko.SSHException as e:
        log_error(f"Error SSH: {e}")
    except Exception as e:
        log_error(f"Error general: {e}")
    finally:
        ssh.close()
        log_info("Conexión SSH cerrada")

if __name__ == "__main__":
    try:
        import paramiko
    except ImportError:
        log_error("Paramiko no está instalado")
        log_info("Instala con: pip install paramiko")
        sys.exit(1)
    
    main() 