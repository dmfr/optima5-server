    Ext.define("Sch.data.EventStore", {
        extend: "Ext.data.Store",
        alias: "store.eventstore",
        mixins: ["Sch.data.mixin.UniversalModelGetter", "Sch.data.mixin.CacheHintHelper", "Sch.data.mixin.EventStore"],
        storeId: "events",
        model: "Sch.model.Event",
        config: {
            model: "Sch.model.Event"
        },
        constructor: function(a) {
            var b = this;
            b.callParent([a]);
            b.resourceStore && b.setResourceStore(b.resourceStore);
            b.assignmentStore && b.setAssignmentStore(b.assignmentStore);
            if (b.getModel() !== Sch.model.Event && !(b.getModel().prototype instanceof Sch.model.Event)) {
                throw "The model for the EventStore must subclass Sch.model.Event"
            }
        },
        append: function(a) {
            this.add(a)
        }
    });
