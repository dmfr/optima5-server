Ext.define("Sch.feature.Grouping", {
    extend: "Ext.grid.feature.Grouping",
    alias: "feature.scheduler_grouping",
    headerRenderer: Ext.emptyFn,
    timeAxisViewModel: null,
    headerCellTpl: '<tpl for="."><div class="sch-grid-group-hd-cell {cellCls}" style="{cellStyle}; width: {width}px;"><span>{value}</span></div></tpl>',
    renderCells: function(f) {
        var a = [];
        var b = this.timeAxisViewModel;
        var d = b.columnConfig[this.timeAxisViewModel.columnLinesFor];
        for (var c = 0; c < d.length; c++) {
            var g = {};
            var e = this.headerRenderer(d[c].start, d[c].end, f.children, g);
            g.value = e;
            g.width = b.getPositionFromDate(d[c].end) - b.getPositionFromDate(d[c].start);
            a.push(g)
        }
        return this.headerCellTpl.apply(a)
    },
    init: function() {
        var a = this.view;
        var b = this;
        this.callParent(arguments);
        if (typeof this.headerCellTpl === "string") {
            this.headerCellTpl = new Ext.XTemplate(this.headerCellTpl)
        }
        if (a.eventStore) {
            this.timeAxisViewModel = a.timeAxisViewModel;
            a.mon(this.view.eventStore, {
                add: this.onEventAddOrRemove,
                remove: this.onEventAddOrRemove,
                update: this.onEventUpdate,
                scope: this
            });
            this.groupHeaderTpl = new Ext.XTemplate(this.schedulerGroupHeaderTpl, {
                renderCells: Ext.Function.bind(b.renderCells, b)
            })
        }
        Ext.apply(a, {
            getRowNode: function(c) {
                return this.retrieveNode(this.getRowId(c), true)
            }
        })
    },
    getGroupHeaderNodeIndex: function(a, c) {
        var b = a.resourceStore;
        var d = b.getGrouper().getGroupString(c);
        var e = this.getGroup(d);
        return a.store.indexOf(e.items[0])
    },
    onEventUpdate: function(f, d) {
        var c = f.getResourceStore().getGroupField();
        var a = d.previous && d.resourceIdField in d.previous;
        var e = d.getResource();
        if (a) {
            var b = f.getResourceStore().getById(d.previous[d.resourceIdField]);
            if (b && b.get(c) !== e.get(c)) {
                this.refreshGroupHeader(b)
            }
        }
        if (e) {
            this.refreshGroupHeader(e)
        }
    },
    onEventAddOrRemove: function(c, b) {
        var d = this;
        var a = d.view;
        Ext.Array.forEach(b, function(e) {
            var f = e.getResource(null, a.eventStore);
            if (f) {
                d.refreshGroupHeader(f)
            }
        })
    },
    refreshGroupHeader: function(c) {
        var b = this,
            a = b.view;
        a.refreshNode(b.getGroupHeaderNodeIndex(a, c))
    },
    schedulerGroupHeaderTpl: "{[this.renderCells(values)]}"
});
