Ext.define("Sch.mixin.FilterableTreeView", {
    prevBlockRefresh: null,
    initTreeFiltering: function () {
        var a = function () {
            var b = this.up("tablepanel").store;
            if (b instanceof Ext.data.NodeStore) {
                b = this.up("tablepanel[lockable=true]").store
            }
            this.mon(b, "nodestore-datachange-start", this.onFilterChangeStart, this);
            this.mon(b, "nodestore-datachange-end", this.onFilterChangeEnd, this);
            this.mon(b, "filter-clear", this.onFilterCleared, this);
            this.mon(b, "filter-set", this.onFilterSet, this)
        };
        if (this.rendered) {
            a.call(this)
        } else {
            this.on("beforerender", a, this, {
                single: true
            })
        }
    },
    onFilterChangeStart: function () {
        this.prevBlockRefresh = this.blockRefresh;
        this.blockRefresh = true;
        Ext.suspendLayouts()
    },
    onFilterChangeEnd: function () {
        Ext.resumeLayouts(true);
        this.blockRefresh = this.prevBlockRefresh
    },
    onFilterCleared: function () {
        delete this.toggle;
        var a = this.getEl();
        if (a) {
            a.removeCls("sch-tree-filtered")
        }
    },
    onFilterSet: function () {
        this.toggle = function () {};
        var a = this.getEl();
        if (a) {
            a.addCls("sch-tree-filtered")
        }
    }
});
