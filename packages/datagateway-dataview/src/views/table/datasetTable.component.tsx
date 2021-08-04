import React from 'react';
import TitleIcon from '@material-ui/icons/Title';
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import {
  Typography,
  Grid,
  createStyles,
  makeStyles,
  Theme,
  Divider,
} from '@material-ui/core';
import {
  Table,
  datasetLink,
  Dataset,
  useDatasetCount,
  useDatasetsInfinite,
  parseSearchToQuery,
  useTextFilter,
  useDateFilter,
  ColumnType,
  usePushSort,
  useIds,
  useCart,
  useAddToCart,
  useRemoveFromCart,
  DetailsPanelProps,
  useDatasetsDatafileCount,
} from 'datagateway-common';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { StateType } from '../../state/app.types';
import { TableCellProps, IndexRange } from 'react-virtualized';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    divider: {
      marginBottom: theme.spacing(2),
    },
  })
);

interface DatasetTableProps {
  investigationId: string;
}

const DatasetTable = (props: DatasetTableProps): React.ReactElement => {
  const { investigationId } = props;

  const [t] = useTranslation();

  const location = useLocation();

  const selectAllSetting = useSelector(
    (state: StateType) => state.dgdataview.selectAllSetting
  );

  const view = useSelector((state: StateType) => state.dgcommon.query.view);

  const { filters, sort } = React.useMemo(
    () => parseSearchToQuery(location.search),
    [location.search]
  );

  const textFilter = useTextFilter(filters);
  const dateFilter = useDateFilter(filters);
  const pushSort = usePushSort();

  const { data: allIds } = useIds('dataset', [
    {
      filterType: 'where',
      filterValue: JSON.stringify({
        'investigation.id': { eq: parseInt(investigationId) },
      }),
    },
  ]);
  const { data: cartItems } = useCart();
  const { mutate: addToCart, isLoading: addToCartLoading } = useAddToCart(
    'dataset'
  );
  const {
    mutate: removeFromCart,
    isLoading: removeFromCartLoading,
  } = useRemoveFromCart('dataset');

  const { data: totalDataCount } = useDatasetCount([
    {
      filterType: 'where',
      filterValue: JSON.stringify({
        'investigation.id': { eq: investigationId },
      }),
    },
    {
      filterType: 'include',
      filterValue: JSON.stringify('investigation'),
    },
  ]);

  const { fetchNextPage, data } = useDatasetsInfinite([
    {
      filterType: 'where',
      filterValue: JSON.stringify({
        'investigation.id': { eq: investigationId },
      }),
    },
    {
      filterType: 'include',
      filterValue: JSON.stringify('investigation'),
    },
  ]);

  const loadMoreRows = React.useCallback(
    (offsetParams: IndexRange) => fetchNextPage({ pageParam: offsetParams }),
    [fetchNextPage]
  );

  const datafileCountQueries = useDatasetsDatafileCount(data);

  const aggregatedData: Dataset[] = React.useMemo(
    () => data?.pages.flat() ?? [],
    [data]
  );

  const columns: ColumnType[] = React.useMemo(
    () => [
      {
        icon: TitleIcon,
        label: t('datasets.name'),
        dataKey: 'name',
        cellContentRenderer: (cellProps) => {
          const datasetData = cellProps.rowData as Dataset;
          return datasetLink(
            investigationId,
            datasetData.id,
            datasetData.name,
            view
          );
        },
        filterComponent: textFilter,
      },
      {
        icon: ConfirmationNumberIcon,
        label: t('datasets.datafile_count'),
        dataKey: 'datafileCount',
        cellContentRenderer: (cellProps: TableCellProps): number | string => {
          const countQuery = datafileCountQueries[cellProps.rowIndex];
          if (countQuery?.isFetching) {
            return 'Calculating...';
          } else {
            return countQuery?.data ?? 'Unknown';
          }
        },
        disableSort: true,
      },
      {
        icon: CalendarTodayIcon,
        label: t('datasets.create_time'),
        dataKey: 'createTime',
        filterComponent: dateFilter,
      },
      {
        icon: CalendarTodayIcon,
        label: t('datasets.modified_time'),
        dataKey: 'modTime',
        filterComponent: dateFilter,
      },
    ],
    [t, textFilter, dateFilter, investigationId, view, datafileCountQueries]
  );

  const selectedRows = React.useMemo(
    () =>
      cartItems
        ?.filter(
          (cartItem) =>
            allIds &&
            cartItem.entityType === 'dataset' &&
            allIds.includes(cartItem.entityId)
        )
        .map((cartItem) => cartItem.entityId),
    [cartItems, allIds]
  );

  const DatasetDetailsPanel = (
    props: DetailsPanelProps
  ): React.ReactElement => {
    const classes = useStyles();
    const [t] = useTranslation();
    const datasetData = props.rowData as Dataset;
    return (
      <Grid
        id="details-panel"
        container
        className={classes.root}
        direction="column"
      >
        <Grid item xs>
          <Typography variant="h6">
            <b>{datasetData.name}</b>
          </Typography>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs>
          <Typography variant="overline">
            {t('datasets.details.description')}
          </Typography>
          <Typography>
            <b>{datasetData.name}</b>
          </Typography>
        </Grid>
      </Grid>
    );
  };

  return (
    <Table
      loading={addToCartLoading || removeFromCartLoading}
      data={aggregatedData}
      loadMoreRows={loadMoreRows}
      totalRowCount={totalDataCount}
      sort={sort}
      onSort={pushSort}
      selectedRows={selectedRows}
      allIds={allIds}
      onCheck={addToCart}
      onUncheck={removeFromCart}
      disableSelectAll={!selectAllSetting}
      detailsPanel={DatasetDetailsPanel}
      columns={columns}
    />
  );
};

export default DatasetTable;
