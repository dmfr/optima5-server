Ext.define("Sch.data.util.ResourceEventsCache", {
    extend: "Sch.util.Cache",
    requires: ["Ext.data.Model"],
    eventStore: null,
    eventStoreDetacher: null,
    resourceStoreDetacher: null,
    constructor: function(c) {
        var i = this,
            j = c.getResourceStore();
        i.callParent();

        function l(n, m) {
            Ext.Array.forEach(m, function(o) {
                i.add(o.getResourceId(), o)
            })
        }

        function e(n, m) {
            Ext.Array.forEach(m, function(o) {
                i.remove(o.getResourceId(), o)
            })
        }

        function d(o, r, n, q) {
            var s = r.resourceIdField,
                p = r.previous && s in r.previous,
                m = p && r.previous[s];
            if (n != Ext.data.Model.COMMIT && p) {
                i.move(m, r.getResourceId(), r)
            }
        }

        function g() {
            i.clear()
        }

        function k(n, m, o) {
            i.clear();
            a(m)
        }

        function h(n, o, p, m) {
            i.move(p, m)
        }

        function f(m, n) {
            Ext.Array.forEach(n, function(o) {
                i.clear(o)
            })
        }

        function b() {
            i.clear()
        }

        function a(m) {
            Ext.destroy(i.resourceStoreDetacher);
            i.resourceStoreDetacher = m && m.on({
                idchanged: h,
                remove: f,
                clear: b,
                cacheresethint: b,
                rootchange: b,
                priority: 100,
                destroyable: true
            })
        }
        i.eventStoreDetacher = c.on({
            add: l,
            remove: e,
            update: d,
            clear: g,
            cacheresethint: g,
            rootchange: g,
            resourcestorechange: k,
            priority: 100,
            destroyable: true
        });
        a(j);
        i.eventStore = c
    },
    destroy: function() {
        var a = this;
        Ext.destroyMembers(a, "eventStoreDetacher", "resourceStoreDetacher");
        a.eventStore = null
    },
    get: function(a, b) {
        var c = this;
        a = c.key(a);
        b = b || function() {
            return Ext.Array.filter(c.eventStore.getRange(), function(d) {
                return d.getResourceId() == a
            })
        };
        return c.callParent([a, b])
    }
});
