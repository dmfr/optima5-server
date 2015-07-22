    Ext.define("Sch.data.util.AssignmentStoreEventResourcesCache", {
        extend: "Sch.util.Cache",
        requires: ["Ext.data.Model"],
        assignmentStore: null,
        assignmentStoreDetacher: null,
        eventStoreDetacher: null,
        resourceStoreDetacher: null,
        constructor: function(j) {
            var k = this,
                f = j.getEventStore(),
                o = f && f.getResourceStore();
            k.callParent();

            function m(s, r) {
                var t = k.assignmentStore.getEventStore(),
                    u = t && t.getResourceStore();
                Ext.Array.forEach(r, function(w) {
                    var v = u && u.getModelById(w.getResourceId());
                    if (v) {
                        k.add(w.getEventId(), v)
                    } else {
                        k.clear(w.getEventId())
                    }
                })
            }

            function b(s, r) {
                var t = k.assignmentStore.getEventStore(),
                    u = t && t.getResourceStore();
                Ext.Array.forEach(r, function(w) {
                    var v = u.getModelById(w.getResourceId());
                    if (v) {
                        k.remove(w.getEventId(), v)
                    } else {
                        k.clear(w.getEventId())
                    }
                })
            }

            function q(B, s, x) {
                var y = s.resourceIdField,
                    C = s.previous && y in s.previous,
                    u = C && s.previous[y],
                    z = s.eventIdField,
                    r = s.previous && z in s.previous,
                    t = r && s.previous[z],
                    w = k.assignmentStore.getEventStore(),
                    A = w && w.getResourceStore(),
                    v;
                if (x != Ext.data.Model.COMMIT && (C || r)) {
                    u = C ? u : s.getResourceId();
                    t = r ? t : s.getEventId();
                    v = A.getModelById(u);
                    if (v) {
                        k.remove(t, v)
                    } else {
                        k.clear(t)
                    }
                    v = A.getModelById(s.getResourceId());
                    if (v) {
                        k.add(s.getEventId(), v)
                    } else {
                        k.clear(s.getEventId())
                    }
                }
            }

            function n(r) {
                k.clear()
            }

            function c(r, s) {
                k.clear();
                a(s);
                d(s && s.getResourceStore())
            }

            function l(s, t, u, r) {
                k.move(u, r)
            }

            function g(s, r) {
                Ext.Array.forEach(r, function(t) {
                    k.clear(t)
                })
            }

            function i() {
                k.clear()
            }

            function p(r, s) {
                k.clear();
                d(s)
            }

            function h(r, s) {
                Ext.Array.forEach(s, function(t) {
                    k.uncache(t)
                })
            }

            function e() {
                k.clear()
            }

            function a(r) {
                Ext.destroy(k.eventStoreDetacher);
                k.eventStoreDetacher = r && r.on({
                    idchanged: l,
                    remove: g,
                    clear: i,
                    cacheresethint: i,
                    rootchange: i,
                    resourcestorechange: p,
                    priority: 100,
                    destroyable: true
                })
            }

            function d(r) {
                Ext.destory(k.resourceStoreDetacher);
                k.resourceStoreDetacher = r && r.on({
                    remove: h,
                    clear: e,
                    cacheresethint: e,
                    rootchange: e,
                    priority: 100,
                    destroyable: true
                })
            }
            k.assignmentStoreDetacher = j.on({
                add: m,
                remove: b,
                update: q,
                clear: n,
                cacheresethint: n,
                priority: 100,
                destroyable: true
            });
            k.assignmentStore = j
        },
        destroy: function() {
            var a = this;
            Ext.destroyMembers(a, "assignmentStoreDetacher", "eventStoreDetacher", "resourceStoreDetacher");
            a.assignmentStore = null
        },
        get: function(a, b) {
            var c = this;
            b = b || function() {
                return c.assignmentStore.mapAssignmentsForEvent(a, function e(f) {
                    return f.getResource()
                }, function d(f) {
                    return !!f
                })
            };
            return c.callParent([a, b])
        }
    });
