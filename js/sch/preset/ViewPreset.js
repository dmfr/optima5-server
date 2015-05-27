Ext.define("Sch.preset.ViewPreset", {
    name: null,
    rowHeight: null,
    timeColumnWidth: 50,
    timeRowHeight: null,
    timeAxisColumnWidth: null,
    displayDateFormat: "G:i",
    shiftUnit: "HOUR",
    shiftIncrement: 1,
    defaultSpan: 12,
    timeResolution: null,
    headerConfig: null,
    columnLinesFor: "middle",
    headers: null,
    mainHeader: 0,
    constructor: function (a) {
        Ext.apply(this, a)
    },
    getHeaders: function () {
        if (this.headers) {
            return this.headers
        }
        var a = this.headerConfig;
        this.mainHeader = a.top ? 1 : 0;
        return this.headers = [].concat(a.top || [], a.middle || [], a.bottom || [])
    },
    getMainHeader: function () {
        return this.getHeaders()[this.mainHeader]
    },
    getBottomHeader: function () {
        var a = this.getHeaders();
        return a[a.length - 1]
    },
    clone: function () {
        var a = {};
        var b = this;
        Ext.each(["rowHeight", "timeColumnWidth", "timeRowHeight", "timeAxisColumnWidth", "displayDateFormat", "shiftUnit", "shiftIncrement", "defaultSpan", "timeResolution", "headerConfig"], function (c) {
            a[c] = b[c]
        });
        return new this.self(Ext.clone(a))
    }
});
