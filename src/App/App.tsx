import React from 'react';
import './index.scss';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useBasePath } from './hooks';
import DFSPs from './DFSPs';
import FinancialPositions from './FinancialPositions';

function App() {
  const basePath = useBasePath();
  return (
    <div className="financial-positions-app">
      {/* @ts-ignore */}
      <DFSPs>
        <Switch>
          <Route path={`${basePath}/positions`}>
            <FinancialPositions />
          </Route>
          <Route exact path={`${basePath}/`}>
            <Redirect to={`${basePath}/positions`} />
          </Route>
        </Switch>
      </DFSPs>
    </div>
  );
}

export { App };
export default App;
