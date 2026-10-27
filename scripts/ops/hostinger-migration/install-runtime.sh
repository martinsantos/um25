#!/usr/bin/env bash
# Runs ONLY on the isolated Hostinger target. Does not activate copied services.
set -euo pipefail
umask 077
test "$(hostname)" = srv2101069.hstgr.cloud
stage=/srv/umsa-migration
test ! -L "$stage"
test "$(cat "$stage/.target")" = 179.198.115.115
test -s "$stage/source/etc/passwd"
source /etc/os-release
test "$ID" = almalinux
test "${VERSION_ID%%.*}" = 9
python3 "$stage/tooling/runtime-accounts.py"

dnf -y install dnf-plugins-core epel-release
dnf config-manager --set-enabled crb
dnf -y install https://rpms.remirepo.net/enterprise/remi-release-9.rpm
dnf -y module enable php:remi-8.2
dnf -y install nginx redis memcached postfix opendkim opendkim-tools cronie \
  openssl sqlite policycoreutils-python-utils \
  php-cli php-common php-fpm php-gd php-mbstring php-mysqlnd php-opcache php-pdo \
  php-sodium php-xml php-pecl-zip php-intl \
  php74-php-cli php74-php-fpm php74-php-gd php74-php-mbstring php74-php-mysqlnd php74-php-xml

# Preserve the source database major/minor release through the official archive.
install -m 0644 "$stage/source/etc/pki/rpm-gpg/MariaDB-Server-GPG-KEY" /etc/pki/rpm-gpg/MariaDB-Server-GPG-KEY
cat > /etc/yum.repos.d/umsa-mariadb.repo <<'REPO'
[umsa-mariadb]
name=MariaDB 10.11.15 migration parity
baseurl=https://archive.mariadb.org/mariadb-10.11.15/yum/rhel/9/x86_64/
gpgkey=file:///etc/pki/rpm-gpg/MariaDB-Server-GPG-KEY
gpgcheck=1
enabled=1
module_hotfixes=1
REPO
dnf -y install MariaDB-server-10.11.15 MariaDB-client-10.11.15 MariaDB-backup-10.11.15

curl --fail --silent --show-error --location https://download.docker.com/linux/rhel/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo
dnf -y install docker-ce-29.1.3 docker-ce-cli-29.1.3 containerd.io-2.2.1 \
  docker-buildx-plugin-0.30.1 docker-compose-plugin-5.0.1

# Node and PM2 are copied from the audited source, avoiding an application upgrade.
test -x "$stage/source/usr/bin/node"
install -m 0755 "$stage/source/usr/bin/node" /usr/bin/node
install -d /usr/lib/node_modules
rsync -aH "$stage/source/usr/lib/node_modules/" /usr/lib/node_modules/
for name in npm npx pm2 pm2-dev pm2-docker pm2-runtime; do
  test -L "$stage/source/usr/bin/$name"
  cp -a "$stage/source/usr/bin/$name" "/usr/bin/$name"
done
test "$(node --version)" = v20.19.6
node -p "require('/usr/lib/node_modules/pm2/package.json').version"
rpm -q nginx MariaDB-server docker-ce redis php-fpm php74-php-fpm
printf 'Runtimes installed. Application activation, database imports and public listeners remain separate.\n'
