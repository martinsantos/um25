#!/bin/bash
export SSHPASS='gsiB%s@0yD'
echo "Checking remote dist size..."
sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "du -sh /root/fumbling-field/dist"
