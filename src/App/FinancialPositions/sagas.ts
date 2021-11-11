import { strict as assert } from 'assert';
import { PayloadAction } from '@reduxjs/toolkit';
import { all, call, put, select, takeLatest, takeEvery } from 'redux-saga/effects';
import api, { centralLedgerURL } from 'utils/api';
import { v4 as uuid } from 'uuid';
import retry from 'async-retry';
import axios from 'axios';
import { getDfsps } from '../DFSPs/selectors';
import { DFSP } from '../DFSPs/types';
import { Currency } from '../types';

import {
  REQUEST_FINANCIAL_POSITIONS,
  SUBMIT_FINANCIAL_POSITION_UPDATE_MODAL,
  SUBMIT_FINANCIAL_POSITION_UPDATE_CONFIRM_MODAL,
  TOGGLE_CURRENCY_ACTIVE,
  Account,
  Limit,
  FinancialPosition,
  FinancialPositionsUpdateAction,
} from './types';
import {
  closeFinancialPositionUpdateModal,
  setFinancialPositions,
  setFinancialPositionsError,
  closeFinancialPositionUpdateConfirmModal,
  updateFinancialPositionNDCAfterConfirmModal,
} from './actions';
import {
  getFinancialPositions,
  getSelectedFinancialPosition,
  getFinancialPositionUpdateAmount,
  getSelectedFinancialPositionUpdateAction,
} from './selectors';

// Adding and withdrawing funds in the central ledger are not truly synchronous.
// So we poll the account endpoint a bit until there is a change before reloading
// the UI.
async function pollAccountFundsUpdate(oldAccountFunds: string, dfspName: string) {
  return retry(
    async (bail) => {
      const accounts = await axios.get(`${centralLedgerURL}/participants/${dfspName}/accounts`);
      if (accounts.status !== 200) {
        bail(new Error('Unable to fetch DFSP data'));
        return;
      }

      const account = accounts.data.filter(
        (acc: { ledgerAccountType: string }) => acc.ledgerAccountType === 'SETTLEMENT',
      )[0];

      if (account.value !== oldAccountFunds) {
        // eslint-disable-next-line consistent-return
        return true;
      }
    },
    {
      retries: 5,
    },
  );
}

function* checkAccountFundUpdate(oldAccountFunds: string, dfspName: string) {
  yield call(pollAccountFundsUpdate, oldAccountFunds, dfspName);
}

function* fetchDFSPPositions(dfsp: DFSP) {
  // @ts-ignore
  const accounts = yield call(api.participantAccounts.read, {
    participantName: dfsp.name,
  });

  assert.equal(accounts.status, 200, `Failed to retrieve accounts for ${dfsp.name}`);
  // @ts-ignore
  const limits = yield call(api.participantLimits.read, { participantName: dfsp.name });
  assert.equal(limits.status, 200, `Failed to retrieve limits for ${dfsp.name}`);

  const currencies = new Set<Currency>(accounts.data.map((a: Account) => a.currency));

  return [...currencies].map((c) => ({
    dfsp,
    currency: c,
    ndc: limits.data.find((l: Limit) => l.currency === c)?.limit.value,
    settlementAccount: accounts.data.find(
      (a: Account) => a.currency === c && a.ledgerAccountType === 'SETTLEMENT',
    ),
    positionAccount: accounts.data.find(
      (a: Account) => a.currency === c && a.ledgerAccountType === 'POSITION',
    ),
  }));
}

function* updateFinancialPositions(newPositions: FinancialPosition[]) {
  const currentPositions: FinancialPosition[] = yield select(getFinancialPositions);
  const updatedPositions = currentPositions.map(
    (oldPos) =>
      newPositions.find(
        (newPos) => newPos.currency === oldPos.currency && newPos.dfsp.id === oldPos.dfsp.id,
      ) || oldPos,
  );
  yield put(setFinancialPositions(updatedPositions));
}

function* reloadFinancialPositionsParticipant(dfsp: DFSP) {
  // @ts-ignore
  const newDfspPositions = yield call(fetchDFSPPositions, dfsp);
  yield call(updateFinancialPositions, newDfspPositions);
}

function* fetchFinancialPositions() {
  try {
    // @ts-ignore
    const dfsps = (yield select(getDfsps)).filter((dfsp: DFSP) => dfsp.name !== 'Hub');
    // @ts-ignore
    const data = yield all(dfsps.map((dfsp: DFSP) => call(fetchDFSPPositions, dfsp)));
    yield put(setFinancialPositions(data.flat()));
  } catch (e) {
    yield put(setFinancialPositionsError(e.message));
  }
}

function* toggleCurrencyActive(action: PayloadAction<FinancialPosition>) {
  yield call(updateFinancialPositions, [
    {
      ...action.payload,
      positionAccount: {
        ...action.payload.positionAccount,
        updateInProgress: true,
      },
    },
  ]);
  const { positionAccount, dfsp } = action.payload;
  const newIsActive = !positionAccount.isActive;
  const description = newIsActive ? 'disable' : 'enable';
  // @ts-ignore
  const result = yield call(api.participantAccount.update, {
    participantName: dfsp.name,
    accountId: positionAccount.id,
    body: {
      isActive: newIsActive,
    },
  });
  assert.equal(result.status, 200, `Failed to ${description} account ${positionAccount.id}`);
  yield call(reloadFinancialPositionsParticipant, dfsp);
}

