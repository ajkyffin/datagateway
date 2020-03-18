import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import axios from 'axios';
import jsrsasign from 'jsrsasign';

import singleSpaReact from 'single-spa-react';

import {
  RequestPluginRerenderType,
  RegisterRouteType,
  MicroFrontendId,
  MicroFrontendToken,
} from 'datagateway-common';

function domElementGetter(): HTMLElement {
  // Make sure there is a div for us to render into
  let el = document.getElementById('datagateway-download');
  if (!el) {
    el = document.createElement('div');
  }

  return el;
}

const reactLifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: App,
  domElementGetter,
});

const render = (): void => {
  let el = document.getElementById('datagateway-download');
  if (el) {
    ReactDOM.render(<App />, document.getElementById('datagateway-download'));
  }
};

window.addEventListener('single-spa:routing-event', () => {
  // attempt to re-render the plugin if the corresponding div is present
  render();
});

document.addEventListener(MicroFrontendId, e => {
  // attempt to re-render the plugin if the corresponding div is present
  const action = (e as CustomEvent).detail;
  if (action.type === RequestPluginRerenderType) {
    // This is a temporary fix for the current issue with the tab indicator
    // not updating after the size of the page has been altered.
    // This is issue is being tracked by material-ui (https://github.com/mui-org/material-ui/issues/9337).
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('resize'));
    }, 125);
    render();
  }
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// Single-SPA bootstrap methods have no idea what type of inputs may be
// pushed down from the parent app
export function bootstrap(props: any): Promise<void> {
  return reactLifecycles.bootstrap(props);
}

export function mount(props: any): Promise<void> {
  return reactLifecycles.mount(props);
}

export function unmount(props: any): Promise<void> {
  return reactLifecycles.unmount(props);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

if (
  process.env.NODE_ENV === `development` ||
  process.env.REACT_APP_E2E_TESTING
) {
  render();

  if (process.env.NODE_ENV === `development`) {
    // TODO: get url from settings file
    const icatUrl = `https://scigateway-preprod.esc.rl.ac.uk:8181/icat`;
    axios
      .post(
        `${icatUrl}/session`,
        `json=${JSON.stringify({
          plugin: 'simple',
          credentials: [{ username: 'root' }, { password: 'pw' }],
        })}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      .then(response => {
        const jwtHeader = { alg: 'HS256', typ: 'JWT' };
        const payload = {
          sessionId: response.data.sessionId,
          username: 'dev',
        };
        const jwt = jsrsasign.KJUR.jws.JWS.sign(
          'HS256',
          jwtHeader,
          payload,
          'shh'
        );

        window.localStorage.setItem(MicroFrontendToken, jwt);
      })
      .catch(error => console.error(`Can't log in to ICAT: ${error.message}`));
  }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

document.dispatchEvent(
  new CustomEvent(MicroFrontendId, {
    detail: {
      type: RegisterRouteType,
      payload: {
        section: 'Test',
        link: '/download',
        plugin: 'datagateway-download',
        displayName: 'DataGateway Download',
        order: 0,
        helpText: 'TODO: Write help text for user tour',
      },
    },
  })
);
