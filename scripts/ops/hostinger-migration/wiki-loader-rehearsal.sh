#!/bin/bash
set -euo pipefail
# The archive is verified before this script runs. Everything here is disposable.
test "$(sha256sum /package.tar.gz | cut -d' ' -f1)" = 4f28a812694c95bd6778d1ac322ea80d3bbfedbda69c4562b75c8d450cc8d3f0
mkdir /tmp/wiki /tmp/wiki-db
tar -xzf /package.tar.gz --strip-components=1 -C /tmp/wiki
cd /tmp/wiki
cp /candidate/load.php load.php
cp /candidate/languages/LanguageConverter.php languages/LanguageConverter.php
cp /candidate/includes/json/FormatJson.php includes/json/FormatJson.php
php -l load.php
php -l languages/LanguageConverter.php
php -l includes/json/FormatJson.php
php maintenance/install.php --dbtype sqlite --dbpath /tmp/wiki-db --dbname wiki --lang es --server http://127.0.0.1:8080 --scriptpath '' --pass FixtureOnlyPassword123 'CI Wiki' Admin > /tmp/install.log 2>&1 || { cat /tmp/install.log; exit 1; }
printf '%s\n' RESOURCELOADER_FIXTURE_CONTENT | php maintenance/edit.php --user Admin Fixture > /tmp/edit.log 2>&1 || { cat /tmp/edit.log; exit 1; }
cat >> LocalSettings.php <<'PHP'
wfLoadSkin( 'MonoBook' );
$wgDefaultSkin = 'monobook';
$wgLanguageCode = 'es';
$wgShowExceptionDetails = true;
$wgReadOnly = 'Disposable CI fixture';
$wgMainCacheType = CACHE_NONE;
$wgMessageCacheType = CACHE_NONE;
$wgParserCacheType = CACHE_NONE;
$wgSessionCacheType = CACHE_NONE;
$wgJobRunRate = 0;
$wgUseFileCache = false;
$wgLocalisationCacheConf['store'] = 'file';
$wgLocalisationCacheConf['storeDirectory'] = '/tmp/l10n-cache';
$wgLocalisationCacheConf['manualRecache'] = false;
PHP
php -S 127.0.0.1:8080 -t /tmp/wiki > /tmp/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid"' EXIT
sleep 1
php /tests/wiki-loader-smoke.php || { cat /tmp/server.log; exit 1; }
