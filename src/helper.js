import { insertAndShift, clazz } from '@groupher/editor-utils';
import { splitEvery, flatten, insert, remove } from 'ramda';

/**
 * @typedef {Object} TableData
 * @description Table Tool's  data format
 * @property {number} columnCount — column count
 * @property {[CellItem]} items - array of cell item
 */

/**
 * @typedef {Object} CellItem
 * @description cell item
 * @property {string} text - inner text in cell (td)
 * @property {string} align — left | center | right
 * @property {boolean} isHeader
 * @property {boolean} isStripe
 */

/**
 * map index for data.items, fill empty cells if needed
 *
 * @param {TableData} data
 * @return {TableData}
 */
export const formatData = (data) => {
  const { columnCount, items } = data;
  const missingCount =
    columnCount * Math.ceil(items.length / columnCount) - items.length;

  let newItems = data.items;

  if (missingCount > 0) {
    for (let i = 0; i < missingCount; i++) {
      newItems.push({ text: '' });
    }
  }

  return {
    ...data,
    items: newItems.map((item, index) => ({
      ...item,
      align: !item.align || item.align === '' ? 'left' : item.align,
      isStripe: !!item.isStripe,
      index
    }))
  };
};

/**
 * add header to table tools data
 *
 * @param {TableData} data
 * @return {TableData}
 */
export const addHeader = (data) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const holderRow = _getHolderCells(columnCount);
  const holderRowFormatted = holderRow.map((item, index) => ({
    ...item,
    // keep the align with the same column
    // 保持和同列相同的对齐方式
    align: items[index + columnCount].align,
    isHeader: true
  }));

  const rowsAdded = insert(0, holderRowFormatted, rows);

  return {
    ...data,
    withHeader: true,
    items: flatten(rowsAdded)
  };
};

/**
 * remove header to table tools data
 *
 * @param {TableData} data
 * @return {TableData}
 */
export const deleteHeader = (data) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsRemoved = remove(0, 1, rows);

  return {
    ...data,
    withHeader: false,
    items: flatten(rowsRemoved)
  };
};

/**
 * add zebra sign in table tools data
 *
 * @param {TableData} data
 * @return {TableData}
 */
export const addZebraStripe = (data) => {
  const { columnCount, withHeader, items } = data;

  const rows = splitEvery(columnCount, items);

  const rowFormatted = rows.map((rowItem, index) => {
    const stripeIndex = withHeader ? index + 1 : index;

    let isStripeRow = stripeIndex % 2 !== 0;

    // if has table header, do not stripe it
    if (withHeader && index === 0) {
      isStripeRow = false;
    }
    rowItem.forEach((item) => (item.isStripe = isStripeRow));

    return [ ...rowItem ];
  });

  return {
    ...data,
    withStripe: true,
    items: flatten(rowFormatted)
  };
};

/**
 * delete zebra sign in table tools data
 *
 * @param {TableData} data
 * @return {TableData}
 */
export const deleteZebraStripe = (data) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);

  const rowFormatted = rows.map((rowItem, index) => {
    rowItem.forEach((item) => (item.isStripe = false));
    return [ ...rowItem ];
  });

  return {
    ...data,
    withStripe: false,
    items: flatten(rowFormatted)
  };
};

/**
 * add a column to current data
 * @param {TableData} data
 * @param {number} columnIndex
 * @return {TableData}
 */
export const addColumn = (data, columnIndex) => {
  const { columnCount } = data;

  const columnTanks = _buildColumnTanks(data);
  const rowLength = columnTanks[0].length;

  const columnArrayAdded = insert(
    columnIndex + 1,
    _getHolderCells(rowLength),
    columnTanks
  );

  const regularRows = _covertToRegularRows(columnArrayAdded, columnTanks);

  return {
    ...data,
    columnCount: columnCount + 1,
    items: regularRows
  };
};

/**
 * add a column to current data
 * @param {TableData} data
 * @param {number} columnIndex
 * @return {TableData}
 */
export const deleteColumn = (data, columnIndex) => {
  const { columnCount } = data;

  const columnTanks = _buildColumnTanks(data);
  const columnArrayRemoved = remove(columnIndex, 1, columnTanks);
  const regularRows = _covertToRegularRows(columnArrayRemoved, columnTanks);

  return {
    ...data,
    columnCount: columnCount - 1,
    items: regularRows
  };
};

/**
 * add a row to current data
 * @param {TableData} data
 * @param {number} rowIndex
 * @return {TableData}
 */
