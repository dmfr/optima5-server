    Ext.define("Sch.data.ResourceStore", {
        extend: "Ext.data.Store",
        model: "Sch.model.Resource",
        config: {
            model: "Sch.model.Resource"
        },
        alias: "store.resourcestore",
        storeId: "resources",
        mixins: ["Sch.data.mixin.UniversalModelGetter", "Sch.data.mixin.CacheHintHelper", "Sch.data.mixin.ResourceStore"],
        constructor: function() {
            this.callParent(arguments);
            if (this.getModel() !== Sch.model.Resource && !(this.getModel().prototype instanceof Sch.model.Resource)) {
                throw "The model for the ResourceStore must subclass Sch.model.Resource"
            }
        }
    });
