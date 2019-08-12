import {
  FetchDatasetsSuccessType,
  FetchDatasetsFailureType,
  FetchDatasetsRequestType,
  FetchInvestigationDatasetsCountRequestType,
  FetchInvestigationDatasetsCountFailureType,
  FetchInvestigationDatasetsCountSuccessType,
  DownloadDatasetSuccessType,
  DownloadDatasetFailureType,
  DownloadDatasetRequestType,
  FetchDataSuccessPayload,
  FailurePayload,
  FetchDataCountSuccessPayload,
  FetchCountSuccessPayload,
  FetchDatasetCountSuccessType,
  FetchDatasetCountFailureType,
  FetchDatasetCountRequestType,
} from './actions.types';
import { Dataset, ActionType, ThunkResult } from '../app.types';
import { source } from '../middleware/dgtable.middleware';
import { Action } from 'redux';
import axios from 'axios';
import { getApiFilter } from '.';
import { fetchDatasetDatafilesCount } from './datafiles';
import * as log from 'loglevel';
import { IndexRange } from 'react-virtualized';

export const fetchDatasetsSuccess = (
  datasets: Dataset[]
): ActionType<FetchDataSuccessPayload> => ({
  type: FetchDatasetsSuccessType,
  payload: {
    data: datasets,
  },
});

export const fetchDatasetsFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: FetchDatasetsFailureType,
  payload: {
    error,
  },
});

export const fetchDatasetsRequest = (): Action => ({
  type: FetchDatasetsRequestType,
});

export const fetchDatasets = (
  investigationId: number,
  offsetParams?: IndexRange
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    dispatch(fetchDatasetsRequest());

    let filter = getApiFilter(getState);
    filter.where = {
      ...filter.where,
      INVESTIGATION_ID: investigationId,
    };
    if (offsetParams) {
      filter.skip = offsetParams.startIndex;
      filter.limit = offsetParams.stopIndex - offsetParams.startIndex + 1;
    }

    const params = {
      filter,
    };

    await axios
      .get('/datasets', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        dispatch(fetchDatasetsSuccess(response.data));
        response.data.forEach((dataset: Dataset) => {
          dispatch(fetchDatasetDatafilesCount(dataset.ID));
        });
      })
      .catch(error => {
        log.error(error.message);
        dispatch(fetchDatasetsFailure(error.message));
      });
  };
};

export const fetchDatasetCountSuccess = (
  count: number
): ActionType<FetchCountSuccessPayload> => ({
  type: FetchDatasetCountSuccessType,
  payload: {
    count,
  },
});

export const fetchDatasetCountFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: FetchDatasetCountFailureType,
  payload: {
    error,
  },
});

export const fetchDatasetCountRequest = (): Action => ({
  type: FetchDatasetCountRequestType,
});

export const fetchDatasetCount = (
  investigationId: number
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    dispatch(fetchDatasetCountRequest());

    let filter = getApiFilter(getState);
    filter.where = {
      ...filter.where,
      INVESTIGATION_ID: investigationId,
    };
    const params = {
      filter,
    };

    await axios
      .get('/datasets/count', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        dispatch(fetchDatasetCountSuccess(response.data));
      })
      .catch(error => {
        log.error(error.message);
        dispatch(fetchDatasetCountFailure(error.message));
      });
  };
};

export const downloadDatasetSuccess = (): Action => ({
  type: DownloadDatasetSuccessType,
});

export const downloadDatasetFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: DownloadDatasetFailureType,
  payload: {
    error,
  },
});

export const downloadDatasetRequest = (): Action => ({
  type: DownloadDatasetRequestType,
});

export const downloadDataset = (
  datasetId: number,
  datasetName: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(downloadDatasetRequest());

    // TODO: get this from some sort of settings file
    const idsUrl = '';

    // TODO: get ICAT session id properly when auth is sorted
    const params = {
      sessionId: window.localStorage.getItem('icat:token'),
      datasetIds: datasetId,
      compress: false,
      zip: true,
      outname: datasetName,
    };

    const link = document.createElement('a');
    link.href = `${idsUrl}/getData?${Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;

    link.style.display = 'none';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
};

export const fetchInvestigationDatasetsCountSuccess = (
  investigationId: number,
  count: number
): ActionType<FetchDataCountSuccessPayload> => ({
  type: FetchInvestigationDatasetsCountSuccessType,
  payload: {
    id: investigationId,
    count,
  },
});

export const fetchInvestigationDatasetsCountFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: FetchInvestigationDatasetsCountFailureType,
  payload: {
    error,
  },
});

export const fetchInvestigationDatasetsCountRequest = (): Action => ({
  type: FetchInvestigationDatasetsCountRequestType,
});

export const fetchInvestigationDatasetsCount = (
  investigationId: number
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(fetchInvestigationDatasetsCountRequest());

    const params = {
      filter: {
        where: {
          INVESTIGATION_ID: investigationId,
        },
      },
    };

    await axios
      .get('/datasets/count', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
        cancelToken: source.token,
      })
      .then(response => {
        dispatch(
          fetchInvestigationDatasetsCountSuccess(investigationId, response.data)
        );
      })
      .catch(error => {
        log.error(error.message);
        dispatch(fetchInvestigationDatasetsCountFailure(error.message));
      });
  };
};
