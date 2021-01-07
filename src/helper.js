import { splitEvery, flatten, insert, remove } from "ramda";

/**
 * map index for data.items
 *
 * @param {TODO} data
 */
export const mapIndex = (data) => {
  const items = data.items.map((item, index) => {
    return {
      ...item,
      index,
    };
  });

  return {
    ...data,
    items,
  };
};

/**
 * add a column to current data
 *
 */
export const addColumn = (items, columnIndex) => {
  console.log("add Column: ", items);
  console.log("add Column columnIndex: ", columnIndex);
};

/**
 * get holder cells holder
 * @param {Number} count
 * @returns {[TODO]}
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
 * add a row to current data
 *
 */
export const addRow = (data, rowIndex) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsAdded = insert(rowIndex + 1, _getHolderCells(columnCount), rows);

  console.log("rows: ", rows);
  console.log("rows added: ", flatten(rowsAdded));

  return {
    ...data,
    items: flatten(rowsAdded),
  };
};

/**
 * delete a row
 *
 */
export const deleteRow = (data, rowIndex) => {
  const { columnCount, items } = data;

  const rows = splitEvery(columnCount, items);
  const rowsRemoved = remove(rowIndex, 1, rows);

  console.log("rows: ", rows);
  console.log("rows deleted: ", flatten(rowsRemoved));

  return {
    ...data,
    items: flatten(rowsRemoved),
  };
};

export const deleteColumn = () => {};

/**
 * judge column by given index
 * @param {Number} index
 * @param {data} TODO:
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
 * @return {Number} TODO:
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
