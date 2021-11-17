import { connect, ConnectedProps } from 'react-redux';
import { State, Dispatch } from 'store/types';
import { ReduxContext } from 'store';
import * as selectors from './selectors';
import * as actions from './actions';
import { FinancialPosition } from './types';

const mapStateProps = (state: State) => ({
  financialPositions: selectors.getFinancialPositions(state),
  financialPositionsError: selectors.getFinancialPositionsError(state),
  isFinancialPositionsPending: selectors.getIsFinancialPositionsPending(state),
  selectedFinancialPosition: selectors.getSelectedFinancialPosition(state),
});

const mapDispatchProps = (dispatch: Dispatch) => ({
  onMount: () => dispatch(actions.requestFinancialPositions()),
  onSelectFinancialPosition: (item: FinancialPosition) =>
    dispatch(actions.selectFinancialPosition(item)),
  onToggleCurrencyActive: (item: FinancialPosition) => dispatch(actions.toggleCurrencyActive(item)),
});

const financialPositionsConnector = connect(mapStateProps, mapDispatchProps, null, {
  context: ReduxContext,
});

export type FinancialPositionsProps = ConnectedProps<typeof financialPositionsConnector>;

export default financialPositionsConnector;
