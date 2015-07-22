Ext.define("Sch.plugin.exporter.SinglePage", {
    extend: "Sch.plugin.exporter.AbstractExporter",
    config: {
        exporterId: "singlepage",
        headerTpl: '<div class="sch-export-header" style="height:{height}px; width:{width}px"></div>'
    },
    getExpectedNumberOfPages: function() {
        return 1
    },
    getPaperFormat: function() {
        var e = this,
            c = e.getTotalSize(),
            b = e.exportConfig.DPI,
            d = Ext.Number.toFixed(c.width / b, 1),
            a = Ext.Number.toFixed(c.height / b, 1);
        return d + "in*" + a + "in"
    },
    onRowsCollected: function() {
        var a = this;
        a.startPage();
        a.fillGrids();
        a.commitPage();
        a.onPagesExtracted()
    },
    getPageTplData: function() {
        var b = this,
            a = b.getTotalSize();
        return Ext.apply(b.callParent(arguments), {
            bodyHeight: a.height,
            showHeader: false,
            totalWidth: a.width
        })
    },
    getHeaderTplData: function(a) {
        var b = this;
        return {
            width: b.getTotalWidth(),
            height: b.pageHeaderHeight
        }
    },
    fitComponentIntoPage: function() {
        var a = this,
            b = a.lockedGrid;
        b.setWidth(b.headerCt.getEl().first().getWidth())
    }
});
