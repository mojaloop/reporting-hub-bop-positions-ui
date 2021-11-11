import { State } from 'store';
import buildApi, { buildEndpointBuilder, EndpointConfig } from '@modusbox/redux-utils/lib/api';

export const [centralLedgerURL] =
  process.env.NODE_ENV === 'production'
    ? [window.positionsEnv.CENTRAL_LEDGER_ENDPOINT]
    : [process.env.CENTRAL_LEDGER_ENDPOINT || ''];

const services = {
  ledgerService: {
    baseUrl: centralLedgerURL,
  },
};

const builder = buildEndpointBuilder<State>();

const dfsps: EndpointConfig = {
  service: services.ledgerService,
  url: () => '/participants',
  withCredentials: true,
};

const participantAccounts: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { participantName }) => `/participants/${participantName}/accounts`,
  withCredentials: true,
};

const participantLimits: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { participantName }) => `/participants/${participantName}/limits`,
  withCredentials: true,
};

const participantAccount: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { participantName, accountId }: { participantName: string; accountId: string }) =>
    `/participants/${participantName}/accounts/${accountId}`,
  withCredentials: true,
};

const accounts: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { dfspName }: { dfspName: string }) => `/participants/${dfspName}/accounts`,
  withCredentials: true,
};

const netdebitcap: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { dfspName }: { dfspName: string }) => `/netdebitcap/${dfspName}`,
  withCredentials: true,
};

const fundsOut: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { dfspName, accountId }: { dfspName: string; accountId: string }) =>
    `/participants/${dfspName}/accounts/${accountId}`,
  withCredentials: true,
};

const fundsIn: EndpointConfig = {
  service: services.ledgerService,
  url: (_: State, { dfspName, accountId }: { dfspName: string; accountId: string }) =>
    `/participants/${dfspName}/accounts/${accountId}`,
  withCredentials: true,
};

export default buildApi({
  participantAccount: builder<{}>(participantAccount),
  participantAccounts: builder<{}>(participantAccounts),
  participantLimits: builder<{}>(participantLimits),
  accounts: builder<{}>(accounts),
  netdebitcap: builder<{}>(netdebitcap),
  fundsOut: builder<{}>(fundsOut),
  fundsIn: builder<{}>(fundsIn),
  dfsps: builder<{}>(dfsps),
});
