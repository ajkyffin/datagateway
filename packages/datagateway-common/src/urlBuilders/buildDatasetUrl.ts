import type { Dataset } from '../app.types';
import buildInvestigationUrl from './buildInvestigationUrl';

/**
 * Given a {@link Dataset} object, constructs a URL to the {@link Dataset}. The {@link Dataset.investigation} has to be present,
 * and the {@link Investigation} object has to have the {@link Investigation.investigationInstruments} field.
 *
 * @returns The URL to the dataset table, or `null` if the URL cannot be constructed due to missing info.
 */
function buildDatasetUrl({
  facilityName,
  dataset,
  showLanding,
}: {
  dataset: Dataset;
  facilityName: string;
  showLanding: boolean;
}): string | null {
  const investigation = dataset?.investigation;
  if (!dataset || !investigation) return null;

  const prefixUrl = buildInvestigationUrl({
    facilityName,
    investigation,
    showLanding: false,
  });
  if (!prefixUrl) return null;

  return `${prefixUrl}/${dataset.id}${showLanding ? '' : '/datafile'}`;
}

export default buildDatasetUrl;
