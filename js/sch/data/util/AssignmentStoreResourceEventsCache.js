    Ext.define("Sch.data.util.AssignmentStoreResourceEventsCache", {
        extend: "Sch.util.Cache",
        requires: ["Ext.data.Model"],
        assignmentStore: null,
        assignmentStoreDetacher: null,
        eventStoreDetacher: null,
        resourceStoreDetacher: null,
        constructor: function(j) {
            var l = this,
                f = j.getEventStore(),
                o = f && f.getResourceStore();
            l.callParent();

            function m(s, r) {
                var t = l.assignmentStore.getEventStore();
                Ext.Array.forEach(r, function(v) {
                    var u = t && t.getModelById(v.getEventId());
                    if (u) {
                        l.add(v.getResourceId(), u)
                    } else {
                        l.clear(v.getResourceId())
                    }
                })
            }

            function b(s, r) {
                var t = l.assignmentStore.getEventStore();
                Ext.Array.forEach(r, function(v) {
                    var u = t && t.getModelById(v.getEventId());
                    if (u) {
                        l.remove(v.getResourceId(), u)
                    } else {
                        l.clear(v.getResourceId())
                    }
                })
            }

            function q(A, t, x) {
                var y = t.resourceIdField,
                    B = t.previous && y in t.previous,
                    v = B && t.previous[y],
                    z = t.eventIdField,
                    r = t.previous && z in t.previous,
                    u = r && t.previous[z],
                    w = l.assignmentStore.getEventStore(),
                    s;
                if (x != Ext.data.Model.COMMIT && (B || r)) {
                    v = B ? v : t.getResourceId();
                    u = r ? u : t.getEventId();
                    s = w && w.getModelById(u);
                    if (s) {
                        l.remove(v, s)
                    } else {
                        l.clear(v)
                    }
                    s = w && w.getModelById(t.getEventId());
                    if (s) {
                        l.add(t.getResourceId(), s)
                    } else {
                        l.clear(t.getResourceId())
                    }
                }
            }

            function n(r) {
                l.clear()
            }

            function c(r, s) {
                l.clear();
                a(s);
                d(s && s.getResourceStore())
            }

            function g(s, r) {
                Ext.Array.forEach(r, function(t) {
                    l.uncache(t)
                })
            }

            function i() {
                l.clear()
            }

            function p(r, s) {
                l.clear();
                d(s)
            }

            function k(s, t, u, r) {
                l.move(u, r)
            }

            function h(r, s) {
                Ext.Array.forEach(s, function(t) {
                    l.clear(t)
                })
            }

            function e() {
                l.clear()
            }

            function a(r) {
                Ext.destroy(l.eventStoreDetacher);
                l.eventStoreDetacher = r && r.on({
                    remove: g,
                    cacheresethint: i,
                    clear: i,
                    rootchange: i,
                    resourcestorechange: p,
                    priority: 100,
                    destroyable: true
                })
            }

            function d(r) {
                Ext.destroy(l.resourceStoreDetacher);
                l.resourceStoreDetacher = r && r.on({
                    idchanged: k,
                    remove: h,
                    cacheresethint: e,
                    clear: e,
                    rootchange: e,
                    priority: 100,
                    destroyable: true
                })
            }
            l.assignmentStoreDetacher = j.on({
                add: m,
                remove: b,
                update: q,
                cacheresethint: n,
                clear: n,
                eventstorechange: c,
                priority: 100,
                destroyable: true
            });
            a(f);
            d(o);
            l.assignmentStore = j
        },
        destroy: function() {
            var a = this;
            Ext.destroyMembers(a, "assignmentStoreDetacher", "eventStoreDetacher", "resourceStoreDetacher");
            a.assignmentStore = null
        },
        get: function(a, b) {
            var c = this;
            b = b || function() {
                return c.assignmentStore.mapAssignmentsForResource(a, function e(f) {
                    return f.getEvent()
                }, function d(f) {
                    return !!f
                })
            };
            return c.callParent([a, b])
        }
    });
