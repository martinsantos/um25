#!/bin/bash

# Buscar archivos de Astro en el servidor
echo "Buscando archivos de Astro en el servidor..."
ssh root@23.105.176.45 "find /root -name '*.astro' | grep -i antecedentes"

# Buscar la estructura de directorios
echo "Estructura de directorios en /root:"
ssh root@23.105.176.45 "ls -la /root"

# Buscar el directorio principal del proyecto
echo "Buscando el directorio principal del proyecto:"
ssh root@23.105.176.45 "find /root -name 'package.json' -o -name 'astro.config.mjs'"

# Verificar el contenido del directorio um25
echo "Contenido del directorio um25:"
ssh root@23.105.176.45 "ls -la /root/um25"

# Verificar si hay un directorio dist
echo "Verificando si existe el directorio dist:"
ssh root@23.105.176.45 "ls -la /root/um25/dist"

# Verificar el contenido del archivo .env
echo "Contenido del archivo .env:"
ssh root@23.105.176.45 "cat /root/um25/.env | grep -v PASSWORD"
