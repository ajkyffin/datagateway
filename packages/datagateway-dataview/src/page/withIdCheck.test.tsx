import React from 'react';
import withIdCheck from './withIdCheck';
import { createShallow } from '@mui/material/test-utils';
import { shallow as enzymeShallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { flushPromises } from '../setupTests';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import { createLocation } from 'history';

describe('withIdCheck', () => {
  let shallow: typeof enzymeShallow;
  let useEffect: jest.SpyInstance;

  const Test: React.FC<{ message: string }> = (props: { message: string }) => (
    <div>{props.message}</div>
  );
  let pendingPromiseMock: jest.Mock;
  let resolvedTruePromiseMock: jest.Mock;
  let resolvedFalsePromiseMock: jest.Mock;
  let rejectedPromiseMock: jest.Mock;

  const mockUseEffect = (): void => {
    useEffect.mockImplementationOnce((f) => f());
  };

  beforeEach(() => {
    shallow = createShallow({ untilSelector: 'WithIdCheckComponent' });
    useEffect = jest.spyOn(React, 'useEffect');
    pendingPromiseMock = jest.fn().mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          // do nothing
        })
    );
    resolvedTruePromiseMock = jest.fn().mockResolvedValue(true);
    resolvedFalsePromiseMock = jest.fn().mockResolvedValue(false);
    rejectedPromiseMock = jest.fn().mockRejectedValue('');

    mockUseEffect(); // initial run
    mockUseEffect(); // promise resolve/reject
    mockUseEffect(); // promise finally
  });

  it('renders loading indicator when loading', () => {
    const SafeComponent = withIdCheck(pendingPromiseMock())(Test);
    const wrapper = shallow(<SafeComponent.WrappedComponent message="test" />);

    expect(wrapper).toMatchSnapshot();
  });

  it('renders component when checkingPromise resolves to be true', async () => {
    const SafeComponent = withIdCheck(resolvedTruePromiseMock())(Test);
    const wrapper = shallow(<SafeComponent.WrappedComponent message="test" />);

    await act(async () => {
      await flushPromises();
      wrapper.update();
    });

    expect(wrapper).toMatchSnapshot();
  });

  it('renders error when checkingPromise is rejected', async () => {
    const SafeComponent = withIdCheck(rejectedPromiseMock())(Test);
    const wrapper = shallow(
      <SafeComponent.WrappedComponent
        message="test"
        location={createLocation('/browse/investigation/2/dataset/1/datafile')}
      />
    );

    await act(async () => {
      await flushPromises();
      wrapper.update();
    });

    expect(wrapper).toMatchSnapshot();
  });

  it('renders error when checkingPromise does not resolve to be true', async () => {
    const SafeComponent = withIdCheck(resolvedFalsePromiseMock())(Test);
    const wrapper = shallow(
      <SafeComponent.WrappedComponent
        message="test"
        location={createLocation('/browse/investigation/2/dataset/1/datafile')}
      />
    );

    await act(async () => {
      await flushPromises();
      wrapper.update();
    });

    expect(wrapper).toMatchSnapshot();
  });
});
