import {
  FetchInvestigationsSuccessType,
  FetchInvestigationsFailureType,
  FetchInvestigationsRequestType,
  FetchDataSuccessPayload,
  FailurePayload,
  FetchCountSuccessPayload,
  FetchInvestigationCountSuccessType,
  FetchInvestigationCountFailureType,
  FetchInvestigationCountRequestType,
} from './actions.types';
import { Investigation, ActionType, ThunkResult } from '../app.types';
import { Action } from 'redux';
import axios from 'axios';
import { getApiFilter } from '.';
import { fetchInvestigationDatasetsCount } from './datasets';
import * as log from 'loglevel';
import { IndexRange } from 'react-virtualized';

export const fetchInvestigationsSuccess = (
  investigations: Investigation[]
): ActionType<FetchDataSuccessPayload> => ({
  type: FetchInvestigationsSuccessType,
  payload: {
    data: investigations,
  },
});

export const fetchInvestigationsFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: FetchInvestigationsFailureType,
  payload: {
    error,
  },
});

export const fetchInvestigationsRequest = (): Action => ({
  type: FetchInvestigationsRequestType,
});

export const fetchInvestigations = (
  offsetParams?: IndexRange
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    dispatch(fetchInvestigationsRequest());

    let filter = getApiFilter(getState);
    if (offsetParams) {
      filter.skip = offsetParams.startIndex;
      filter.limit = offsetParams.stopIndex - offsetParams.startIndex + 1;
    }

    let params = {};
    if (Object.keys(filter).length !== 0) {
      params = {
        filter,
      };
    }

    await axios
      .get('/investigations', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        dispatch(fetchInvestigationsSuccess(response.data));
        response.data.forEach((investigation: Investigation) => {
          dispatch(fetchInvestigationDatasetsCount(investigation.ID));
        });
      })
      .catch(error => {
        log.error(error.message);
        dispatch(fetchInvestigationsFailure(error.message));
      });
  };
};

export const fetchInvestigationCountSuccess = (
  count: number
): ActionType<FetchCountSuccessPayload> => ({
  type: FetchInvestigationCountSuccessType,
  payload: {
    count,
  },
});

export const fetchInvestigationCountFailure = (
  error: string
): ActionType<FailurePayload> => ({
  type: FetchInvestigationCountFailureType,
  payload: {
    error,
  },
});

export const fetchInvestigationCountRequest = (): Action => ({
  type: FetchInvestigationCountRequestType,
});

export const fetchInvestigationCount = (): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    dispatch(fetchInvestigationCountRequest());

    let filter = getApiFilter(getState);
    filter.where = {
      ...filter.where,
    };
    const params = {
      filter,
    };

    await axios
      .get('/investigations/count', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        dispatch(fetchInvestigationCountSuccess(response.data));
      })
      .catch(error => {
        log.error(error.message);
        dispatch(fetchInvestigationCountFailure(error.message));
      });
  };
};
