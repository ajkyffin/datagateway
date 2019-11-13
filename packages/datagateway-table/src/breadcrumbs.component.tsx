import React, { useEffect } from 'react';
import { StateType } from './state/app.types';
import { connect } from 'react-redux';

import axios from 'axios';
import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import {
  Link as MaterialLink,
  Paper,
  Breadcrumbs,
  Typography,
  Tooltip,
} from '@material-ui/core';
import { TooltipProps } from '@material-ui/core/Tooltip';

import {
  withStyles,
  StyleRules,
  createStyles,
  WithStyles,
  makeStyles,
  Theme,
} from '@material-ui/core/styles';

const arrowGenerator = (
  color: string
): Record<string, Record<string, string | number | Record<string, string>>> => {
  return {
    '&[x-placement*="bottom"] $arrow': {
      top: 0,
      left: 0,
      marginTop: '-0.95em',
      width: '2em',
      height: '1em',
      '&::before': {
        borderWidth: '0 1em 1em 1em',
        borderColor: `transparent transparent ${color} transparent`,
      },
    },
    '&[x-placement*="top"] $arrow': {
      bottom: 0,
      left: 0,
      marginBottom: '-0.95em',
      width: '2em',
      height: '1em',
      '&::before': {
        borderWidth: '1em 1em 0 1em',
        borderColor: `${color} transparent transparent transparent`,
      },
    },
    '&[x-placement*="right"] $arrow': {
      left: 0,
      marginLeft: '-0.95em',
      height: '2em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 1em 1em 0',
        borderColor: `transparent ${color} transparent transparent`,
      },
    },
    '&[x-placement*="left"] $arrow': {
      right: 0,
      marginRight: '-0.95em',
      height: '2em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 0 1em 1em',
        borderColor: `transparent transparent transparent ${color}`,
      },
    },
  };
};

const useStylesArrow = makeStyles((theme: Theme) =>
  createStyles({
    tooltip: {
      position: 'relative',
      backgroundColor: theme.palette.common.black,
      fontSize: '0.875rem',
    },
    popper: arrowGenerator(theme.palette.common.black),
    arrow: {
      position: 'absolute',
      fontSize: 6,
      '&::before': {
        content: '""',
        margin: 'auto',
        display: 'block',
        width: 0,
        height: 0,
        borderStyle: 'solid',
      },
    },
  })
);

const ArrowTooltip = (props: TooltipProps): React.ReactElement => {
  const { arrow, ...classes } = useStylesArrow();
  const [arrowRef, setArrowRef] = React.useState<HTMLSpanElement | null>(null);

  const tooltipElement: React.RefObject<HTMLElement> = React.createRef();
  const isTooltipViewable = React.useRef(false);

  useEffect(() => {
    if (tooltipElement !== null && tooltipElement.current !== null) {
      // 0.2 here meaning the 20% of the viewport width which is set as the max width for the breadcrumb.
      console.log(
        `Element viewport width (%): ${tooltipElement.current.offsetWidth /
          window.innerWidth}`
      );

      if (tooltipElement.current.offsetWidth / window.innerWidth >= 0.2)
        isTooltipViewable.current = true;
      console.log(`Tooltip Viewable: ${isTooltipViewable}`);
    }
  });

  return (
    <Tooltip
      ref={tooltipElement}
      classes={classes}
      PopperProps={{
        popperOptions: {
          modifiers: {
            arrow: {
              enabled: Boolean(arrowRef),
              element: arrowRef,
            },
          },
        },
      }}
      {...props}
      title={
        <React.Fragment>
          {props.title}
          <span className={arrow} ref={setArrowRef} />
        </React.Fragment>
      }
      disableHoverListener={!isTooltipViewable.current}
    />
  );
};

