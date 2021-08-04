import { Link } from '@material-ui/core';
import { Title, Link as LinkIcon } from '@material-ui/icons';
import {
  CardViewQuery,
  Instrument,
  parseSearchToQuery,
  tableLink,
  useInstrumentCount,
  useInstrumentsPaginated,
  usePushFilters,
  usePushPage,
  usePushResults,
  usePushSort,
  useTextFilter,
} from 'datagateway-common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import InstrumentDetailsPanel from '../../detailsPanels/isis/instrumentDetailsPanel.component';

interface ISISInstrumentsCVProps {
  studyHierarchy: boolean;
}

const ISISInstrumentsCardView = (
  props: ISISInstrumentsCVProps
): React.ReactElement => {
  const { studyHierarchy } = props;
  const [t] = useTranslation();
  const location = useLocation();

  const { filters, view, sort, page, results } = React.useMemo(
    () => parseSearchToQuery(location.search),
    [location.search]
  );

  const textFilter = useTextFilter(filters);
  const pushSort = usePushSort();
  const pushFilters = usePushFilters();
  const pushPage = usePushPage();
  const pushResults = usePushResults();

  const {
    data: totalDataCount,
    isLoading: countLoading,
  } = useInstrumentCount();
  const { isLoading: dataLoading, data } = useInstrumentsPaginated();

  const title = React.useMemo(() => {
    const pathRoot = studyHierarchy ? 'browseStudyHierarchy' : 'browse';
    const instrumentChild = studyHierarchy ? 'study' : 'facilityCycle';
    return {
      label: t('instruments.name'),
      dataKey: 'fullName',
      content: (instrument: Instrument) =>
        tableLink(
          `/${pathRoot}/instrument/${instrument.id}/${instrumentChild}`,
          instrument.fullName || instrument.name,
          view
        ),
      filterComponent: textFilter,
    };
  }, [t, textFilter, view, studyHierarchy]);

  const description = React.useMemo(
    () => ({
      label: t('instruments.description'),
      dataKey: 'description',
      filterComponent: textFilter,
    }),
    [t, textFilter]
  );

  const information = React.useMemo(
    () => [
      {
        icon: Title,
        label: t('instruments.type'),
        dataKey: 'type',
        filterComponent: textFilter,
      },
      {
        icon: LinkIcon,
        label: t('instruments.url'),
        dataKey: 'url',
        content: function Content(instrument: Instrument) {
          return <Link href={instrument.url}>{instrument.url}</Link>;
        },
        filterComponent: textFilter,
      },
    ],
    [t, textFilter]
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
      moreInformation={(instrument: Instrument) => (
        <InstrumentDetailsPanel rowData={instrument} />
      )}
    />
  );
};

export default ISISInstrumentsCardView;
