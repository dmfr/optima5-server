    Ext.define("Sch.data.AssignmentStore", {
        extend: "Ext.data.Store",
        mixins: ["Sch.data.mixin.UniversalModelGetter", "Sch.data.mixin.CacheHintHelper"],
        requires: ["Sch.model.Assignment", "Sch.model.Range", "Sch.model.Resource", "Sch.data.util.EventAssignmentsCache", "Sch.data.util.ResourceAssignmentsCache", "Sch.data.util.AssignmentStoreEventResourcesCache", "Sch.data.util.AssignmentStoreResourceEventsCache"],
        model: "Sch.model.Assignment",
        alias: "store.assignmentstore",
        storeId: "assignments",
        proxy: "memory",
        eventResourceCache: null,
        resourceEventsCache: null,
        eventStoreDetacher: null,
        resourceStoreDetacher: null,
        eventStore: null,
        constructor: function(a) {
            var b = this;
            b.callParent([a]);
            b.eventAssignmentsCache = b.eventAssignmentsCache || new Sch.data.util.EventAssignmentsCache(b);
            b.resourceAssignmentsCache = b.resourceAssignmentsCache || new Sch.data.util.ResourceAssignmentsCache(b)
        },
        destroy: function() {
            var a = this;
            Ext.destroyMembers(a, "eventResourceCache", "resourceEventsCache", "eventAssignmentsCache", "resourceEventsCache", "eventStoreDetacher", "resourceStoreDetacher");
            a.callParent()
        },
        getEventStore: function() {
            return this.eventStore
        },
        setEventStore: function(a) {
            var b = this,
                c = b.eventStore;
            if (b.eventStore) {}
            b.eventStore = a && Ext.StoreMgr.lookup(a) || null;
            if (b.eventStore) {}
            b.attachToEventStore(b.eventStore);
            if ((c || a) && c !== a) {
                b.fireEvent("eventstorechange", b, a, c)
            }
        },
        attachToEventStore: function(a) {
            var b = this;
            Ext.destroy(b.eventStoreDetacher);
            if (a && a instanceof Ext.data.TreeStore) {
                b.eventStoreDetacher = a.on({
                    noderemove: b.onEventNodeRemove,
                    resourcestorechange: b.onEventStoreResourceStoreChange,
                    scope: b,
                    destroyable: true,
                    priority: 200
                })
            } else {
                if (a) {
                    b.eventStoreDetacher = a.on({
                        remove: b.onEventRemove,
                        resourcestorechange: b.onEventStoreResourceStoreChange,
                        scope: b,
                        destroyable: true,
                        priority: 200
                    })
                }
            }
            b.attachToResourceStore(a && a.getResourceStore())
        },
        attachToResourceStore: function(b) {
            var a = this;
            Ext.destroy(a.resourceStoreDetacher);
            if (b && b instanceof Ext.data.TreeStore) {
                a.resourceStoreDetacher = b.on({
                    noderemove: a.onResourceNodeRemove,
                    scope: a,
                    destroyable: true,
                    priority: 200
                })
            } else {
                if (b) {
                    a.resourceStoreDetacher = b.on({
                        remove: a.onResourceRemove,
                        scope: a,
                        destroyable: true,
                        priority: 200
                    })
                }
            }
        },
        onEventStoreResourceStoreChange: function(b, a, c) {
            this.attachToResourceStore(a)
        },
        onEventRemove: function(e, d, c, b) {
            var f = this,
                a;
            if (!b) {
                a = [];
                Ext.Array.forEach(d, function(g) {
                    a = a.concat(f.getAssignmentsForEvent(g))
                });
                a.length && f.remove(a)
            }
        },
        onEventNodeRemove: function(c, e, b) {
            var d = this,
                a;
            if (!b) {
                a = [];
                e.cascadeBy(function(f) {
                    a = a.concat(d.getAssignmentsForEvent(f))
                });
                a.length && d.remove(a)
            }
        },
        onResourceRemove: function(e, f, c, b) {
            var d = this,
                a;
            if (!b) {
                a = [];
                Ext.Array.forEach(f, function(g) {
                    a = a.concat(d.getAssignmentsForResource(g))
                });
                a.length && d.remove(a)
            }
        },
        onResourceNodeRemove: function(d, e, b) {
            var c = this,
                a;
            if (!b) {
                a = [];
                e.cascadeBy(function(f) {
                    a = a.concat(c.getAssignmentsForResource(f))
                });
                a.length && c.remove(a)
            }
        },
        mapAssignmentsForEvent: function(d, b, e) {
            var c = this,
                a = [];
            b = b || Ext.identityFn;
            e = e || Ext.returnTrue;
            if (b !== Ext.identityFn || e !== Ext.returnTrue) {
                Ext.Array.forEach(c.eventAssignmentsCache.get(d), function(g) {
                    var f = b(g);
                    e(f) && a.push(f)
                })
            } else {
                a = [].concat(c.eventAssignmentsCache.get(d))
            }
            return a
        },
        mapAssignmentsForResource: function(d, b, e) {
            var c = this,
                a = [];
            b = b || Ext.identityFn;
            e = e || Ext.returnTrue;
            if (b !== Ext.identityFn || e !== Ext.returnTrue) {
                Ext.Array.forEach(c.resourceAssignmentsCache.get(d), function(g) {
                    var f = b(g);
                    e(f) && a.push(f)
                })
            } else {
                a = [].concat(c.resourceAssignmentsCache.get(d))
            }
            return a
        },
        getAssignmentsForEvent: function(a) {
            return this.mapAssignmentsForEvent(a)
        },
        removeAssignmentsForEvent: function(b) {
            var a = this;
            a.remove(a.getAssignmentsForEvent(b))
        },
        getAssignmentsForResource: function(a) {
            return this.mapAssignmentsForResource(a)
        },
        removeAssignmentsForResource: function(b) {
            var a = this;
            a.remove(a.getAssignmentsForResource(b))
        },
        getResourcesForEvent: function(d) {
            var c = this,
                a;
            if (c.eventResourceCache) {
                a = c.eventResourceCache.get(d)
            } else {
                a = c.mapAssignmentsForEvent(d, function e(f) {
                    return f.getResource()
                }, function b(f) {
                    return !!f
                })
            }
            return a
        },
        getEventsForResource: function(d) {
            var c = this,
                a;
            if (c.resourceEventsCache) {
                a = c.resourceEventsCache.get(d)
            } else {
                a = c.mapAssignmentsForResource(d, function e(f) {
                    return f.getEvent()
                }, function b(f) {
                    return !!f
                })
            }
            return a
        },
        assignEventToResource: function(c, e, d) {
            var b = this,
                a = [];
            d = d || Ext.identityFn;
            var f = Ext.isArray(e) ? e : [e];
            Ext.Array.forEach(f, function(g) {
                if (!b.isEventAssignedToResource(c, g)) {
                    var h = new b.model();
                    h.setEventId(c instanceof Ext.data.Model && c.getId() || c);
                    h.setResourceId(g instanceof Ext.data.Model && g.getId() || g);
                    h = d(h);
                    a.push(h)
                }
            });
            b.add(a);
            return a
        },
        unassignEventFromResource: function(b, c) {
            var a = this,
                d;
            if (!c) {
                this.removeAssignmentsForEvent(b)
            } else {
                if (a.isEventAssignedToResource(b, c)) {
                    d = a.getAssignmentForEventAndResource(b, c);
                    a.remove(d)
                }
            }
            return d
        },
        isEventAssignedToResource: function(f, g) {
            var e = this,
                c = e.getResourcesForEvent(f),
                b = false,
                d, a;
            g = g instanceof Ext.data.Model && g.getId() || g;
            for (d = 0, a = c.length; !b && d < a; d++) {
                b = c[d];
                b = b.getId() == g
            }
            return b
        },
        getAssignmentForEventAndResource: function(f, g) {
            var e = this,
                c = e.getAssignmentsForEvent(f),
                b = null,
                d, a;
            g = g instanceof Ext.data.Model && g.getId() || g;
            for (d = 0, a = c.length; !b && d < a; d++) {
                b = c[d];
                b = b.getResourceId() == g && b || null
            }
            return b
        }
    });
