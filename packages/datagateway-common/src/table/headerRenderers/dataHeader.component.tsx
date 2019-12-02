import React from 'react';
import { Order } from '../../app.types';
import { TableHeaderProps } from 'react-virtualized';
import { TableCell, TableSortLabel } from '@material-ui/core';
import { DragIndicator } from '@material-ui/icons';
import Draggable from 'react-draggable';

const DataHeader = (
  props: TableHeaderProps & {
    className: string;
    filterComponent?: React.ReactElement;
    sort: { [column: string]: Order };
    onSort: (column: string, order: Order | null) => void;
    resizeColumn: (deltaX: number) => void;
  }
): React.ReactElement => {
  const {
    className,
    dataKey,
    filterComponent,
    sort,
    onSort,
    label,
    disableSort,
    resizeColumn,
  } = props;

  const currSortDirection = sort[dataKey];
  let nextSortDirection: Order | null = null;
  switch (currSortDirection) {
    case 'asc':
      nextSortDirection = 'desc';
      break;
    case 'desc':
      nextSortDirection = null;
      break;
    case undefined:
      nextSortDirection = 'asc';
  }

  const inner = !disableSort ? (
    <TableSortLabel
      active={dataKey in sort}
      direction={currSortDirection}
      onClick={() => onSort(dataKey, nextSortDirection)}
      style={{ flex: 'auto' }}
    >
      {label}
    </TableSortLabel>
  ) : (
    label
  );

  return (
    <TableCell
      size="small"
      component="div"
      className={className}
      variant="head"
      sortDirection={currSortDirection}
    >
      <div
        style={{
          display: 'flex',
        }}
      >
        {inner}
        <Draggable
          axis="none"
          onDrag={(event, { deltaX }) => resizeColumn(deltaX)}
        >
          <DragIndicator
            fontSize="small"
            style={{
              cursor: 'col-resize',
            }}
          />
        </Draggable>
      </div>
      {filterComponent}
    </TableCell>
  );
};

export default DataHeader;
