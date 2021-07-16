import {
  CalendarToday,
  ConfirmationNumber,
  Fingerprint,
  Public,
} from '@material-ui/icons';
import {
  CardViewQuery,
  Investigation,
  investigationLink,
  parseSearchToQuery,
  useDateFilter,
  useFilter,
  useInvestigationCount,
  useInvestigationsPaginated,
  usePushFilters,
  usePushPage,
  usePushResults,
  usePushSort,
  useTextFilter,
} from 'datagateway-common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import AddToCartButton from '../addToCartButton.component';

const InvestigationCardView = (): React.ReactElement => {
  const [t] = useTranslation();
  const location = useLocation();

  const { filters, view, sort, page, results } = React.useMemo(
    () => parseSearchToQuery(location.search),
    [location.search]
  );

  const textFilter = useTextFilter(filters);
  const dateFilter = useDateFilter(filters);
  const pushSort = usePushSort();
  const pushFilters = usePushFilters();
  const pushPage = usePushPage();
  const pushResults = usePushResults();

  const {
    data: totalDataCount,
    isLoading: countLoading,
  } = useInvestigationCount();
  const { isLoading: dataLoading, data } = useInvestigationsPaginated();
  const { data: typeIds } = useFilter('investigation', 'type.id');
  const { data: facilityIds } = useFilter('investigation', 'facility.id');

  const title = React.useMemo(
    () => ({
      // Provide label for filter component.
      label: t('investigations.title'),
      // Provide both the dataKey (for tooltip) and content to render.
      dataKey: 'title',
      content: (investigation: Investigation) => {
        return investigationLink(investigation.id, investigation.title, view);
      },
      filterComponent: textFilter,
    }),
    [t, textFilter, view]
  );

  const description = React.useMemo(
    () => ({
      label: t('investigations.details.summary'),
      dataKey: 'summary',
      filterComponent: textFilter,
    }),
    [t, textFilter]
  );

  const information = React.useMemo(
    () => [
      {
        icon: <Public />,
        label: t('investigations.doi'),
        dataKey: 'doi',
        filterComponent: textFilter,
      },
      {
        icon: <Fingerprint />,
        label: t('investigations.visit_id'),
        dataKey: 'visitId',
        filterComponent: textFilter,
      },
      {
        icon: <Fingerprint />,
        label: t('investigations.details.rb_number'),
        dataKey: 'rbNumber',
        filterComponent: textFilter,
        disableSort: true,
      },
      {
        icon: <ConfirmationNumber />,
        label: t('investigations.dataset_count'),
        dataKey: 'datasetCount',
        filterComponent: textFilter,
        disableSort: true,
      },
      {
        icon: <CalendarToday />,
        label: t('investigations.details.start_date'),
        dataKey: 'startDate',
        filterComponent: dateFilter,
      },
      {
        icon: <CalendarToday />,
        label: t('investigations.details.end_date'),
        dataKey: 'endDate',
        filterComponent: dateFilter,
      },
    ],
    [dateFilter, t, textFilter]
  );

  const buttons = React.useMemo(
    () => [
      (investigation: Investigation) => (
        <AddToCartButton
          entityType="investigation"
          allIds={data?.map((investigation) => investigation.id) ?? []}
          entityId={investigation.id}
        />
      ),
    ],
    [data]
  );

  const customFilters = React.useMemo(
    () => [
      {
        label: t('investigations.type.id'),
        dataKey: 'type.id',
        filterItems: typeIds ?? [],
      },
      {
        label: t('investigations.facility.id'),
        dataKey: 'facility.id',
        filterItems: facilityIds ?? [],
      },
    ],
    [facilityIds, t, typeIds]
  );

  return (
    <CardViewQuery
      data={data ?? []}
      totalDataCount={totalDataCount ?? 0}
      onPageChange={pushPage}
      onFilter={pushFilters}
      onSort={pushSort}
      onResultsChange={pushResults}
      loadedData={!dataLoading}
      loadedCount={!countLoading}
      filters={filters}
      sort={sort}
      page={page}
      results={results}
      title={title}
      description={description}
      information={information}
      buttons={buttons}
      // If was a specific dataKey on the custom filter request,
      // use that over the filterKey here.
      customFilters={customFilters}
    />
  );
};

export default InvestigationCardView;
