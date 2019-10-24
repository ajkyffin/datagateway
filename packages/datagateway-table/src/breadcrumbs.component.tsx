import React from 'react';

import { StateType } from './state/app.types';
import { connect } from 'react-redux';

import axios from 'axios';
import { Route } from 'react-router';

import { Link, Paper, Breadcrumbs, Typography } from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

// TODO: Maintain internal component state.
// let breadcrumbsState = {
//   1: {
//     displayName: "Investigations",
//     url: "/browse/investigation"
//   },
//   2: {
//     displayName: "quas accusantium omnis",
//     url: "/browse/investigation/1/dataset"
//   },
//   3: {
//     displayName: "Dataset 1",
//     url: "/browse/investigation/1/dataset/1/datafile"
//   }
// }

const apiEntityRoutes: { [entity: string]: string } = {
  proposal: '/investigations/',
  investigation: '/investigations/',
  dataset: '/datasets/',
  datafile: '/datafiles/',
};

interface BreadcrumbProps {
  apiUrl: string;
  location: string;
}

interface BreadcrumbState {
  investigation: {
    id: string;
    displayName: string;
    url: string;
  };
  dataset: {
    id: string;
    displayName: string;
    url: string;
  };
  datafile: {
    id: string;
    displayName: string;
    url: string;
  };
  [key: string]: {
    id: string;
    displayName: string;
    url: string;
  };
}

class PageBreadcrumbs extends React.Component<
  BreadcrumbProps,
  BreadcrumbState
