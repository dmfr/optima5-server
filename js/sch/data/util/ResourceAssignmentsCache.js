Ext.define("Sch.data.util.ResourceAssignmentsCache", {
    extend: "Sch.util.Cache",
    requires: ["Ext.data.Model"],
    assignmentStore: null,
    assignmentStoreDetacher: null,
    eventStoreDetacher: null,
    resourceStoreDetacher: null,
    constructor: function(h) {
        var j = this,
            f = h.getEventStore(),
            m = f && f.getResourceStore();
        j.callParent();

        function k(q, p) {
            Ext.Array.forEach(p, function(r) {
                j.add(r.getResourceId(), r)
            })
        }

        function b(q, p) {
            Ext.Array.forEach(p, function(r) {
                j.remove(r.getResourceId(), r)
            })
        }

        function o(r, u, q) {
            var t = u.resourceIdField,
                s = u.previous && t in u.previous,
                p = s && u.previous[t];
            if (q != Ext.data.Model.COMMIT && s) {
                j.move(p, u.getResourceId(), u)
            }
        }

        function l(p) {
            j.clear()
        }

        function c(p, q) {
            a(q);
            d(q && q.getResourceStore())
        }

        function n(p, q) {
            j.clear();
            d(q)
        }

        function i(q, r, s, p) {
            j.move(s, p)
        }

        function g(p, q) {
            Ext.Array.forEach(q, function(r) {
                j.clear(r)
            })
        }

        function e() {
            j.clear()
        }

        function a(p) {
            Ext.destroy(j.eventStoreDetacher);
            j.eventStoreDetacher = p && p.on({
                resourcestorechange: n,
                priority: 100,
                destroyable: true
            })
        }

        function d(p) {
            Ext.destroy(j.resourceStoreDetacher);
            j.resourceStoreDetacher = p && p.on({
                idchanged: i,
                remove: g,
                clear: e,
                cacheresethint: e,
                rootchange: e,
                priority: 100,
                destroyable: true
            })
        }
        j.assignmentStoreDetacher = h.on({
            add: k,
            remove: b,
            update: o,
            clear: l,
            cacheresethint: l,
            eventstorechange: c,
            priority: 100,
            destroyable: true
        });
        a(f);
        d(m);
        j.assignmentStore = h
    },
    destroy: function() {
        var a = this;
        Ext.destroyMembers(a, "assignmentStoreDetacher", "eventStoreDetacher", "resourceStoreDetacher");
        a.assignmentStore = null
    },
    get: function(a, b) {
        var c = this;
        a = c.key(a);
        b = b || function() {
            return Ext.Array.filter(c.assignmentStore.getRange(), function(d) {
                return d.getResourceId() == a
            })
        };
        return c.callParent([a, b])
    }
});
