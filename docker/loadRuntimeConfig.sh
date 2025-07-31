#! /bin/sh
if grep -q "__CENTRAL_LEDGER_ENDPOINT__" /usr/share/nginx/html/runtime-env.js; then
  sed -i 's#__CENTRAL_LEDGER_ENDPOINT__#'"$CENTRAL_LEDGER_ENDPOINT"'#g' /usr/share/nginx/html/runtime-env.js;
else
  echo "skipping replacement.";
fi

exec "$@"
