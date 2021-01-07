import { splitEvery, flatten, insert, remove } from "ramda";

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
 */

/**
 * map index for data.items, fill empty cells if needed
 *
 * @param {TableData} data
 */
export const mapIndex = (data) => {
  const { columnCount, items } = data;
  const missingCount =
    columnCount * Math.ceil(items.length / columnCount) - items.length;

  let newItems = data.items;

  if (missingCount > 0) {
    for (let i = 0; i < missingCount; i++) {
      newItems.push({ text: "" });
    }
  }

  return {
    ...data,
    items: newItems.map((item, index) => ({
      ...item,
      index,
    })),
  };
};

/**
 * add a column to current data
 *
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
    items: regularRows,
  };
};

/**
 * add a column to current data
 *
 */
export const deleteColumn = (data, columnIndex) => {
  const { columnCount } = data;

  const columnTanks = _buildColumnTanks(data);
  const columnArrayRemoved = remove(columnIndex, 1, columnTanks);
  const regularRows = _covertToRegularRows(columnArrayRemoved, columnTanks);

  return {
    ...data,
    columnCount: columnCount - 1,
    items: regularRows,
  };
};

/**
 * add a row to current data
 * @param {TableData} data
 * @param {number} rowIndex
 *
 */
export const addRow = (data, rowIndex) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsAdded = insert(rowIndex + 1, _getHolderCells(columnCount), rows);

  return {
    ...data,
    items: flatten(rowsAdded),
  };
};

/**
 * delete a row
 * @param {TableData} data
 * @param {number} rowIndex
 */
export const deleteRow = (data, rowIndex) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsRemoved = remove(rowIndex, 1, rows);

  return {
    ...data,
    items: flatten(rowsRemoved),
  };
};

/**
 * judge column by given index
 * @param {Number} index
 * @param {TableData} data
 * @return {Number}
 * @memberof UI
 */
export const whichColumn = (index, data) => {
  const { columnCount } = data;

  return parseInt(index) % columnCount;
};

/**
 * judge row by given index
 * @param {Number} index
 * @param {TableData} data
 * @memberof UI
 */
export const whichRow = (index, data) => {
  const { columnCount } = data;

  return Math.floor(parseInt(index) / columnCount);
};

/**
 *
 *
 * @param {Number} index
 * @param {[HTMLElement]} items
 * @attr {string} display style: block | flex
 */
export const showEl = (index, items, attr = "block") => {
  if (index >= 0) {
    for (let i = 0; i < items.length; i += 1) {
      const el = items[i];

      el.style.display = "none";
    }
    setTimeout(() => {
      items[index].style.display = attr;
    });
  }
};

/**
 * hide all elements
 * @param {[HTMLElement]} elements
 */
export const hideAllEls = (elements) => {
  for (let i = 0; i < elements.length; i += 1) {
    const el = elements[i];

    el.style.display = "none";
  }
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
    ret.push({ text: "" });
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
