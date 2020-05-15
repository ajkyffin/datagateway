import React from 'react';
import { Paper } from '@material-ui/core';

import CardView from './cardView.component';
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from 'datagateway-common/lib/state/app.types';
import { AnyAction } from 'redux';
import { IndexRange } from 'react-virtualized';
import {
  fetchDatasets,
  fetchDatasetCount,
  Dataset,
  datasetLink,
  Entity,
} from 'datagateway-common';
import { connect } from 'react-redux';

interface DatasetCVDispatchProps {
  fetchData: (
    investigationId: number,
    offsetParams?: IndexRange
  ) => Promise<void>;
  fetchCount: (investigationId: number) => Promise<void>;

  // addToCart: (entityIds: number[]) => Promise<void>;
  // removeFromCart: (entityIds: number[]) => Promise<void>;
}

interface DatasetCVStateProps {
  data: Entity[];
}

interface DatasetCardViewProps {
  investigationId: string;
}

type DatasetCVCombinedProps = DatasetCardViewProps &
  DatasetCVDispatchProps &
  DatasetCVStateProps;

const DatasetCardView = (props: DatasetCVCombinedProps): React.ReactElement => {
  const { investigationId, data, fetchCount, fetchData } = props;

  const [fetchedCount, setFetchedCount] = React.useState(false);
  const [fetchedData, setFetchedData] = React.useState(false);

  React.useEffect(() => {
    // Fetch the dataset count based on the investigation ID.
    if (!fetchedCount) {
      console.log('Fetch dataset count');
      fetchCount(parseInt(investigationId));
      setFetchedCount(true);
    }

    // Fetch the data.
    if (!fetchedData) {
      console.log('Fetch dataset data');
      fetchData(parseInt(investigationId));
      setFetchedData(true);
    }
  }, [investigationId, fetchedCount, fetchCount, fetchedData, fetchData]);

  return (
    <Paper square>
      <CardView
        data={data}
        // TODO: Put in the correct dataKeys.
        //       Provide an array of further info and tags.
        title={{
          dataKey: 'NAME',
          link: (dataset: Dataset) => {
            return datasetLink(investigationId, dataset.ID, dataset.NAME);
          },
        }}
        description={{ dataKey: 'DESCRIPTION' }}
        furtherInformation={[
          {
            label: 'Created Time',
            dataKey: 'CREATE_TIME',
          },
          {
            label: 'Modified Time',
            dataKey: 'MOD_TIME',
          },
          // {
          //   label: 'Datafile Count',
          //   dataKey: 'DATAFILE_COUNT',
          // },
        ]}
      />
    </Paper>
  );
};

const mapStateToProps = (state: StateType): DatasetCVStateProps => {
  return {
    data: state.dgcommon.data,
  };
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): DatasetCVDispatchProps => ({
  fetchData: (investigationId: number, offsetParams?: IndexRange) =>
    dispatch(fetchDatasets({ investigationId, offsetParams })),
  fetchCount: (investigationId: number) =>
    dispatch(fetchDatasetCount(investigationId)),

  // addToCart: (entityIds: number[]) => dispatch(addToCart('dataset', entityIds)),
  // removeFromCart: (entityIds: number[]) => dispatch(removeFromCart('dataset', entityIds)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasetCardView);