export const addRow = (data, rowIndex) => {
  const { columnCount, withStripe, withHeader, items } = data;

  const rows = splitEvery(columnCount, items);
  let rowHolder = _getHolderCells(columnCount);

  if (withStripe && rowIndex + 1 > 1) {
    const stripeIndex = withHeader ? rowIndex : rowIndex + 1;

    rowHolder = rowHolder.map((item) => {
      return {
        ...item,
        isStripe: stripeIndex % 2 !== 0
      };
    });
  }

  const rowsAdded = insert(rowIndex + 1, rowHolder, rows);

  return {
    ...data,
    items: flatten(rowsAdded)
  };
};

/**
 * delete a row
 * @param {TableData} data
 * @param {number} rowIndex
 * @return {TableData}
 */
export const deleteRow = (data, rowIndex) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsRemoved = remove(rowIndex, 1, rows);

  const rowsData = {
    ...data,
    items: flatten(rowsRemoved)
  };

  return addZebraStripe(rowsData);
};

/**
 * @param {TableData} data
 * @param {number} columnIndex
 * @param {string} direction - left | right
 * @return {TableData}
 */
export const moveColumn = (data, columnIndex, direction = 'left') => {
  const columnTanks = _buildColumnTanks(data);

  let swapColumnIndex;

  if (direction === 'left') {
    swapColumnIndex =
      columnIndex - 1 < 0 ? columnTanks.length - 1 : columnIndex - 1;
  } else {
    swapColumnIndex =
      columnIndex + 1 > columnTanks.length - 1 ? 0 : columnIndex + 1;
  }

  insertAndShift(columnTanks, columnIndex, swapColumnIndex);

  const regularRows = _covertToRegularRows(columnTanks, columnTanks);

  return {
    ...data,
    items: regularRows
  };
};

/**
 * @param {TableData} data
 * @param {number} rowIndex
 * @param {string} direction - up | down
 * @return {TableData}
 */
export const moveRow = (data, rowIndex, direction = 'up') => {
  const { columnCount, items, withHeader } = data;
  const rows = splitEvery(columnCount, items);

  let swapRowIndex;

  if (direction === 'up') {
    swapRowIndex = rowIndex - 1 < 0 ? rows.length - 1 : rowIndex - 1;

    if (withHeader && swapRowIndex === 0) {
      swapRowIndex = rows.length - 1;
    }
  } else {
    swapRowIndex = rowIndex + 1 > rows.length - 1 ? 0 : rowIndex + 1;

    if (withHeader && swapRowIndex === 0) {
      swapRowIndex = 1;
    }
  }

  insertAndShift(rows, rowIndex, swapRowIndex);

  const rowsData = {
    ...data,
    items: flatten(rows)
  };

  // reset stripe
  return addZebraStripe(rowsData);
};

/**
 * judge column by given index
 * @param {Number} index
 * @param {TableData} data
 * @return {Number}
 */
export const whichColumn = (index, data) => {
  const { columnCount } = data;

  return parseInt(index) % columnCount;
};

/**
 * judge row by given index
 * @param {Number} index
 * @param {TableData} data
 * @return {Number}
 */
export const whichRow = (index, data) => {
  const { columnCount } = data;

  return Math.floor(parseInt(index) / columnCount);
};

/**
 * setAlign to cells element and data
 * @param {[HTMLElement]} cellsEls
 * @param {String} align - left | center | right
 */
export const setAlignClass = (cellsEls, align) => {
  const alignLeftClass = 'cdx-table__cell_align_left';
  const alignCenterClass = 'cdx-table__cell_align_center';
  const alignRightClass = 'cdx-table__cell_align_right';

  for (let i = 0; i < cellsEls.length; i++) {
    const el = cellsEls[i];

    clazz.remove(el, alignLeftClass);
    clazz.remove(el, alignCenterClass);
    clazz.remove(el, alignRightClass);

    clazz.add(el, `cdx-table__cell_align_${align}`);
  }
};

/**
 * setAlign to data.items
 * @param {Number} columnIndex
 * @param {String} align - left | center | right
 * @param {TableData} data
 */
export const setAlignData = (columnIndex, align, data) => {
  const columnTanks = _buildColumnTanks(data);

  for (let i = 0; i < columnTanks[columnIndex].length; i++) {
    const el = columnTanks[columnIndex][i];

    el.align = align;
  }

  const regularRows = _covertToRegularRows(columnTanks, columnTanks);

  return {
    ...data,
    items: regularRows
  };
};

