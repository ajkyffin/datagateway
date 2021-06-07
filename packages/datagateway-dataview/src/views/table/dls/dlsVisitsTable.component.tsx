import {
  DateColumnFilter,
  DateFilter,
  Entity,
  fetchInvestigationCount,
  fetchInvestigationDetails,
  fetchInvestigations,
  fetchInvestigationSize,
  Filter,
  Investigation,
  Order,
  pushPageFilter,
  pushPageSort,
  Table,
  tableLink,
  TextColumnFilter,
  TextFilter,
  readURLQuery,
} from 'datagateway-common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { IndexRange, TableCellProps } from 'react-virtualized';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from '../../../state/app.types';
import VisitDetailsPanel from '../../detailsPanels/dls/visitDetailsPanel.component';
import { RouterLocation } from 'connected-react-router';

import FingerprintIcon from '@material-ui/icons/Fingerprint';
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';

interface DLSVisitsTableProps {
  proposalName: string;
}

interface DLSVisitsTableStoreProps {
  location: RouterLocation<unknown>;
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
  selectAllSetting: boolean;
}

interface DLSVisitsTableDispatchProps {
  pushSort: (sort: string, order: Order | null) => Promise<void>;

  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  fetchData: (proposalName: string, offsetParams: IndexRange) => Promise<void>;
  fetchCount: (proposalName: string) => Promise<void>;

  fetchDetails: (investigationId: number) => Promise<void>;
  fetchSize: (investigationId: number) => Promise<void>;
}

type DLSVisitsTableCombinedProps = DLSVisitsTableProps &
  DLSVisitsTableStoreProps &
  DLSVisitsTableDispatchProps;

const DLSVisitsTable = (
  props: DLSVisitsTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    pushSort,
    pushFilters,
    location,
    proposalName,
    loading,
    selectAllSetting,
  } = props;

  const [t] = useTranslation();

  const textFilter = (label: string, dataKey: string): React.ReactElement => (
    <TextColumnFilter
      label={label}
      value={filters[dataKey] as TextFilter}
      onChange={(value: { value?: string | number; type: string } | null) =>
        pushFilters(dataKey, value ? value : null)
      }
    />
  );

  const dateFilter = (label: string, dataKey: string): React.ReactElement => (
    <DateColumnFilter
      label={label}
      value={filters[dataKey] as DateFilter}
      onChange={(value: { startDate?: string; endDate?: string } | null) =>
        pushFilters(dataKey, value ? value : null)
      }
    />
  );

  const { filters, view, sort } = React.useMemo(() => readURLQuery(location), [
    location,
  ]);

  React.useEffect(() => {
    fetchCount(proposalName);
  }, [fetchCount, location.query.filters, proposalName]);

  React.useEffect(() => {
    fetchData(proposalName, { startIndex: 0, stopIndex: 49 });
  }, [fetchData, location.query.sort, location.query.filters, proposalName]);

  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={(params) => fetchData(proposalName, params)}
      totalRowCount={totalDataCount}
      sort={sort}
      onSort={pushSort}
      disableSelectAll={!selectAllSetting}
      detailsPanel={({ rowData, detailsPanelResize }) => {
        return (
          <VisitDetailsPanel
            rowData={rowData}
            detailsPanelResize={detailsPanelResize}
            fetchDetails={props.fetchDetails}
            fetchSize={props.fetchSize}
          />
        );
      }}
      columns={[
        {
          icon: <FingerprintIcon />,
          label: t('investigations.visit_id'),
          dataKey: 'VISIT_ID',
          cellContentRenderer: (cellProps: TableCellProps) => {
            const investigationData = cellProps.rowData as Investigation;
            return tableLink(
              `/browse/proposal/${proposalName}/investigation/${investigationData.ID}/dataset`,
              investigationData.VISIT_ID,
              view
            );
          },
          filterComponent: textFilter,
        },
        {
          icon: <ConfirmationNumberIcon />,
          label: t('investigations.dataset_count'),
          dataKey: 'DATASET_COUNT',
          disableSort: true,
        },
        {
          icon: <AssessmentIcon />,
          label: t('investigations.instrument'),
          dataKey: 'INVESTIGATIONINSTRUMENT.INSTRUMENT.NAME',
          cellContentRenderer: (cellProps: TableCellProps) => {
            const investigationData = cellProps.rowData as Investigation;
            if (
              investigationData.INVESTIGATIONINSTRUMENT &&
              investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT
            ) {
              return investigationData.INVESTIGATIONINSTRUMENT[0].INSTRUMENT
                .NAME;
            } else {
              return '';
            }
          },
          filterComponent: textFilter,
        },
        {
          icon: <CalendarTodayIcon />,
          label: t('investigations.start_date'),
          dataKey: 'STARTDATE',
          filterComponent: dateFilter,
          disableHeaderWrap: true,
        },
        {
          icon: <CalendarTodayIcon />,
          label: t('investigations.end_date'),
          dataKey: 'ENDDATE',
          filterComponent: dateFilter,
          disableHeaderWrap: true,
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): DLSVisitsTableDispatchProps => ({
  pushSort: (sort: string, order: Order | null) =>
    dispatch(pushPageSort(sort, order)),

  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  fetchData: (proposalName: string, offsetParams: IndexRange) =>
    dispatch(
      fetchInvestigations({
        offsetParams,
        additionalFilters: [
          {
            filterType: 'where',
            filterValue: JSON.stringify({ NAME: { eq: proposalName } }),
          },
          {
            filterType: 'include',
            filterValue: JSON.stringify({
              INVESTIGATIONINSTRUMENT: 'INSTRUMENT',
            }),
          },
        ],
        getDatasetCount: true,
      })
    ),
  fetchCount: (proposalName: string) =>
    dispatch(
      fetchInvestigationCount([
        {
          filterType: 'where',
          filterValue: JSON.stringify({ NAME: { eq: proposalName } }),
        },
      ])
    ),

  fetchDetails: (investigationId: number) =>
    dispatch(fetchInvestigationDetails(investigationId)),
  fetchSize: (investigationId: number) =>
    dispatch(fetchInvestigationSize(investigationId)),
});

const mapStateToProps = (state: StateType): DLSVisitsTableStoreProps => {
  return {
    location: state.router.location,
    data: state.dgcommon.data,
    totalDataCount: state.dgcommon.totalDataCount,
    loading: state.dgcommon.loading,
    error: state.dgcommon.error,
    selectAllSetting: state.dgdataview.selectAllSetting,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DLSVisitsTable);
