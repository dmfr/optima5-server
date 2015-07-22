Ext.define("Sch.data.util.EventAssignmentsCache", {
    extend: "Sch.util.Cache",
    requires: ["Ext.data.Model"],
    assignmentStore: null,
    assignmentStoreDetacher: null,
    eventStoreDetacher: null,
    constructor: function(g) {
        var h = this,
            d = g.getEventStore();
        h.callParent();

        function j(n, m) {
            Ext.Array.forEach(m, function(o) {
                h.add(o.getEventId(), o)
            })
        }

        function b(n, m) {
            Ext.Array.forEach(m, function(o) {
                h.remove(o.getEventId(), o)
            })
        }

        function l(o, r, n) {
            var p = r.eventIdField,
                m = r.previous && p in r.previous,
                q = m && r.previous[p];
            if (n != Ext.data.Model.COMMIT && m) {
                h.move(q, r.getEventId(), r)
            }
        }

        function k(m) {
            h.clear()
        }

        function c(m, n) {
            h.clear();
            a(n)
        }

        function i(n, o, p, m) {
            h.move(p, m)
        }

        function e(n, m) {
            Ext.Array.forEach(m, function(o) {
                h.clear(o)
            })
        }

        function f() {
            h.clear()
        }

        function a(m) {
            Ext.destroy(h.eventStoreDetacher);
            h.eventStoreDetacher = m && m.on({
                idchanged: i,
                remove: e,
                cacheresethint: f,
                clear: f,
                rootchange: f,
                priority: 100,
                destroyable: true
            })
        }
        h.assignmentStoreDetacher = g.on({
            add: j,
            remove: b,
            update: l,
            cacheresethint: k,
            clear: k,
            eventstorechange: c,
            priority: 100,
            destroyable: true
        });
        a(d);
        h.assignmentStore = g
    },
    destroy: function() {
        var a = this;
        Ext.destroyMembers(a, "assignmentStoreDetacher", "eventStoreDetacher");
        a.assignmentStore = null
    },
    get: function(a, b) {
        var c = this;
        a = c.key(a);
        b = b || function() {
            return Ext.Array.filter(c.assignmentStore.getRange(), function(d) {
                return d.getEventId() == a
            })
        };
        return c.callParent([a, b])
    }
});
