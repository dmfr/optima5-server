Ext.define("Sch.plugin.exporter.MultiPageVertical", {
    extend: "Sch.plugin.exporter.AbstractExporter",
    config: {
        exporterId: "multipagevertical"
    },
    minRowHeight: 20,
    visibleColumns: null,
    visibleColumnsWidth: 0,
    onRowsCollected: function(b, a) {
        var c = this;
        c.iterateAsync(function(g, j) {
            if (j === b.length) {
                c.onPagesExtracted();
                return
            }
            var h = j,
                f = c.printHeight,
                l = 0,
                e = [],
                k = [],
                i, d = false;
            c.startPage();
            while (!d && h < b.length) {
                i = a[h];
                f -= i.height;
                if (f > 0) {
                    l += i.height;
                    e.push(b[h]);
                    k.push(i);
                    h++
                } else {
                    d = true
                }
            }
            c.fillGrids(e, k);
            c.commitPage({
                rowIndex: h,
                rowsHeight: l
            });
            g(h)
        }, c, 0)
    },
    startPage: function() {
        var b = this;
        b.callParent(arguments);
        var a = b.getCurrentPage().select("#" + b.lockedView.id).first();
        a.dom.style.overflow = "visible"
    },
    getExpectedNumberOfPages: function() {
        return Math.ceil(this.lockedRowsHeight / this.printHeight)
    },
    setComponent: function() {
        var b = this,
            a = b.visibleColumns = [];
        b.callParent(arguments);
        b.visibleColumnsWidth = 0;
        b.lockedGrid.headerCt.items.each(function(c) {
            if (!c.hidden) {
                a.push({
                    column: c,
                    width: c.getWidth()
                });
                b.visibleColumnsWidth += c.getWidth()
            }
        })
    },
    fitComponentIntoPage: function() {
        var i = this,
            j = i.getComponent(),
            h = j.normalGrid,
            c = j.lockedGrid,
            f = i.getTotalWidth(),
            k = i.ticks,
            e = i.timeColumnWidth || i.restoreSettings.columnWidth;
        var d = Math.floor((i.visibleColumnsWidth / f) * i.paperWidth);
        var b = Math.floor((k.length * e / f) * i.paperWidth);
        var g = Math.floor(b / k.length);
        var a = (g / e) * i.getRowHeight();
        i.view.setRowHeight(a < i.minRowHeight ? i.minRowHeight : a);
        j.setWidth(i.paperWidth);
        h.setWidth(b);
        c.setWidth(d);
        i.fitLockedColumnWidth(d);
        j.setTimeColumnWidth(g)
    },
    fitLockedColumnWidth: function(a) {
        var b = this.visibleColumns;
        if (b.length) {
            var d = a / b.length;
            for (var c = 0; c < b.length; c++) {
                b[c].column.setWidth(d)
            }
            this._restoreColumnWidth = true
        }
    },
    restoreComponentState: function() {
        this.callParent(arguments);
        if (this._restoreColumnWidth) {
            var b = this.visibleColumns;
            for (var c = 0; c < b.length; c++) {
                var a = b[c];
                a.column.setWidth(a.width);
                a.column.show()
            }
        }
    }
});
