import { State } from '../../store/types';

export const getFinancialPositions = (state: State) => state.financialPositions.financialPositions;

export const getFinancialPositionsError = (state: State) =>
  state.financialPositions.financialPositionsError;

export const getIsFinancialPositionsPending = (state: State) =>
  state.financialPositions.isFinancialPositionsPending;

export const getSelectedFinancialPosition = (state: State) =>
  state.financialPositions.selectedFinancialPosition;

export const getFinancialPositionUpdateAmount = (state: State) =>
  state.financialPositions.financialPositionUpdateAmount;

export const getIsFinancialPositionUpdateSubmitPending = (state: State) =>
  state.financialPositions.isFinancialPositionUpdateSubmitPending;

export const getIsFinancialPositionUpdateCancelEnabled = (state: State) =>
  state.financialPositions.isFinancialPositionUpdateCancelEnabled;

export const getSelectedFinancialPositionUpdateAction = (state: State) =>
  state.financialPositions.selectedFinancialPositionUpdateAction;

export const getIsShowUpdateFinancialPositionConfirmModal = (state: State) =>
  state.financialPositions.isShowUpdateFinancialPositionConfirmModal;

export const getIsUpdateFinancialPositionNDCAfterConfirmModal = (state: State) =>
  state.financialPositions.isUpdateFinancialPositionNDCAfterConfirmModal;
