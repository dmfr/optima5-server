Ext.define("Sch.selection.AssignmentModel", {
    extend: "Sch.selection.EventModel",
    alias: "selection.assignmentmodel",
    assignmentStoreDetacher: null,
    destroy: function() {
        var a = this;
        Ext.destroyMembers(a, "assignmentStoreDetacher");
        a.callParent()
    },
    bindToView: function(a) {
        var c = this,
            b, d;
        c.callParent([a]);
        b = c.view.eventStore;
        d = b.getAssignmentStore();
        if (d) {
            c.assignmentStoreDetacher = d.on({
                remove: c.onAssignmentStoreRemove,
                clear: c.onAssignmentStoreClear,
                refresh: c.onAssignmentStoreRefresh,
                scope: c,
                destroyable: true
            })
        }
    },
    selectWithEvent: function(b, h) {
        var f = this,
            a = f.view,
            d = a.resolveResource(h.getTarget()),
            g, c;
        if (d) {
            g = a.eventStore.getAssignmentStore();
            c = g.getAssignmentForEventAndResource(b, d);
            if (c) {
                f.callParent([c, h])
            }
        }
    },
    getFirstSelectedEventForResource: function(f) {
        var c = this.getSelection(),
            e = null,
            b, a, d;
        for (b = 0, a = c.length; !e && b < a; ++b) {
            d = c[b];
            if (d.getEvent().isAssignedTo(f)) {
                e = d
            }
        }
        return e
    },
    getDraggableSelections: function() {
        return Ext.Array.filter(this.getSelection(), function(a) {
            return a.getEvent().isDraggable()
        })
    },
    forEachEventRelatedSelection: function(a, b) {
        Ext.Array.forEach(this.getSelection(), function(c) {
            c.getEvent() === a && b(c)
        })
    },
    onAssignmentStoreRemove: function(b, a) {
        this.deselect(a, true)
    },
    onAssignmentStoreClear: function(a) {
        this.clearSelections()
    },
    onAssignmentStoreRefresh: function(a) {
        this.clearSelections()
    }
});
