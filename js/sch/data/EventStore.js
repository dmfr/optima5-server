Ext.define("Sch.data.EventStore", {
    extend: "Ext.data.Store",
    model: "Sch.model.Event",
    config: {
        model: "Sch.model.Event"
    },
    mixins: ["Sch.data.mixin.EventStore"],
    constructor: function () {
        this.callParent(arguments);
        if (this.getModel() !== Sch.model.Event && !(this.getModel().prototype instanceof Sch.model.Event)) {
            throw "The model for the EventStore must subclass Sch.model.Event"
        }
    },
    getByInternalId: function (a) {
        return this.data.getByKey(a)
    },
    append: function (a) {
        this.add(a)
    }
});
