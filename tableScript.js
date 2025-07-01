import { calculateVc } from "./vc.js";
var tabledata = Array.from({ length: 20 }, () => ({}));
document.getElementById("download-csv").addEventListener("click", function () {
    table.download("csv", "CriticalVelocityCalculation.csv");
});
document.getElementById("download-xlsx").addEventListener("click", function () {
    table.download("xlsx", "CriticalVelocityCalculation.xlsx", { sheetName: "Critical Velocity Calculation" });
});
var rowMenu = [
    {
        label: "<i class='fas fa-user'></i> Insert a row above",
        action: function (e, row) {
            table.addRow({}, true, row);
        }
    },
    {
        label: "<i class='fas fa-check-square'></i> Insert a row below",
        action: function (e, row) {
            table.addRow({}, false, row);
        }
    },
    {
        separator: true,
    },
    {
        label: "<i class='fas fa-check-square'></i> Delete row(s)",
        action: function (e, row) {
            const ranges = table.getRanges();
            ranges.forEach((range) => {
                const rows = range.getRows();
                rows.forEach((row) => {
                    table.deleteRow(row);
                });
            });
        }
    },
];
var table = new Tabulator("#example-table", {
    height: 400,
    data: tabledata,
    layout: "fitColumns",
    rowContextMenu: rowMenu,
    selectable: true,
    selectableRange: 1,
    selectableRangeColumns: true,
    selectableRangeRows: true,
    selectableRangeClearCells: true,
    editTriggerEvent: "dblclick",
    clipboard: true,
    clipboardCopyStyled: false,
    clipboardCopyConfig: {
        rowHeaders: false,
        columnHeaders: false,
    },
    clipboardCopyRowRange: "range",
    clipboardPasteParser: pasteParser,
    clipboardPasteAction: validateParseAction,
    rowHeader: { resizable: false, frozen: true, width: 40, hozAlign: "center", formatter: "rownum", cssClass: "range-header-col", editor: false },
    columnDefaults: {
        headerSort: false,
        headerHozAlign: "center",
        resizable: "header",
    },
    columns: [
        { title: "Identifier", field: "identifier", editor: "input", resizable: false },
        { title: "Q", field: "q", hozAlign: "center", editor: "input", validator: ["min:0", "numeric"], resizable: false },
        { title: "A", field: "a", hozAlign: "center", editor: "input", validator: ["min:0", "numeric"], resizable: false },
        { title: "T", field: "t", hozAlign: "center", editor: "input", validator: ["min:-30", "max:50", "numeric"], resizable: false },
        { title: "G", field: "g", hozAlign: "center", editor: "input", validator: ["numeric"], resizable: false },
        { title: "H", field: "h", hozAlign: "center", editor: "input", validator: ["min:0", "numeric"], resizable: false },
        { title: "NFPA Revision", field: "nfpaRevision", hozAlign: "center", editor: "list", editorParams: { values: ["2014", "2017"] }, validator: ["in:2014|2017"], resizable: false },
        { title: "k1 Option", field: "k1Option", hozAlign: "center", editor: "list", editorParams: { values: ["Roundup", "Interpolate"] }, validator: ["in:Roundup|Interpolate"], resizable: false },
        { title: "Vc", field: "vc", hozAlign: "center", resizable: false, editor: false },
    ],
});
table.on("validationFailed", function (cell, value, validators) {
    const column = cell.getColumn().getField();
    let errorMsg = "";
    switch (column) {
        case "q":
            errorMsg = "Error: Q must be a positive number.";
            break;
        case "a":
            errorMsg = "Error: A must be a positive number.";
            break;
        case "t":
            errorMsg = "Error: T must be a number between -30 and 50.";
            break;
        case "g":
            errorMsg = "Error: G must be a number.";
            break;
        case "h":
            errorMsg = "Error: H must be a positive number.";
            break;
        case "nfpaRevision":
            errorMsg = "Error: NFPA revision must be either 2014 or 2017.";
            break;
        case "k1Option":
            errorMsg = "Error: k1 Option must be either roundup or interpolate";
            break;
        default:
            errorMsg = "Error: Please check the input values.";
    }
    const messageElem = document.getElementById("table-message");
    if (messageElem) {
        messageElem.textContent = errorMsg;
    }
});
table.on("cellEdited", function (cell) {
    const tableData = table.getData();
    const editedRow = cell.getRow();
    const editedRowData = editedRow.getData();
    const editedColumnField = cell.getColumn().getField();
    const editedRowIndex = editedRow.getPosition();
    // automatically add a new row if the last row is edited
    if (editedRowIndex === tableData.length) {
        table.addRow({});
    }
    // clear any previous message
    const message = document.getElementById("table-message");
    if (message) {
        message.textContent = "";
    }
    updateNfpaRevisionAndK1Option(editedColumnField, editedRow, editedRowData);
    updateVc(editedRow);
});
table.on("clipboardPasted", function (clipboard, rowData, rows) {
    rows.forEach((row) => {
        checkNfpaRevisionAndK1Option(row.component);
        updateVc(row.component);
    });
});
// update nfpaRevision and k1Option based on their values
function updateNfpaRevisionAndK1Option(columnField, row, rowData) {
    if (columnField === "nfpaRevision") {
        if (rowData.nfpaRevision === "2014") {
            row.update({ k1Option: "N/A" });
        }
        if (rowData.nfpaRevision === "2017") {
            if (rowData.k1Option === null || rowData.k1Option === undefined || rowData.k1Option === "" || rowData.k1Option === "N/A") {
                row.update({ k1Option: "Roundup" });
            }
        }
    }
    if (columnField === "k1Option" && rowData.nfpaRevision === "2014") {
        if (rowData.k1Option !== null && rowData.k1Option !== undefined && rowData.k1Option !== "") {
            row.update({ nfpaRevision: "2017" });
        }
        else {
            row.update({ k1Option: "N/A" });
        }
    }
}
// revise nfpaRevision and k1Option based on their values
function checkNfpaRevisionAndK1Option(row) {
    const rowData = row.getData();
    if (rowData.nfpaRevision === "2014" && rowData.k1Option !== "N/A") {
        row.update({ k1Option: "N/A" });
    }
    if (rowData.nfpaRevision === "2017" && rowData.k1Option === "N/A") {
        row.update({ k1Option: "" });
    }
}
function isCompletedRow(row) {
    for (const key in row) {
        if (row.hasOwnProperty(key) && key !== "identifier" && key !== "vc") {
            if (row[key] === null || row[key] === undefined || row[key] === "") {
                return false;
            }
        }
    }
    return true;
}
function updateVc(row) {
    const rowData = row.getData();
    if (isCompletedRow(rowData)) {
        const q0 = Number(rowData.q);
        const a0 = Number(rowData.a);
        const t0 = Number(rowData.t);
        const g0 = Number(rowData.g);
        const h0 = Number(rowData.h);
        const nfpaRevision0 = Number(rowData.nfpaRevision);
        const interpolate_k1 = rowData.k1Option.toLowerCase() === "interpolate";
        const vc0 = calculateVc(q0, a0, g0, h0, t0, interpolate_k1, nfpaRevision0);
        row.update({ vc: vc0.toFixed(2) });
    }
    else {
        row.update({ vc: "" });
    }
}
function pasteParser(clipboard) {
    var data = [], rows = [], range = table.modules.selectRange.activeRange, singleCell = false, bounds, startCell, colWidth, columnMap, startCol;
    if (range) {
        bounds = range.getBounds();
        startCell = bounds.start;
        if (bounds.start === bounds.end) {
            singleCell = true;
        }
        if (startCell) {
            // when copying from Excel, the clipboard can contain "\n" at the end of the string.
            // this will create an empty row at the end of the array and the throw validation errors from an empty row.
            if (clipboard.endsWith("\n")) {
                clipboard = clipboard.slice(0, -2);
            }
            clipboard = clipboard.split("\n");
            clipboard.forEach(function (row) {
                data.push(row.split("\t"));
            });
            if (data.length) {
                columnMap = table.columnManager.getVisibleColumnsByIndex();
                startCol = columnMap.indexOf(startCell.column);
                if (startCol > -1) {
                    if (singleCell) {
                        colWidth = data[0].length;
                    }
                    else {
                        colWidth = (columnMap.indexOf(bounds.end.column) - startCol) + 1;
                    }
                    columnMap = columnMap.slice(startCol, startCol + colWidth);
                    data.forEach((item) => {
                        var row = {};
                        var itemLength = item.length;
                        columnMap.forEach(function (col, i) {
                            // explicitly customize to remove "\r"
                            row[col.field] = item[i % itemLength].replace(/^[\r\n]+|[\r\n]+$/g, "").trim();
                        });
                        rows.push(row);
                    });
                    return rows;
                }
            }
        }
    }
    return false;
}
function validateParseAction(data) {
    var rows = [], range = table.modules.selectRange.activeRange, singleCell = false, bounds, startCell, startRow, rowWidth, dataLength;
    dataLength = data.length;
    const messageElem = document.getElementById("table-message");
    if (messageElem) {
        messageElem.textContent = "";
    }
    if (range) {
        bounds = range.getBounds();
        startCell = bounds.start;
        if (bounds.start === bounds.end) {
            singleCell = true;
        }
        if (startCell) {
            rows = table.rowManager.activeRows.slice();
            startRow = rows.indexOf(startCell.row);
            if (singleCell) {
                rowWidth = data.length;
            }
            else {
                rowWidth = (rows.indexOf(bounds.end.row) - startRow) + 1;
            }
            if (startRow > -1) {
                table.blockRedraw();
                rows = rows.slice(startRow, startRow + rowWidth);
                rows.forEach((row, i) => {
                    var rowData = data[i % dataLength];
                    var errorMsg = "";
                    for (const key in rowData) {
                        if (errorMsg === "") {
                            switch (key) {
                                case "q":
                                    if (!isPositiveNumber(rowData[key])) {
                                        errorMsg = "Error: Q must be a positive number.";
                                    }
                                    break;
                                case "a":
                                    if (!isPositiveNumber(rowData[key])) {
                                        errorMsg = "Error: A must be a positive number.";
                                    }
                                    break;
                                case "t":
                                    if (!isNumber(rowData[key])) {
                                        errorMsg = "Error: T must be a number.";
                                    }
                                    break;
                                case "g":
                                    if (!isNumber(rowData[key])) {
                                        errorMsg = "Error: G must be a number.";
                                    }
                                    break;
                                case "h":
                                    if (!isPositiveNumber(rowData[key])) {
                                        errorMsg = "Error: H must be a positive number.";
                                    }
                                    break;
                                case "nfpaRevision":
                                    if (typeof rowData[key] === "string") {
                                        var value = rowData[key];
                                        if (value !== "2014" && value !== "2017") {
                                            errorMsg = "Error: NFPA revision must be either 2014 or 2017.";
                                        }
                                    }
                                    break;
                                case "k1Option":
                                    if (typeof rowData[key] === "string") {
                                        var value = rowData[key].toLowerCase();
                                        if (value !== "roundup" && value !== "interpolate" && value !== "n/a") {
                                            errorMsg = "Error: k1 option must be either roundup, interpolate or N/A.";
                                        }
                                    }
                                    break;
                                default:
                            }
                        }
                        else
                            break;
                    }
                    if (errorMsg !== "") {
                        if (messageElem) {
                            messageElem.textContent = errorMsg;
                        }
                        return;
                    }
                    row.updateData(data[i % dataLength]);
                });
                table.restoreRedraw();
            }
        }
    }
    return rows;
}
function isPositiveNumber(value) {
    if (typeof value === "string") {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            return false;
        }
        return true;
    }
    return false;
}
function isNumber(value) {
    if (typeof value === "string") {
        const num = Number(value);
        if (isNaN(num)) {
            return false;
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=script.js.map