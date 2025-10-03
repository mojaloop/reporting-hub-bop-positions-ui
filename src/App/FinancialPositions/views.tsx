import React, { FC } from 'react';
import { Heading, Led, MessageBox, Spinner, DataList, Button } from 'outdated-components';
import withMount from 'hocs';
import BigNumber from 'bignumber.js';
import { FinancialPosition } from './types';
import './FinancialPositions.css';
import FinancialPositionUpdate from './FinancialPositionUpdate';
import financialPositionsConnector, { FinancialPositionsProps } from './connectors';

function formatNum(num: number | string | undefined, scale: number = 4): string {
  if (num === undefined) {
    return '-';
  }
  try {
    const v = new BigNumber(num).toFormat(scale, BigNumber.ROUND_UP, {
      prefix: '',
      decimalSeparator: '.',
      groupSeparator: ',',
      groupSize: 3,
      secondaryGroupSize: 0,
      fractionGroupSeparator: ' ',
      fractionGroupSize: 0,
      suffix: '',
    });
    return v;
  } catch {
    return '-';
  }
}

function getLedColorByPerc(perc: number): string {
  if (perc < 1) {
    return 'green';
  }
  if (perc < 30) {
    return 'blue';
  }
  return 'red';
}

interface PercProps {
  perc: number;
}

const Perc: FC<PercProps> = ({ perc }) => (
  <>
    <Led colorName={getLedColorByPerc(perc)} />
    <span>{perc}%</span>
  </>
);

const FinancialPositions: FC<FinancialPositionsProps> = ({
  financialPositions,
  financialPositionsError,
  isFinancialPositionsPending,

  selectedFinancialPosition,
  onSelectFinancialPosition,

  onToggleCurrencyActive,
}) => {
  const columns = [
    { key: 'dfsp.name', label: 'DFSP' },
    { key: 'currency', label: 'Currency' },
    { key: 'settlementAccount.value', label: 'Balance', func: formatNum },
    { key: 'positionAccount.value', label: 'Current Position', func: formatNum },
    {
      key: 'ndc',
      label: 'NDC',
      func: (v: number) => (v === undefined ? 'Disabled' : formatNum(v)),
    },
    {
      key: '',
      sortable: false,
      searchable: false,
      label: '% NDC Used',
      func: (_: undefined, item: FinancialPosition) => {
        if (!item || !item.positionAccount || !item.positionAccount.value || !item.ndc) {
          return '-';
        }
        return <Perc perc={Math.floor(100 * (item.positionAccount.value / item.ndc))} />;
      },
    },
    {
      key: 'update',
      label: '',
      sortable: false,
      searchable: false,
      func: (_: unknown, item: FinancialPosition) => {
        if (item.positionAccount) {
          return (
            <Button
              pending={item.positionAccount.updateInProgress}
              id={`btn__update_${item.dfsp.name}`}
              label="Update"
              size="s"
              kind="secondary"
              onClick={() => onSelectFinancialPosition(item)}
            />
          );
        }
        return '-';
      },
    },
    {
      key: 'toggleActive',
      label: '',
      sortable: false,
      searchable: false,
      func: (_: unknown, item: FinancialPosition) => {
        if (item.positionAccount) {
          return (
            <Button
              pending={item.positionAccount?.updateInProgress}
              id={`btn__setActive_${item.dfsp.name}`}
              label={item.positionAccount.isActive ? 'Disable' : 'Enable'}
              size="s"
              kind="secondary"
              onClick={() => onToggleCurrencyActive(item)}
            />
          );
        }
        return '-';
      },
    },
  ];

  let content = null;
  if (financialPositionsError) {
    content = (
      <MessageBox id="msg_error__positions" kind="danger">
        {financialPositionsError}
      </MessageBox>
    );
  } else if (isFinancialPositionsPending) {
    content = <Spinner center />;
  } else {
    content = (
      <>
        <DataList columns={columns} list={financialPositions} sortColumn="DFSP" />
        {selectedFinancialPosition && <FinancialPositionUpdate />}
      </>
    );
  }
  return (
    <div className="financial-positions">
      <Heading size="3">DFSP Financial Positions</Heading>
      {content}
    </div>
  );
};

FinancialPositions.displayName = 'FinancialPositions';
export default financialPositionsConnector(withMount(FinancialPositions, 'onMount'));
