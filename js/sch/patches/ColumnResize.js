Ext.define("Sch.patches.ColumnResize", {
    override: "Sch.panel.TimelineGridPanel",
    afterRender: function () {
        this.callParent(arguments);
        var a = this.lockedGrid.headerCt.findPlugin("gridheaderresizer");
        if (a) {
            a.getConstrainRegion = function () {
                var d = this,
                    b = d.dragHd.el,
                    c;
                if (d.headerCt.forceFit) {
                    c = d.dragHd.nextNode("gridcolumn:not([hidden]):not([isGroupHeader])");
                    if (!d.headerInSameGrid(c)) {
                        c = null
                    }
                }
                return d.adjustConstrainRegion(Ext.util.Region.getRegion(b), 0, d.headerCt.forceFit ? (c ? c.getWidth() - d.minColWidth : 0) : d.maxColWidth - b.getWidth(), 0, d.minColWidth)
            }
        }
    }
});
