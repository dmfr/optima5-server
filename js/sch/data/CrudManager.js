Ext.define("Sch.data.CrudManager", {
    extend: "Sch.crud.AbstractManager",
    mixins: ["Sch.crud.encoder.Json", "Sch.crud.transport.Ajax"],
    resourceStore: null,
    eventStore: null,
    assignmentStore: null,
    addRelatedStores: true,
    constructor: function(c) {
        c = c || {};
        var f = c.resourceStore || this.resourceStore,
            d = c.eventStore || this.eventStore,
            h = c.assignmentStore || this.assignmentStore,
            b = [];
        if (d && c.addRelatedStores !== false) {
            var a = this.getEventStoreInfo(d, c);
            h = h || a.assignmentStore;
            f = f || a.resourceStore
        }
        d && b.push(d);
        f && b.push(f);
        h && b.push(h);
        if (b.length) {
            var g = [];
            f && g.push(f);
            d && g.push(d);
            h && g.push(h);
            if (g.length) {
                c.syncApplySequence = (c.syncApplySequence || c.stores || []).concat(g)
            }
            var e = c.stores || this.stores;
            if (e && !Ext.isArray(e)) {
                e = [e]
            }
            c.stores = (e || []).concat(b)
        }
        this.callParent([c]);
        this.eventStore = this.getStoreDescriptor(d);
        this.resourceStore = this.getStoreDescriptor(f);
        this.assignmentStore = this.getStoreDescriptor(h)
    },
    getEventStoreInfo: function(c, b) {
        if (!(c instanceof Ext.data.AbstractStore)) {
            if (typeof c == "string") {
                c = Ext.data.StoreManager.get(c)
            } else {
                c = c.store
            }
        }
        var a = {},
            e = b.assignmentStore,
            d = b.resourceStore;
        !e && (a.assignmentStore = c.getAssignmentStore());
        !d && (a.resourceStore = c.getResourceStore());
        return a
    },
    getResourceStore: function() {
        return this.resourceStore && this.resourceStore.store
    },
    getEventStore: function() {
        return this.eventStore && this.eventStore.store
    },
    getAssignmentStore: function() {
        return this.assignmentStore && this.assignmentStore.store
    }
});
