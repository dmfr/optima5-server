Ext.define("Sch.data.ResourceStore", {
    extend: "Ext.data.Store",
    model: "Sch.model.Resource",
    config: {
        model: "Sch.model.Resource"
    },
    mixins: ["Sch.data.mixin.ResourceStore"],
    constructor: function () {
        this.callParent(arguments);
        if (this.getModel() !== Sch.model.Resource && !(this.getModel().prototype instanceof Sch.model.Resource)) {
            throw "The model for the ResourceStore must subclass Sch.model.Resource"
        }
    }
});
