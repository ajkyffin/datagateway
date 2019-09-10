import React from 'react';
import { Entity, Dataset } from 'datagateway-common';
import { Typography, Tabs, Tab } from '@material-ui/core';

interface DatasetDetailsPanelProps {
  rowData: Entity;
  detailsPanelResize: () => void;
  fetchDetails: (datasetId: number) => Promise<void>;
}

const DatasetDetailsPanel = (
  props: DatasetDetailsPanelProps
): React.ReactElement => {
  const { rowData, detailsPanelResize, fetchDetails } = props;
  const [value, setValue] = React.useState<'details' | 'type'>('details');

  const datasetData = rowData as Dataset;

  React.useEffect(() => {
    if (!datasetData.DATASETTYPE) {
      fetchDetails(datasetData.ID);
    }
  }, [datasetData, fetchDetails]);

  React.useLayoutEffect(() => {
    detailsPanelResize();
  }, [value, detailsPanelResize]);

  return (
    <div>
      <Tabs
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        aria-label="dataset-details-tabs"
      >
        <Tab
          id="dataset-details-tab"
          aria-controls="dataset-details-panel"
          label="Dataset Details"
          value="details"
        />
        {datasetData.DATASETTYPE && (
          <Tab
            id="dataset-type-tab"
            aria-controls="dataset-type-panel"
            label="Dataset Type"
            value="type"
          />
        )}
      </Tabs>
      <div
        id="dataset-details-panel"
        aria-labelledby="dataset-details-tab"
        role="tabpanel"
        hidden={value !== 'details'}
      >
        <Typography variant="body2">
          <b>Name:</b> {datasetData.NAME}
        </Typography>
        <Typography variant="body2">
          <b>Description:</b> {datasetData.DESCRIPTION}
        </Typography>
      </div>
      {datasetData.DATASETTYPE && (
        <div
          id="dataset-type-panel"
          aria-labelledby="dataset-type-tab"
          role="tabpanel"
          hidden={value !== 'type'}
        >
          <Typography variant="body2">
            <b>Name:</b> {datasetData.DATASETTYPE.NAME}
          </Typography>
          <Typography variant="body2">
            <b>Description:</b> {datasetData.DATASETTYPE.DESCRIPTION}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default DatasetDetailsPanel;