> {
  private isBreadcrumbUpdated: boolean = false;

  public constructor(props: BreadcrumbProps) {
    super(props);

    this.state = {
      investigation: {
        id: '',
        displayName: 'N/A',
        url: '',
      },
      dataset: {
        id: '',
        displayName: 'N/A',
        url: '',
      },
      datafile: {
        id: '',
        displayName: 'N/A',
        url: '',
      },
    };
  }

  // Store the current breadcrumb state; use the IDs
  // of the investigation/dataset
  // const currentBreadcrumb = {
  // }

  // return (
  //   <div>
  //     <Paper elevation={0}>
  //       <Breadcrumbs
  //         separator={<NavigateNextIcon fontSize="small" />}
  //         aria-label="breadcrumb"
  //       >
  //         <Link color="inherit">
  //           Home
  //         </Link>
  //         {/* <MaterialLink color="inherit">
  //                         Test2
  //                     </MaterialLink> */}
  //         <Typography color="textPrimary">breadcrumb</Typography>
  //       </Breadcrumbs>
  //     </Paper>
  //   </div>
  // );

  public componentDidMount(): void {
    console.log('Called componentDidMount');
    console.log('Initial State: ', this.state);
    this.updateBreadcrumbState(1);
  }

  public componentDidUpdate(prevProps: BreadcrumbProps): void {
    console.log('Called componentDidUpdate');

    if (prevProps.location !== this.props.location) {
      console.log(
        `At new location, ${prevProps.location} -> ${this.props.location}`
      );
      this.isBreadcrumbUpdated = false;
    }

    if (!this.isBreadcrumbUpdated) {
      console.log('Need to update.');
      this.updateBreadcrumbState(2);
    } else {
      console.log('No need to update.');
    }
  }

  // public componentWillUnmount(): void {
  //   console.log('Component unmounting, setting stateUpdated to false.');
  //   this.isBreadcrumbUpdated = false;
  // }

  private updateBreadcrumbState = async (num: number) => {
    let updatedState = this.state;
    console.log('Current state: ', updatedState);

    console.log('Location: ', this.props.location);
    const pathnames = this.props.location.split('/').filter(x => x);
    console.log(`Path names: ${pathnames}`);

    // Loop through each entry in the path name before the last.
    // We check these against defined API routes.
    let pathLength = pathnames.length;
    for (let index = 0; index < pathnames.length; index++) {
      let value = pathnames[index];
      const valueData = this.state[value];

      console.log(`Current value: ${value}`);
      console.log(`Current index: ${index}`);

      const link = `/${pathnames.slice(0, index + 1).join('/')}`;
      console.log(`Breadcrumb URL: ${link}`);

      // Check for the specific routes and request the names from the API.
      if (value in apiEntityRoutes && index < pathLength - 1) {
        const entityId = pathnames[index + 1];
        console.log(`Entity ID: ${entityId}`);

        // Check if value is already updated by seeing if the id is already set or not.
        if (
          valueData.id.length === 0 ||
          valueData.id !== pathnames[index + 1]
        ) {
          let requestEntityUrl = `${apiEntityRoutes[value]}${entityId}`;
          console.log(`Contructed request URL: ${requestEntityUrl}`);

          const entityName = await this.getEntityName(requestEntityUrl);
          if (entityName) {
            console.log(`${value} - Retrieved entity name: ${entityName}`);

            // Update the state with the entity information.
            updatedState = {
              ...updatedState,
              [value]: {
                id: entityId,
                displayName: entityName,
                url: link,
              },
            };
            console.log(`Updated state for ${value}:`, updatedState);
          } else {
            console.log('Did not get entity name: ', entityName);
          }
        } else {
          console.log(
            `${value} is same as before with ID ${entityId}, no need request.`
          );
        }
      } else if (value in apiEntityRoutes && index === pathLength - 1) {
        console.log(`Processing last item in path: ${value}`);

        // Update the state to say that e.g. if path is /browse/investigation/,
        // then display name would be just Browse > Investigations and similarly
        // Browse > Proposal 1 > Datasets etc.

        updatedState = {
          ...updatedState,
          [value]: {
            id: '',
            displayName:
              `${value}`.charAt(0).toUpperCase() + `${value}s`.slice(1),
            url: link,
          },
        };
        console.log(`Updated state for ${value}:`, updatedState);
      }
    }

    // Update the final state.
    this.setState(updatedState, () =>
      console.log(`Final state (${num}): `, this.state)
    );
    this.isBreadcrumbUpdated = true;
  };

  private getEntityName = async (requestEntityUrl: string): Promise<string> => {
    let entityName = '';

    // Make a GET request to the specified URL.
    entityName = await axios
      .get(`${this.props.apiUrl}${requestEntityUrl}`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        console.log(`${requestEntityUrl} - Response Data:`, response.data);

        // Return the NAME property in the data received.
        console.log(`${requestEntityUrl} - Entity Name: ${response.data.NAME}`);
        return response.data.NAME;
      })
      .catch(error => {
        console.log(error);
        return '';
      });

    return entityName;
  };

  public render(): React.ReactElement {
    const breadcrumbState = this.state;
    const pathnames = this.props.location.split('/').filter(x => x);

    // TODO: Set as Typography if last is at root.
    const last = pathnames[pathnames.length - 1];

    console.log('Breadcrumb state: ', breadcrumbState);
    console.log('Last entry: ', last);

    return (
      <div>
        <Paper elevation={0}>
          <Route>
            {() => {
              return (
                <Breadcrumbs
                  separator={<NavigateNextIcon fontSize="small" />}
                  aria-label="Breadcrumb"
                >
                  <Link color="inherit" href="/">
                    Browse
                  </Link>

                  {Object.keys(breadcrumbState)
                    .filter((value: string) => {
                      return breadcrumbState[value].displayName !== 'N/A';
                    })
                    .map((value: string, index: number) => {
                      let valueData = breadcrumbState[value];
                      console.log(
                        `Creating breadcrumb for ${value}: ${valueData.url}, ${valueData.displayName}`
                      );

                      // Return the Link with the entity name.
                      return last === value ? (
                        <Typography
                          color="textPrimary"
                          key={`${value}-${valueData.id}`}
                        >
                          {valueData.displayName}
                        </Typography>
                      ) : (
                        <Link
                          color="inherit"
                          href={valueData.url}
                          key={`${value}-${valueData.id}`}
                        >
                          {valueData.displayName}
                        </Link>
                      );
                    })}
                </Breadcrumbs>
              );
            }}
          </Route>
        </Paper>
      </div>
    );

    // return (
    //   <div>
    //     <Paper elevation={0}>
    //       <Route>
    //         {
    //           return (
    //             <Breadcrumbs
    //             separator={<NavigateNextIcon fontSize="small" />}
    //             aria-label="Breadcrumb"
    //           >
    //             <Link color="inherit" href="/">
    //               Browse
    //             </Link>

    //             {
    //               Object.keys(breadcrumbState).map((value: string, index: number) => {
    //                 let valueData = breadcrumbState[value];
    //                 console.log(`Creating breadcrumb for ${value}`);

    //                 // Return the Link with the entity name.
    //                 return  (
    //                   <Link color="inherit" href={valueData.url} key={`${value}-${valueData.id}`}>
    //                     {valueData.displayName}
    //                   </Link>
    //                 );

    //                  {/* // return (
    //                   //  <Typography color="textPrimary" key={to}>
    //                   //    {value}
    //                   //  </Typography>
    //                   // ) : ( */}
    //                 {/* // return <Link key="">N/A</Link>; */}
    //               })
    //             }
    //           </Breadcrumbs>
    //         )
    //       }
    //     </Route>
    //   </Paper>
    //   </div>
    // );
  }
}

const mapStateToProps = (state: StateType): BreadcrumbProps => ({
  apiUrl: state.dgtable.urls.apiUrl,
  location: state.router.location.pathname,
});

export default connect(mapStateToProps)(PageBreadcrumbs);
