import React from 'react';
import { StateType } from '../state/app.types';
import { connect } from 'react-redux';

import {
  Grid,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
} from '@material-ui/core';
import PageBreadcrumbs from './breadcrumbs.component';
import PageTable from './pageTable.component';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import {
  loadURLQuery,
  pushPageView,
  saveQueries,
  restoreQueries,
} from 'datagateway-common';

import { QueryParams, ViewsType } from 'datagateway-common/lib/state/app.types';
import { Route } from 'react-router';
import PageCard from './pageCard.component';
import { supportedPaths } from './pageCard.component';

interface PageContainerDispatchProps {
  loadQuery: () => Promise<void>;
  pushView: (view: ViewsType) => Promise<void>;
  saveQuery: () => Promise<void>;
  restoreQuery: () => Promise<void>;
}

interface PageContainerProps {
  entityCount: number;
  path: string;
  query: QueryParams;
  savedQueries: QueryParams | null;
}

type PageContainerCombinedProps = PageContainerProps &
  PageContainerDispatchProps;

interface PageContainerState {
  paths: string[];
  toggleCard: boolean;
}

class PageContainer extends React.Component<
  PageContainerCombinedProps,
  PageContainerState
> {
  public constructor(props: PageContainerCombinedProps) {
    super(props);

    console.log('Support paths: ', Object.values(supportedPaths));

    // Load the current URL query parameters.
    this.props.loadQuery();

    // Allow for query parameter to override the
    // toggle state in the localStorage.
    this.state = {
      paths: Object.values(supportedPaths),
      toggleCard: this.getToggle(),
    };
  }

  public componentDidUpdate(prevProps: PageContainerCombinedProps): void {
    // Ensure if the location changes, then we update the query parameters.
    if (prevProps.path !== this.props.path) {
      console.log('Path changed: ', this.props.path);
      this.props.loadQuery();
    }

    // If the view query parameter was not found and the previously
    // stored view is in localstorage, update our current query with the view.
    if (this.getToggle() && !this.props.query.view) this.props.pushView('card');

    // Keep the query parameter for view and the state in sync, by getting the latest update.
    if (prevProps.query.view !== this.props.query.view) {
      this.setState({
        ...this.state,
        toggleCard: this.getToggle(),
      });
    }
  }

  public getPathMatch = (): boolean => {
    // console.log(
    //   'supported path: ',
    //   Object.values(supportedPaths).some(p => this.props.path.match(p))
    // );
    // console.log('supported: ', this.props.path.match('/browse/investigation'));

    // console.log('match supported: ', Object.values(supportedPaths));
    const res = Object.values(supportedPaths).some(p => {
      // console.log('match input: ', p.replace(/(:[^./]*)/g, '(.)+'));
      // Look for the character set where the parameter for ID would be
      // replaced with the regex to catch any character between the forward slashes.
      const match = this.props.path.match(p.replace(/(:[^./]*)/g, '(.)+'));
      // console.log('match: ', match);
      // console.log('match string: ', match && this.props.path === match[0]);
      return match && this.props.path === match[0];
    });
    // console.log('supported: ', res);
    return res;
  };

  public getToggle = (): boolean => {
    return this.getPathMatch()
      ? this.props.query.view
        ? this.props.query.view === 'card'
          ? true
          : false
        : this.getView() === 'card'
        ? true
        : false
      : false;
  };

  public storeDataView = (view: 'table' | 'card'): void =>
    localStorage.setItem('dataView', view);

  public getView = (): string => {
    // We store the view into localStorage so the user can
    // return to the view they were on the next time they open the page.
    let savedView = localStorage.getItem('dataView');

    // We set to 'table' initially if there is none present.
    if (!savedView) this.storeDataView('table');
    else return savedView;
    return 'table';
  };

  public handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const viewName = event.target.checked ? 'card' : 'table';

    // Set the view in local storage.
    this.storeDataView(viewName);

    // Handle logic for handling queries when changing between views.
    if (!event.target.checked) {
      this.props.saveQuery();
    } else if (event.target.checked && this.props.savedQueries !== null) {
      this.props.restoreQuery();
    }

    // Add the view and push the final query parameters.
    this.props.pushView(viewName);

    // Set the state with the toggled card option and the saved queries.
    this.setState({
      ...this.state,
      toggleCard: event.target.checked,
    });
  };

  public render(): React.ReactElement {
    return (
      <Grid container>
        {/* Hold the breadcrumbs at top left of the page. */}
        <Grid item xs aria-label="container-breadcrumbs">
          {/* don't show breadcrumbs on /my-data - only on browse */}
          <Route path="/browse" component={PageBreadcrumbs} />
        </Grid>

        {/* The table entity count takes up an xs of 2, where the breadcrumbs
            will take the remainder of the space. */}
        <Grid
          style={{ textAlign: 'center' }}
          item
          xs={2}
          aria-label="container-table-count"
        >
          <Paper square>
            <Typography variant="h6" component="h3">
              <b>Results:</b> {this.props.entityCount}
            </Typography>
          </Paper>
        </Grid>

        {/* Toggle between the table and card view */}
        <Grid item xs={12}>
          <Route
            exact
            path={this.state.paths}
            render={() => (
              <FormControlLabel
                value="start"
                control={
                  <Switch
                    checked={this.state.toggleCard}
                    onChange={this.handleToggleChange}
                    name="toggleCard"
                    inputProps={{ 'aria-label': 'secondary checkbox' }}
                  />
                }
                label="Toggle Cards"
                labelPlacement="start"
              />
            )}
          />
        </Grid>

        {/* Hold the table for remainder of the page */}
        <Grid item xs={12} aria-label="container-table">
          {!this.state.toggleCard ? (
            // Place table in Paper component which adjusts for the height
            // of the AppBar (64px) on parent application and the breadcrumbs component (31px).
            <Paper
              square
              style={{ height: 'calc(100vh - 95px)', width: '100%' }}
            >
              <PageTable />
            </Paper>
          ) : (
            <Paper square>
              <PageCard />
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state: StateType): PageContainerProps => ({
  entityCount: state.dgcommon.totalDataCount,
  path: state.router.location.pathname,
  query: state.dgcommon.query,
  savedQueries: state.dgcommon.savedQueries,
});

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): PageContainerDispatchProps => ({
  loadQuery: () => dispatch(loadURLQuery()),
  pushView: (view: ViewsType) => dispatch(pushPageView(view)),
  saveQuery: () => dispatch(saveQueries()),
  restoreQuery: () => dispatch(restoreQueries()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);