/**
 * get holder cells holder
 * @param {Number} count
 * @returns {[CellItem]}
 * @private
 */
const _getHolderCells = (count) => {
  const ret = [];

  for (let i = 0; i < count; i++) {
    ret.push({ text: '' });
  }

  return ret;
};

/**
 * build tanks structure for each column
 *
 * @param {TableData} data
 * @returns
 * @private
 */
const _buildColumnTanks = (data) => {
  const { columnCount, items } = data;

  const columnTanks = [];

  for (let i = 0; i < columnCount; i++) {
    columnTanks.push([]);
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const itemColumnIndex = whichColumn(item.index, data);

    columnTanks[itemColumnIndex].push(item);
  }

  return columnTanks;
};

/**
 * covert nested tank-structure columns to regular rows
 * @param {[[CellItem]]} columnArray
 * @param {[[CellItem]]} tanksColumnArray
 * @returns
 * @private
 */
const _covertToRegularRows = (columnArray, tanksColumnArray) => {
  const rowLength = tanksColumnArray[0].length;
  const regularRows = [];

  for (let i = 0; i < rowLength; i++) {
    for (let j = 0; j < columnArray.length; j++) {
      regularRows.push(columnArray[j][i]);
    }
  }

  return regularRows;
};

/**
 * add resize ability to table column
 * see: https://www.brainbell.com/javascript/making-resizable-table-js.html
 *
 * @param {HTMLElement} table
 * @returns
 */
export const resizableTable = (table) => {
  /**
   * create the drag handler
   *
   * @param {Number} height
   * @returns
   */
  const createDragDiv = (height) => {
    const div = document.createElement('div');

    div.style.top = 0;
    div.style.right = 0;
    div.style.width = '8px';
    div.style.position = 'absolute';
    div.style.cursor = 'col-resize';
    div.style.userSelect = 'none';
    div.style.height = height + 'px';
    return div;
  };

  /**
   * paddingDiff
   *
   * @param {*} col
   * @returns
   */
  const paddingDiff = (col) => {
    if (getStyleVal(col, 'box-sizing') == 'border-box') {
      return 0;
    }

    var padLeft = getStyleVal(col, 'padding-left');
    var padRight = getStyleVal(col, 'padding-right');

    return parseInt(padLeft) + parseInt(padRight);
  };

  /**
   * set listeners
   *
   * @param {HTMLElement} div
   */
  const setListeners = (div) => {
    let pageX, curCol, nxtCol, curColWidth, nxtColWidth;

    div.style.zIndex = 1;

    div.addEventListener('mousedown', function (e) {
      curCol = e.target.parentElement;
      nxtCol = curCol.nextElementSibling;
      pageX = e.pageX;

      var padding = paddingDiff(curCol);

      curColWidth = curCol.offsetWidth - padding;
      if (nxtCol) nxtColWidth = nxtCol.offsetWidth - padding;
    });

    div.addEventListener('mouseover', function (e) {
      // if the cell has multi lines, the height should be re-calc
      const tableHeight = table.offsetHeight - 2;

      div.style.height = tableHeight + 'px';

      e.target.style.borderRight = '2px solid';
      e.target.style.borderRightColor = '#DBDBE2';
    });

    div.addEventListener('mouseout', function (e) {
      e.target.style.borderRight = '';
    });

    document.addEventListener('mousemove', function (e) {
      if (curCol) {
        const diffX = e.pageX - pageX;

        if (nxtCol) nxtCol.style.width = nxtColWidth - diffX + 'px';

        curCol.style.width = curColWidth + diffX + 'px';
      }
    });

    document.addEventListener('mouseup', function (e) {
      curCol = undefined;
      nxtCol = undefined;
      pageX = undefined;
      nxtColWidth = undefined;
      curColWidth = undefined;
    });
  };

  /**
   * get style val
   *
   * @param {*} elm
   * @param {*} css
   * @returns
   */
  const getStyleVal = (elm, css) => {
    return window.getComputedStyle(elm, null).getPropertyValue(css);
  };

  const row = table.getElementsByTagName('tr')[0];
  const cols = row ? row.children : undefined;

  if (!cols) return;

  // table.style.overflow = 'hidden';

  const tableHeight = table.offsetHeight - 2;

  for (let i = 0; i < cols.length; i++) {
    const div = createDragDiv(tableHeight);

    cols[i].appendChild(div);
    cols[i].style.position = 'relative';
    setListeners(div);
  }
};
