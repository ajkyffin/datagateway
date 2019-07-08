import {
  fetchDatafiles,
  fetchDatafilesRequest,
  fetchDatafilesSuccess,
  fetchDatafilesFailure,
} from '.';
import axios from 'axios';
import { StateType, Datafile } from '../app.types';
import { initialState } from '../reducers/dgtable.reducer';
import { Action } from 'redux';
import {
  fetchDatafileCount,
  fetchDatafileCountRequest,
  fetchDatafileCountSuccess,
  fetchDatafileCountFailure,
  downloadDatafile,
  downloadDatafileRequest,
} from './datafiles';

describe('Datafile actions', () => {
  afterEach(() => {
    (axios.get as jest.Mock).mockClear();
  });

  it('dispatches fetchDatafilesRequest and fetchDatafilesSuccess actions upon successful fetchDatafiles action', async () => {
    const mockData: Datafile[] = [
      {
        ID: 1,
        NAME: 'Test 1',
        LOCATION: '/test1',
        SIZE: 1,
        MOD_TIME: '2019-06-10',
        DATASET_ID: 1,
      },
      {
        ID: 2,
        NAME: 'Test 2',
        LOCATION: '/test2',
        SIZE: 2,
        MOD_TIME: '2019-06-10',
        DATASET_ID: 1,
      },
    ];

    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: mockData,
      })
    );

    const asyncAction = fetchDatafiles(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({ dgtable: initialState });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafilesRequest());
    expect(actions[1]).toEqual(fetchDatafilesSuccess(mockData));
    expect(axios.get).toHaveBeenCalledWith(
      '/datafiles',
      expect.objectContaining({
        params: {
          filter: {
            where: { DATASET_ID: 1 },
          },
        },
      })
    );
  });

  it('fetchDatafiles action applies filters and sort state to request params', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: [],
      })
    );

    const asyncAction = fetchDatafiles(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({
      dgtable: {
        ...initialState,
        sort: { column1: 'desc' },
        filters: { column1: '1', column2: '2' },
      },
    });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafilesRequest());

    expect(actions[1]).toEqual(fetchDatafilesSuccess([]));

    expect(axios.get).toHaveBeenCalledWith(
      '/datafiles',
      expect.objectContaining({
        params: {
          filter: {
            order: 'column1 desc',
            where: { column1: '1', column2: '2', DATASET_ID: 1 },
          },
        },
      })
    );
  });

  it('dispatches fetchDatafilesRequest and fetchDatafilesFailure actions upon unsuccessful fetchDatafiles action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchDatafiles(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({ dgtable: initialState });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafilesRequest());
    expect(actions[1]).toEqual(fetchDatafilesFailure('Test error message'));
  });

  it('dispatches fetchDatafileCountRequest and fetchDatafileCountSuccess actions upon successful fetchDatafileCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 2,
      })
    );

    const asyncAction = fetchDatafileCount(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({ dgtable: initialState });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafileCountRequest());
    expect(actions[1]).toEqual(fetchDatafileCountSuccess(1, 2));
    expect(axios.get).toHaveBeenCalledWith(
      '/datafiles/count',
      expect.objectContaining({
        params: {
          filter: {
            where: { DATASET_ID: 1 },
          },
        },
      })
    );
  });

  it('dispatches fetchDatafileCountRequest and fetchDatafileCountFailure actions upon unsuccessful fetchDatafileCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchDatafileCount(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({ dgtable: initialState });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafileCountRequest());
    expect(actions[1]).toEqual(fetchDatafileCountFailure('Test error message'));
  });

  it('dispatches downloadDatafileRequest and clicks on IDS link upon downloadDatafile action', async () => {
    jest.spyOn(document, 'createElement');
    jest.spyOn(document.body, 'appendChild');

    const asyncAction = downloadDatafile(1, 'test.txt');
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({ dgtable: initialState });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(downloadDatafileRequest());

    expect(document.createElement).toHaveBeenCalledWith('a');
    let link = document.createElement('a');
    link.href = `/getData?sessionId=${null}&datafileIds=${1}&compress=${false}&outname=${'test.txt'}`;
    link.target = '_blank';
    link.style.display = 'none';
    expect(document.body.appendChild).toHaveBeenCalledWith(link);
  });

  it('fetchDatafiles action applies filters and sort state to request params', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: [],
      })
    );

    const asyncAction = fetchDatafiles(1);
    const actions: Action[] = [];
    const dispatch = (action: Action): void | Promise<void> => {
      if (typeof action === 'function') {
        action(dispatch);
        return Promise.resolve();
      } else {
        actions.push(action);
      }
    };
    const getState = (): Partial<StateType> => ({
      dgtable: {
        ...initialState,
        sort: { column1: 'desc' },
        filters: { column1: '1', column2: '2' },
      },
    });

    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchDatafilesRequest());

    expect(actions[1]).toEqual(fetchDatafilesSuccess([]));

    expect(axios.get).toHaveBeenCalledWith(
      '/datafiles',
      expect.objectContaining({
        params: {
          filter: {
            order: 'column1 desc',
            where: { column1: '1', column2: '2', DATASET_ID: 1 },
          },
        },
      })
    );
  });
});
