## External API

`reporting-hub-bop-positions-ui` is reliant on the `central-ledger` mojaloop service.
When running locally, you can use the environment variable
`CENTRAL_LEDGER_ENDPOINT` in `.env` to specify the location of the api service.

If these services are hosted on a different domain and have CORS protection,
then you can edit `devServer.proxy` `target` to point to these services instead.

NOTE: These endpoints are a stopgap. In the future these environment variables
      will be replaced for a variable that points to an operational API specifically
      for the Positions microfrontend instead of calling Mojaloop services directly.

For more information's on React variables check [here](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables).

## Port forwarding
If you want connect to the live services deployed in K8S, you can port forward the services using the following command.
```
kubectl port-forward -n mojaloop service/moja-centralledger-service 3001:80 &
```