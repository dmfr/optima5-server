Ext.define("Sch.model.Event", {
    extend: "Sch.model.Range",
    idProperty: "Id",
    customizableFields: [{
        name: "ResourceId"
    }, {
        name: "Draggable",
        type: "boolean",
        persist: false,
        defaultValue: true
    }, {
        name: "Resizable",
        persist: false,
        defaultValue: true
    }],
    resourceIdField: "ResourceId",
    draggableField: "Draggable",
    resizableField: "Resizable",
    getInternalId: function() {
        return this.internalId
    },
    getEventStore: function() {
        var b = this,
            a = b.joined && b.joined[0];
        if (a && !a.isEventStore) {
            Ext.Array.sort(b.joined, function(d, c) {
                return (d.isEventStore || false) > (c.isEventStore || false) && -1 || 1
            });
            a = b.joined[0]
        }
        return a
    },
    getResourceStore: function() {
        var a = this.getEventStore();
        return a && a.getResourceStore()
    },
    getAssignmentStore: function() {
        var a = this.getEventStore();
        return a && a.getAssignmentStore()
    },
    getResources: function() {
        var b = this,
            a = b.getEventStore();
        return a && a.getResourcesForEvent(b) || []
    },
    forEachResource: function(d, c) {
        var a = this.getResources();
        for (var b = 0; b < a.length; b++) {
            if (d.call(c || this, a[b]) === false) {
                return
            }
        }
    },
    getResource: function(e, b) {
        var d = this,
            a = null,
            c;
        b = b || d.getEventStore();
        c = b && b.getResourceStore();
        e = e == null ? d.getResourceId() : e;
        if (b && (e === null || e === undefined)) {
            a = b.getResourcesForEvent(d);
            if (a.length == 1) {
                a = a[0]
            } else {
                if (a.length > 1) {
                    Ext.Error.raise("Event::getResource() is not applicable for events with multiple assignments, please use Event::getResources() instead.")
                } else {
                    a = null
                }
            }
        } else {
            if (c) {
                a = c.getModelById(e)
            }
        }
        return a
    },
    setResource: function(c) {
        var b = this,
            a = b.getEventStore();
        a && a.removeAssignmentsForEvent(b);
        b.assign(c)
    },
    assign: function(c) {
        var b = this,
            a = b.getEventStore();
        c = c instanceof Sch.model.Resource ? c.getId() : c;
        if (a) {
            a.assignEventToResource(b, c)
        } else {
            b.setResourceId(c)
        }
    },
    unassign: function(c) {
        var b = this,
            a = b.getEventStore();
        c = c instanceof Sch.model.Resource ? c.getId() : c;
        if (a) {
            a.unassignEventFromResource(b, c)
        } else {
            if (b.getResourceId() == c) {
                b.setResourceId(null)
            }
        }
    },
    reassign: function(a, b) {
        var d = this,
            c = d.getEventStore();
        a = a instanceof Sch.model.Resource ? a.getId() : a;
        b = b instanceof Sch.model.Resource ? b.getId() : b;
        if (c) {
            c.reassignEventFromResourceToResource(d, a, b)
        } else {
            d.setResourceId(b)
        }
    },
    isAssignedTo: function(d) {
        var c = this,
            b = c.getEventStore(),
            a = false;
        d = d instanceof Sch.model.Resource && d.getId() || d;
        if (b) {
            a = b.isEventAssignedToResource(c, d)
        } else {
            a = c.getResourceId() == d
        }
        return a
    },
    getAssignments: function() {
        var b = this,
            a = b.getEventStore();
        return a && a.getAssignmentsForEvent(b)
    },
    isDraggable: function() {
        return this.getDraggable()
    },
    isResizable: function() {
        return this.getResizable()
    },
    isPersistable: function() {
        var b = this,
            a = b.getEventStore();
        return a && a.isEventPersistable(b)
    }
});
