import { all } from 'redux-saga/effects';
import financialPositionsSagas from './FinancialPositions/sagas';
import dfspSagas from './DFSPs/sagas';

function* rootSaga(): Generator {
  yield all([dfspSagas(), financialPositionsSagas()]);
}

export default rootSaga;
