#!/bin/bash
export SSHPASS='gsiB%s@0yD'

echo "--- Checking Port 4321 ---"
sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "lsof -i :4321 -t | xargs -r ps -fp"

echo "--- Checking PM2 List ---"
sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pm2 list"

echo "--- Finding Directory for Port 4321 ---"
PID=$(sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "lsof -i :4321 -t | head -n 1")
if [ ! -z "$PID" ]; then
    sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pwdx $PID"
else
    echo "No process found on 4321"
fi
