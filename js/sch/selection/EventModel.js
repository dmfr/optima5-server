Ext.define("Sch.selection.EventModel", {
    extend: "Ext.selection.Model",
    alias: "selection.eventmodel",
    requires: ["Ext.util.KeyNav"],
    deselectOnContainerClick: true,
    selectedOnMouseDown: false,
    onVetoUIEvent: Ext.emptyFn,
    constructor: function (a) {
        this.addEvents("beforedeselect", "beforeselect", "deselect", "select");
        this.callParent(arguments)
    },
    bindComponent: function (a) {
        var b = this,
            c = {
                refresh: b.refresh,
                scope: b
            };
        b.view = a;
        b.bindStore(a.getEventStore());
        a.on({
            eventclick: b.onEventClick,
            eventmousedown: b.onEventMouseDown,
            itemmousedown: b.onItemMouseDown,
            scope: this
        });
        a.on(c)
    },
    onEventMouseDown: function (b, a, c) {
        this.selectedOnMouseDown = null;
        if (!this.isSelected(a)) {
            this.selectedOnMouseDown = a;
            this.selectWithEvent(a, c)
        }
    },
    onEventClick: function (b, a, c) {
        if (!this.selectedOnMouseDown) {
            this.selectWithEvent(a, c)
        }
    },
    onItemMouseDown: function () {
        if (this.deselectOnContainerClick) {
            this.deselectAll()
        }
    },
    onSelectChange: function (d, b, j, a) {
        var f = this,
            g = f.view,
            h = f.store,
            e = b ? "select" : "deselect",
            c = 0;
        if ((j || f.fireEvent("before" + e, f, d)) !== false && a() !== false) {
            if (b) {
                g.onEventSelect(d, j)
            } else {
                g.onEventDeselect(d, j)
            } if (!j) {
                f.fireEvent(e, f, d)
            }
        }
    },
    selectRange: Ext.emptyFn,
    selectNode: function (c, d, a) {
        var b = this.view.resolveEventRecord(c);
        if (b) {
            this.select(b, d, a)
        }
    },
    deselectNode: function (c, d, a) {
        var b = this.view.resolveEventRecord(c);
        if (b) {
            this.deselect(b, a)
        }
    },
    storeHasSelected: function (a) {
        var b = this.store;
        if (a.hasId() && b.getByInternalId(a.internalId)) {
            return true
        }
        return this.callParent(arguments)
    }
});
