#!/bin/bash
sed -i 's#__CENTRAL_LEDGER_ENDPOINT__#'"$CENTRAL_LEDGER_ENDPOINT"'#g' /usr/share/nginx/html/runtime-env.js

exec "$@"
