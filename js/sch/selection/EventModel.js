Ext.define("Sch.selection.EventModel", {
    extend: "Ext.selection.Model",
    alias: "selection.eventmodel",
    requires: ["Ext.util.KeyNav"],
    deselectOnContainerClick: true,
    selectedOnMouseDown: false,
    bindToView: function(a) {
        var d = this;
        d.view = a;
        var b = a.eventStore;
        var c = a.resourceStore;
        d.bindStore(b);
        a.mon(c, "beforeload", d.clearSelectionOnRefresh, d);
        a.mon(b, "beforeload", d.clearSelectionOnRefresh, d);
        a.on({
            eventclick: d.onEventClick,
            eventmousedown: d.onEventMouseDown,
            itemmousedown: d.onItemMouseDown,
            refresh: function() {
                d.refresh()
            },
            destroy: function() {
                d.bindStore(null)
            },
            scope: d
        })
    },
    clearSelectionOnRefresh: function() {
        this.clearSelections()
    },
    onEventMouseDown: function(b, a, c) {
        this.selectedOnMouseDown = null;
        if (!this.isSelected(a)) {
            this.selectedOnMouseDown = a;
            this.selectWithEvent(a, c)
        }
    },
    onEventClick: function(b, a, c) {
        if (!this.selectedOnMouseDown) {
            this.selectWithEvent(a, c)
        }
    },
    onItemMouseDown: function(f, e, i, h, g) {
        if (this.deselectOnContainerClick && !g.getTarget(this.view.eventSelector)) {
            this.deselectAll()
        }
    },
    onSelectChange: function(d, b, j, a) {
        var f = this,
            g = f.view,
            h = f.store,
            e = b ? "select" : "deselect",
            c = 0;
        if ((j || f.fireEvent("before" + e, f, d)) !== false && a() !== false) {
            if (b) {
                g.onEventBarSelect(d, j)
            } else {
                g.onEventBarDeselect(d, j)
            }
            if (!j) {
                f.fireEvent(e, f, d)
            }
        }
    },
    selectRange: Ext.emptyFn,
    selectNode: function(c, d, a) {
        var b = this.view.resolveEventRecord(c);
        if (b) {
            this.select(b, d, a)
        }
    },
    deselectNode: function(c, d, a) {
        var b = this.view.resolveEventRecord(c);
        if (b) {
            this.deselect(b, a)
        }
    },
    getFirstSelectedEventForResource: function(f) {
        var c = this.getSelection(),
            e = null,
            b, a, d;
        for (b = 0, a = c.length; !e && b < a; ++b) {
            d = c[b];
            if (d.isAssignedTo(f)) {
                e = d
            }
        }
        return e
    },
    getDraggableSelections: function() {
        return Ext.Array.filter(this.getSelection(), function(a) {
            return a.isDraggable()
        })
    },
    forEachEventRelatedSelection: function(a, b) {
        this.isSelected(a) && b(a)
    }
});
