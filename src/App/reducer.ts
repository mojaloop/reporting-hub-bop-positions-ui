import { combineReducers } from 'redux';
import { reducer as config } from './Config';
import financialPositionsReducer from './FinancialPositions/reducer';
import dfspsReducer from './DFSPs/reducer';

export const reducers = {
  config,
  financialPositions: financialPositionsReducer,
  dfsps: dfspsReducer,
};

export default combineReducers(reducers);
