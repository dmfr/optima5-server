    Ext.define("Sch.data.util.IdConsistencyManager", {
        config: {
            eventStore: null,
            resourceStore: null,
            assignmentStore: null
        },
        eventStoreDetacher: null,
        resourceStoreDetacher: null,
        constructor: function(a) {
            this.initConfig(a)
        },
        updateEventStore: function(a, c) {
            var b = this;
            Ext.destroyMembers(b, "eventStoreDetacher");
            if (a) {
                b.eventStoreDetacher = a.on({
                    idchanged: b.onEventIdChanged,
                    scope: b,
                    destroyable: true,
                    priority: 200
                })
            }
        },
        updateResourceStore: function(a, b) {
            var c = this;
            Ext.destroyMembers(c, "resourceStoreDetacher");
            if (a) {
                c.resourceStoreDetacher = a.on({
                    idchanged: c.onResourceIdChanged,
                    scope: c,
                    destroyable: true,
                    priority: 200
                })
            }
        },
        onEventIdChanged: function(c, e, g, a) {
            var d = this,
                f = d.getAssignmentStore(),
                b;
            if (f) {
                b = d.getUpdateAssignmentEventIdFieldFn(f, g, a);
                c.on("update", b, null, {
                    single: true,
                    priority: 200
                })
            }
        },
        onResourceIdChanged: function(i, e, b, d) {
            var h = this,
                f = h.getEventStore(),
                g = h.getAssignmentStore(),
                c, a;
            if (f && !g) {
                c = h.getUpdateEventResourceIdFieldFn(f, b, d)
            }
            if (g) {
                a = h.getUpdateAssignmentResourceIdFieldFn(g, b, d)
            }
            if (c || g) {
                i.on("update", function() {
                    c && c();
                    a && a()
                }, null, {
                    single: true,
                    priority: 200
                })
            }
        },
        getUpdateEventResourceIdFieldFn: function(c, d, a) {
            var b = c.getRange();
            return function() {
                Ext.Array.forEach(b, function(e) {
                    e.getResourceId() == d && e.setResourceId(a)
                })
            }
        },
        getUpdateAssignmentEventIdFieldFn: function(c, d, b) {
            var a = c.getAssignmentsForEvent(d);
            return function() {
                Ext.Array.forEach(a, function(e) {
                    e.getEventId() == d && e.setEventId(b)
                })
            }
        },
        getUpdateAssignmentResourceIdFieldFn: function(c, d, b) {
            var a = c.getAssignmentsForResource(d);
            return function() {
                Ext.Array.forEach(a, function(e) {
                    e.getResourceId() == d && e.setResourceId(b)
                })
            }
        }
    });