function* updateFinancialPositionsParticipant() {
  // @ts-ignore
  const updateAmount = yield select(getFinancialPositionUpdateAmount);
  assert(updateAmount !== 0, 'Value 0 is not valid for Amount');

  const position: FinancialPosition = yield select(getSelectedFinancialPosition);
  // @ts-ignore
  const accounts = yield call(api.accounts.read, { dfspName: position.dfsp.name });
  assert(accounts.status === 200, 'Unable to fetch DFSP data');

  const account = accounts.data.filter(
    (acc: { ledgerAccountType: string }) => acc.ledgerAccountType === 'SETTLEMENT',
  )[0];

  // @ts-ignore
  const updateAction = yield select(getSelectedFinancialPositionUpdateAction);

  switch (updateAction) {
    case FinancialPositionsUpdateAction.ChangeNetDebitCap: {
      // @ts-ignore
      const limits = yield call(api.participantLimits.read, {
        participantName: position.dfsp.name,
      });
      const ndc = limits.data.find(
        (l: Limit) => l.currency === position.currency && l.limit.type === 'NET_DEBIT_CAP',
      );
      if (ndc === undefined) {
        throw new Error(
          `Couldn't find ${position.currency} net debit cap for participant ${position.dfsp.name}`,
        );
      }

      const newNDC = {
        currency: account.currency,
        limit: { ...ndc.limit, value: updateAmount },
      };

      const args = {
        body: newNDC,
        participantName: position.dfsp.name,
      };
      // @ts-ignore
      const response = yield call(api.participantLimits.update, args);
      assert(response.status !== 401, 'Unable to update Net Debit Cap - user not authorized');
      assert(response.status === 200, 'Unable to update Net Debit Cap');
      break;
    }
    case FinancialPositionsUpdateAction.AddFunds: {
      const args = {
        body: {
          transferId: uuid(),
          externalReference: 'string', // TODO: something useful
          action: 'recordFundsIn',
          reason: 'Admin portal funds in request',
          amount: {
            amount: updateAmount,
            currency: account.currency,
          },
        },
        dfspName: position.dfsp.name,
        accountId: account.id,
      };
      // @ts-ignore
      const response = yield call(api.fundsIn.create, args);

      assert(response.status === 202, 'Unable to update Financial Position Balance');
      yield call(checkAccountFundUpdate, account.value, position.dfsp.name);
      break;
    }
    case FinancialPositionsUpdateAction.WithdrawFunds: {
      const args = {
        body: {
          transferId: uuid(),
          externalReference: 'string', // TODO: something useful
          action: 'recordFundsOutPrepareReserve',
          reason: 'Admin portal funds out request',
          amount: {
            amount: updateAmount,
            currency: account.currency,
          },
        },
        dfspName: position.dfsp.name,
        accountId: account.id,
      };
      // The settlement account value will have a negative sign for a credit balance, and a
      // positive sign for a debit balance. The "updateAmount" is a withdrawal amount, and will
      // have a positive sign for a withdrawal. Therefore, if the sum of the two is greater than
      // zero, that would result in a debit balance, and we prevent it. It is also prevented in the
      // backend, but the backend processes a transfer through a sequence of states before
      // rejecting, making failure tricky to track. This will probably be required in future but in
      // the short term we simply reject the request here.
      assert(
        position.settlementAccount.value + Number(updateAmount) <= 0,
        'Balance insufficient for this operation',
      );
      // @ts-ignore
      const response = yield call(api.fundsOut.create, args);
      assert(response.status === 202, 'Unable to update Financial Position Balance');
      yield call(checkAccountFundUpdate, account.value, position.dfsp.name);
      break;
    }
    default: {
      throw new Error('Action not expected on update Financial Position Balance');
    }
  }
  yield call(reloadFinancialPositionsParticipant, position.dfsp);
}

function* submitFinancialPositionsUpdateParticipant() {
  try {
    yield call(updateFinancialPositionsParticipant);
  } catch (e) {
    yield put(setFinancialPositionsError(e.message));
  } finally {
    yield put(updateFinancialPositionNDCAfterConfirmModal()); // set action on Update Participant modal to update NDC
    yield put(closeFinancialPositionUpdateModal());
  }
}

function* submitFinancialPositionsUpdateParticipantAndShowUpdateNDC() {
  try {
    yield call(updateFinancialPositionsParticipant);
  } catch (e) {
    yield put(setFinancialPositionsError(e.message));
  } finally {
    yield put(updateFinancialPositionNDCAfterConfirmModal()); // set action on Update Participant modal to update NDC
    yield put(closeFinancialPositionUpdateConfirmModal()); // back to Update Participant modal
  }
}

export function* FetchFinancialPositionsSaga(): Generator {
  yield takeLatest([REQUEST_FINANCIAL_POSITIONS], fetchFinancialPositions);
}

export function* SubmitFinancialPositionsUpdateParticipantSaga(): Generator {
  yield takeLatest(
    [SUBMIT_FINANCIAL_POSITION_UPDATE_MODAL],
    submitFinancialPositionsUpdateParticipant,
  );
}

export function* SubmitFinancialPositionsUpdateParticipantAndShowUpdateNDCSaga(): Generator {
  yield takeLatest(
    [SUBMIT_FINANCIAL_POSITION_UPDATE_CONFIRM_MODAL],
    submitFinancialPositionsUpdateParticipantAndShowUpdateNDC,
  );
}

export function* ToggleCurrencyActiveSaga(): Generator {
  yield takeEvery([TOGGLE_CURRENCY_ACTIVE], toggleCurrencyActive);
}

export default function* rootSaga(): Generator {
  yield all([
    FetchFinancialPositionsSaga(),
    SubmitFinancialPositionsUpdateParticipantSaga(),
    SubmitFinancialPositionsUpdateParticipantAndShowUpdateNDCSaga(),
    ToggleCurrencyActiveSaga(),
  ]);
}
