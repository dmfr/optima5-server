    Ext.define("Sch.data.mixin.EventStore", {
        extend: "Ext.Mixin",
        requires: ["Sch.util.Date", "Sch.data.util.IdConsistencyManager", "Sch.data.util.ModelPersistencyManager", "Sch.data.util.ResourceEventsCache"],
        isEventStore: true,
        resourceStore: null,
        resourceStoreDetacher: null,
        assignmentStore: null,
        resourceEventsCache: null,
        idConsistencyManager: null,
        modelPersistencyManager: null,
        mixinConfig: {
            after: {
                constructor: "constructor",
                destroy: "destroy"
            }
        },
        constructor: function() {
            var a = this;
            a.resourceEventsCache = a.createResourceEventsCache();
            a.idConsistencyManager = a.createIdConsistencyManager();
            a.modelPersistencyManager = a.createModelPersistencyManager()
        },
        destroy: function() {
            var a = this;
            Ext.destroyMembers(a, "resourceEventsCache", "idConsistencyManager", "modelPersistencyManager")
        },
        createResourceEventsCache: function() {
            return new Sch.data.util.ResourceEventsCache(this)
        },
        createIdConsistencyManager: function() {
            var a = this;
            return new Sch.data.util.IdConsistencyManager({
                eventStore: a,
                resourceStore: a.getResourceStore(),
                assignmentStore: a.getAssignmentStore()
            })
        },
        createModelPersistencyManager: function() {
            var a = this;
            return new Sch.data.util.ModelPersistencyManager({
                eventStore: a,
                resourceStore: a.getResourceStore(),
                assignmentStore: a.getAssignmentStore()
            })
        },
        getResourceStore: function() {
            return this.resourceStore
        },
        setResourceStore: function(b) {
            var a = this,
                c = a.resourceStore;
            if (a.resourceStore) {
                a.resourceStore.setEventStore(null);
                a.idConsistencyManager && a.idConsistencyManager.setResourceStore(null);
                a.modelPersistencyManager && a.modelPersistencyManager.setResourceStore(null)
            }
            a.resourceStore = b && Ext.StoreMgr.lookup(b) || null;
            if (a.resourceStore) {
                a.modelPersistencyManager && a.modelPersistencyManager.setResourceStore(a.resourceStore);
                a.idConsistencyManager && a.idConsistencyManager.setResourceStore(a.resourceStore);
                b.setEventStore(a)
            }
            if ((c || b) && c !== b) {
                a.fireEvent("resourcestorechange", a, b, c)
            }
        },
        getAssignmentStore: function() {
            return this.assignmentStore
        },
        setAssignmentStore: function(b) {
            var a = this,
                c = a.assignmentStore;
            if (a.assignmentStore) {
                a.assignmentStore.setEventStore(null);
                a.idConsistencyManager && a.idConsistencyManager.setAssignmentStore(null);
                a.modelPersistencyManager && a.modelPersistencyManager.setAssignmentStore(null)
            }
            a.assignmentStore = b && Ext.StoreMgr.lookup(b) || null;
            if (a.assignmentStore) {
                a.modelPersistencyManager && a.modelPersistencyManager.setAssignmentStore(a.assignmentStore);
                a.idConsistencyManager && a.idConsistencyManager.setAssignmentStore(a.assignmentStore);
                a.assignmentStore.setEventStore(a);
                Ext.destroy(a.resourceEventsCache)
            } else {
                a.resourceEventsCache = a.createResourceEventsCache()
            }
            if ((c || b) && c !== b) {
                a.fireEvent("assignmentstorechange", a, b, c)
            }
        },
        isDateRangeAvailable: function(g, a, c, e) {
            var f = Sch.util.Date,
                b = this.getEventsForResource(e),
                d = true;
            Ext.each(b, function(h) {
                d = (c === h || !f.intersectSpans(g, a, h.getStartDate(), h.getEndDate()));
                return d
            });
            return d
        },
        getEventsInTimeSpan: function(f, b, a) {
            var d = new Ext.util.MixedCollection();
            var c = [];
            if (a !== false) {
                var e = Sch.util.Date;
                this.forEachScheduledEvent(function(i, h, g) {
                    if (e.intersectSpans(h, g, f, b)) {
                        c.push(i)
                    }
                })
            } else {
                this.forEachScheduledEvent(function(i, h, g) {
                    if (h - f >= 0 && b - g >= 0) {
                        c.push(i)
                    }
                })
            }
            d.addAll(c);
            return d
        },
        forEachScheduledEvent: function(b, a) {
            this.each(function(e) {
                var d = e.getStartDate(),
                    c = e.getEndDate();
                if (d && c) {
                    return b.call(a || this, e, d, c)
                }
            }, this)
        },
        getTotalTimeSpan: function() {
            var a = new Date(9999, 0, 1),
                b = new Date(0),
                c = Sch.util.Date;
            this.each(function(d) {
                if (d.getStartDate()) {
                    a = c.min(d.getStartDate(), a)
                }
                if (d.getEndDate()) {
                    b = c.max(d.getEndDate(), b)
                }
            });
            a = a < new Date(9999, 0, 1) ? a : null;
            b = b > new Date(0) ? b : null;
            return {
                start: a || null,
                end: b || a || null
            }
        },
        filterEventsForResource: function(d, c, b) {
            var a = d.getEvents(this);
            return Ext.Array.filter(a, c, b || this)
        },
        append: function(a) {
            throw "Must be implemented by consuming class"
        },
        getResourcesForEvent: function(d) {
            var c = this,
                e = c.getAssignmentStore(),
                b = c.getResourceStore(),
                a;
            if (e) {
                a = e.getResourcesForEvent(d)
            } else {
                if (b) {
                    d = d instanceof Sch.model.Event && d || c.getModelById(d);
                    a = d && b.getModelById(d.getResourceId());
                    a = a && [a] || []
                } else {
                    a = []
                }
            }
            return a
        },
        getEventsForResource: function(d) {
            var c = this,
                e = c.getAssignmentStore(),
                b, a;
            if (e) {
                a = e.getEventsForResource(d)
            } else {
                if (c.resourceEventsCache) {
                    a = c.resourceEventsCache.get(d)
                } else {
                    a = []
                }
            }
            return a
        },
        getAssignmentsForEvent: function(b) {
            var a = this,
                c = a.getAssignmentStore();
            return c && c.getAssignmentsForEvent(b) || []
        },
        getAssignmentsForResource: function(b) {
            var a = this,
                c = a.getAssignmentStore();
            return c && c.getAssignmentsForResource(b) || []
        },
        assignEventToResource: function(b, c) {
            var a = this,
                d = a.getAssignmentStore();
            if (d) {
                d.assignEventToResource(b, c)
            } else {
                b = b instanceof Sch.model.Event && b || a.getModelById(b);
                c = c instanceof Sch.model.Resource ? c.getId() : c;
                b && b.setResourceId(c)
            }
        },
        unassignEventFromResource: function(b, c) {
            var a = this,
                d = a.getAssignmentStore();
            if (d) {
                d.unassignEventFromResource(b, c)
            } else {
                b = b instanceof Sch.model.Event && b || a.getModelById(b);
                c = c instanceof Sch.model.Resource ? c.getId() : c;
                if (b && b.getResourceId() == c) {
                    b.setResourceId(null)
                }
            }
        },
        reassignEventFromResourceToResource: function(d, a, b) {
            var c = this,
                e = c.getAssignmentStore();
            if (e) {
                e.unassignEventFromResource(d, a);
                e.assignEventToResource(d, b)
            } else {
                d = d instanceof Sch.model.Event && d || c.getModelById(d);
                a = a instanceof Sch.model.Resource ? a.getId() : a;
                b = b instanceof Sch.model.Resource ? b.getId() : b;
                if (d.getResourceId() == a) {
                    d.setResourceId(b)
                }
            }
        },
        isEventAssignedToResource: function(c, d) {
            var b = this,
                e = b.getAssignmentStore(),
                a;
            if (e) {
                a = e.isEventAssignedToResource(c, d)
            } else {
                c = c instanceof Sch.model.Event && c || b.getModelById(c);
                d = d instanceof Sch.model.Resource ? d.getId() : d;
                a = c && (c.getResourceId() == d) || false
            }
            return a
        },
        removeAssignmentsForEvent: function(b) {
            var a = this,
                c = a.getAssignmentStore();
            if (c) {
                c.removeAssignmentsForEvent(b)
            } else {
                b = b instanceof Sch.model.Event && b || a.getModelById(b);
                b && b.setResourceId(null)
            }
        },
        removeAssignmentsForResource: function(c) {
            var b = this,
                d = b.getAssignmentStore(),
                a = b.getResourceStore();
            if (d) {
                d.removeAssignmentsForResource(c)
            } else {
                if (a) {
                    c = c instanceof Sch.model.Resource && c || a.getModelById(c);
                    c && Ext.Array.forEach(b.resourceEventsCache.get(c), function(e) {
                        e.setResourceId(null)
                    })
                } else {
                    c = c instanceof Sch.model.Resource ? c.getId() : c;
                    Ext.Array.forEach(b.getRange(), function(e) {
                        e.getResourceId() == c && e.setResourceId(null)
                    })
                }
            }
        },
        isEventPersistable: function(e) {
            var d = this,
                g = d.getAssignmentStore(),
                f, c, b, a = true;
            if (!g) {
                f = e.getResources();
                for (c = 0, b = f.length; a && c < b; ++c) {
                    a = f[c].phantom !== true
                }
            }
            return a
        }
    });