const styles = (): StyleRules =>
  createStyles({
    breadcrumb: {
      display: 'block',
      whiteSpace: 'nowrap',
      maxWidth: '20vw',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  });

interface BreadcrumbProps {
  apiUrl: string;
  location: string;
}

interface Breadcrumb {
  id: string;
  pathName: string;
  displayName: string;
  url: string;
}

interface BreadcrumbState {
  base: {
    entityName: string;
    displayName: string;
    url: string;
    isLast: boolean;
  };
  currentHierarchy: Breadcrumb[];
  last: {
    displayName: string;
  };
}

interface WrappedProps extends WithStyles<typeof styles> {
  displayName: string;
  ariaLabel: string;
  url?: string;
  isLast?: boolean;
}

class WrappedBreadcrumb extends React.Component<
  WrappedProps & WithStyles<typeof styles>
> {
  public constructor(props: WrappedProps & WithStyles<typeof styles>) {
    super(props);
  }

  public render(): React.ReactElement {
    return (
      <ArrowTooltip title={this.props.displayName}>
        {this.props.url ? (
          <MaterialLink
            component={Link}
            to={this.props.url}
            aria-label={this.props.ariaLabel}
            className={this.props.classes.breadcrumb}
          >
            {this.props.displayName}
          </MaterialLink>
        ) : (
          <Typography
            color="textPrimary"
            aria-label={this.props.ariaLabel}
            className={this.props.classes.breadcrumb}
          >
            {this.props.isLast ? (
              <i>{this.props.displayName}</i>
            ) : (
              this.props.displayName
            )}
          </Typography>
        )}
      </ArrowTooltip>
    );
  }
}

const StyledBreadcrumb = withStyles(styles)(WrappedBreadcrumb);

class PageBreadcrumbs extends React.Component<
  BreadcrumbProps,
  BreadcrumbState
> {
  private currentPathnames: string[];
  private isBreadcrumbUpdated: boolean;

  public constructor(props: BreadcrumbProps) {
    super(props);

    this.currentPathnames = [];
    this.isBreadcrumbUpdated = false;

    this.state = {
      base: {
        entityName: '',
        displayName: 'N/A',
        url: '',
        isLast: false,
      },
      currentHierarchy: [],
      last: {
        displayName: 'N/A',
      },
    };
  }

  public componentDidMount(): void {
    console.log('Called componentDidMount');

    // Store the current pathnames.
    this.currentPathnames = this.props.location.split('/').filter(x => x);
    console.log('Saved current pathnames: ', this.currentPathnames);

    this.updateBreadcrumbState(1);
  }

  public componentDidUpdate(prevProps: BreadcrumbProps): void {
    console.log('Called componentDidUpdate');

    this.currentPathnames = this.props.location.split('/').filter(x => x);
    console.log('Saved current pathnames: ', this.currentPathnames);

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

  private updateBreadcrumbState = async (num: number) => {
    let updatedState = this.state;
    console.log('Current state: ', updatedState);
    console.log(`Updating with path names: ${this.currentPathnames}`);

    // Update the base address if it has changed.
    const baseEntityName = this.currentPathnames[1];
    if (!(updatedState.base.entityName === baseEntityName)) {
      updatedState = {
        ...updatedState,
        base: {
          entityName: baseEntityName,
          displayName:
            `${baseEntityName}`.charAt(0).toUpperCase() +
            `${baseEntityName}s`.slice(1),
          url: `/${this.currentPathnames.slice(0, 2).join('/')}`,
          isLast: false,
        },
      };
    }

    // Reset the last fields for base and the whole breadcrumb state.
    // Set the base isLast to false unless it is proven otherwise later.
    updatedState.base.isLast = false;
    if (updatedState.last.displayName !== 'N/A') {
      updatedState = {
        ...updatedState,
        last: {
          displayName: 'N/A',
        },
      };
    }

    // Loop through each entry in the path name before the last.
    // We always skip 2 go ahead in steps of 2 as the we expect
    // the format to be /{entity}/{entityId}.
    let hierarchyCount = 0;
    const pathLength = this.currentPathnames.length;
    for (let index = 1; index < pathLength; index += 2) {
      console.log(`Current index: ${index}`);

      // Get the entity and the data stored on the entity.
      let entity = this.currentPathnames[index];
      console.log(`Current value: ${entity}`);

      const link = `/${this.currentPathnames.slice(0, index + 3).join('/')}`;
      console.log(`Breadcrumb URL: ${link}`);

      // Check we are not the end of the pathnames array.
      if (index < pathLength - 1) {
        // If the index does not already exist,
        // create the entry for the index.
        if (!updatedState.currentHierarchy[hierarchyCount]) {
          // Insert the new breadcrumb information into the array.
          updatedState.currentHierarchy.splice(hierarchyCount, 1, {
            id: '',
            pathName: entity,
            displayName: 'N/A',
            url: link,
          });
        }

        // Get the information held in the state for the current path name.
        console.log('Current state: ', updatedState);
        const entityInfo = updatedState.currentHierarchy[hierarchyCount];
        console.log(
          `Entity Info with hierarchyCount (${hierarchyCount}): `,
          entityInfo
        );

        // Get the entity Id in the path to compare with the saved one in our state.
        const entityId = this.currentPathnames[index + 1];
        console.log(`Entity ID: ${entityId}`);

        // Check if an entity id is present or if the id has changed since the last update to the state.
        if (entityInfo.id.length === 0 || entityInfo.id !== entityId) {
          // In general the API endpoint will be our entity name and
          // the entity field we want is the NAME of the entity.
          let apiEntity = entity;
          let requestEntityField = 'NAME';

          // There are some exceptions to this when handling the DIAMOND/DLS
          // depending on if 'proposal' has been found in the current path.
          console.log('Current path: ', this.currentPathnames);
          console.log('Current entity: ', entity);
          if (this.currentPathnames.includes('proposal')) {
            // If the entity is current proposal, then we will not make an API request,
            // as we need the investigation ID to retrieve the TITLE.
            if (entity === 'proposal') {
              apiEntity = 'investigation';
              requestEntityField = 'TITLE';
            } else if (entity === 'investigation') {
              // Otherwise, we can proceed and get the VISIT_ID for the investigation entity.
              requestEntityField = 'VISIT_ID';
            }
          } else {
            // Anything else (including ISIS), we request the TITLE for the investigation entity.
            if (entity === 'investigation') requestEntityField = 'TITLE';
          }
          console.log(`API Entity: ${apiEntity}`);
          console.log(`Request Entity Field: ${requestEntityField}`);

          // Create the entity url to request the name, this is pluralised to get the API endpoint.
          let requestEntityUrl;
          if (entity !== 'proposal') {
            requestEntityUrl = `${apiEntity}s`.toLowerCase() + `/${entityId}`;
          } else {
            // If we are searching for proposal, we know that there is no investigation
            // information in the current path. We will need to query and select one investigation
            // from all investigations with the entity id (which is the proposal/investigation name).
            requestEntityUrl =
              `${apiEntity}s`.toLowerCase() +
              '/findone?where=' +
              JSON.stringify({ NAME: { eq: entityId } });
          }
          console.log(`Contructed request URL: ${requestEntityUrl}`);

          // Get the entity field for the given entity request.
          let entityDisplayName = await this.getEntityInformation(
            requestEntityUrl,
            requestEntityField
          );
          if (entityDisplayName) {
            console.log(
              `${entity} - Retrieved entity name: ${entityDisplayName}`
            );

            // Update the state with the new entity information.
            updatedState.currentHierarchy.splice(hierarchyCount, 1, {
              ...updatedState.currentHierarchy[hierarchyCount],

              id: entityId,
              displayName: entityDisplayName,
              url: link,
            });
            console.log(`Updated state for ${entity}:`, updatedState);
          } else {
            console.log('Did not get entity display name: ', entityDisplayName);
          }
        } else {
          console.log(
            `${entity} is same as before with ID ${entityId}, no need to request again.`
          );
        }
        // Ensure that we store the last path in a separate field and that it is not the entity name.
      } else if (index === pathLength - 1) {
        if (entity !== updatedState.base.entityName) {
          console.log(`Processing last item in path: ${entity}`);
          // Update the state to say that e.g. if path is /browse/investigation/,
          // then display name would be just Browse > *Investigations*.
          // e.g. Browse > Investigations > *Proposal 1* (Datasets) etc.
          updatedState = {
            ...updatedState,
            last: {
              displayName:
                `${entity}`.charAt(0).toUpperCase() + `${entity}s`.slice(1),
            },
          };
          console.log(`Updated state for ${entity}:`, updatedState);
        } else {
          // If the base is the current top directory, then update the last field.
          updatedState = {
            ...updatedState,
            base: {
              ...updatedState.base,

              isLast: true,
            },
          };
          console.log('Updated the base as being last in the path.');
        }
      }

      // Increment the hierarchy count for the next entity (if there is one).
      hierarchyCount++;
    }

    // Update the final state.
    this.setState(updatedState, () =>
      console.log(`Final state (${num}): `, this.state)
    );
    this.isBreadcrumbUpdated = true;
  };

  private getEntityInformation = async (
    requestEntityUrl: string,
    entityField: string
  ): Promise<string> => {
    let entityName = '';

    console.log('API Url: ', this.props.apiUrl);
    const requestUrl = `${this.props.apiUrl}/${requestEntityUrl}`;
    console.log('Final request url: ', requestUrl);

    // Make a GET request to the specified URL.
    entityName = await axios
      .get(requestUrl, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        console.log(`${requestEntityUrl} - Response Data:`, response.data);

        // Return the property in the data received.
        console.log(
          `${requestEntityUrl} - Entity ${entityField} : ${response.data[entityField]}`
        );
        return response.data[entityField];
      })
      .catch(error => {
        console.log(error);
        return '';
      });

    return entityName;
  };

  public render(): React.ReactElement {
    console.log('Rendering FULL Breadcrumb state: ', this.state);

    // Filter to ensure the breadcrumbs are only for this path
    // (in the event the user moved back and changed location using the breadcrumb).
    const breadcrumbState = {
      ...this.state,
      currentHierarchy: this.state.currentHierarchy.filter(
        (value: Breadcrumb, index: number) => {
          // Return the breadcrumbs with pathnames in our current location and with the related IDs.
          // The index of the ID related to the path name is derived from the path name index add one
          // to give the ID generally and then shifted by two as this occurs every two elements.
          return (
            this.currentPathnames.includes(value.pathName) &&
            this.currentPathnames[(index + 1) * 2] === value.id
          );
        }
      ),
    };
    console.log('Rendering FILTERED breadcrumbs: ', breadcrumbState);

    const hierarchyKeys = Object.keys(breadcrumbState.currentHierarchy);
    console.log('Rendering hierarchy keys: ', hierarchyKeys);
    console.log('Keys length: ', hierarchyKeys.length);

    return (
      <div>
        <Paper elevation={0}>
          <Route>
            {/* // Ensure that there is a path to render, otherwise do not show any breadcrumb. */}
            {this.currentPathnames.length > 0 ? (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="Breadcrumb"
              >
                {/* // Return the base entity as a link. */}
                {breadcrumbState.base.isLast ? (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.base.displayName}
                    ariaLabel="Breadcrumb-base"
                  />
                ) : (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.base.displayName}
                    ariaLabel="Breadcrumb-base"
                    url={breadcrumbState.base.url}
                  />
                )}

                {/* // Add in the hierarchy breadcrumbs. */}
                {hierarchyKeys.map((level: string, index: number) => {
                  const breadcrumbInfo =
                    breadcrumbState.currentHierarchy[index];
                  console.log(
                    `Creating breadcrumb for ${level}: ${breadcrumbInfo.url}, ${breadcrumbInfo.displayName} (ID: ${breadcrumbInfo.id})`
                  );

                  // Return the correct type of breadcrumb with the entity name
                  // depending on if it is at the end of the hierarchy or not.
                  // const createdBreadcrumb =
                  return index + 1 === hierarchyKeys.length ? (
                    <StyledBreadcrumb
                      displayName={breadcrumbInfo.displayName}
                      ariaLabel={`Breadcrumb-hierarchy-${index + 1}`}
                    />
                  ) : (
                    <StyledBreadcrumb
                      displayName={breadcrumbInfo.displayName}
                      ariaLabel={`Breadcrumb-hierarchy-${index + 1}`}
                      url={breadcrumbInfo.url}
                    />
                  );
                })}

                {/* // Render the last breadcrumb information; this is the current table view. */}
                {breadcrumbState.last.displayName !== 'N/A' ? (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.last.displayName}
                    ariaLabel="Breadcrumb-last"
                    isLast={true}
                  />
                ) : null}
              </Breadcrumbs>
            ) : null}
          </Route>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: StateType): BreadcrumbProps => ({
  apiUrl: state.dgtable.urls.apiUrl,
  location: state.router.location.pathname,
});

export default connect(mapStateToProps)(PageBreadcrumbs);
