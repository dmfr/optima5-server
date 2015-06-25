    Ext.define("Sch.data.mixin.ResourceStore", {
        eventStore: null,
        getEventStore: function() {
            return this.eventStore
        },
        setEventStore: function(a) {
            var b = this,
                c;
            if (b.eventStore !== a) {
                c = b.eventStore;
                b.eventStore = a && Ext.StoreMgr.lookup(a) || null;
                b.fireEvent("eventstorechange", b, a, c)
            }
        }
    });
