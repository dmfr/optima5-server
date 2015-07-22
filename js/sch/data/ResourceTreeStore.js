    Ext.define("Sch.data.ResourceTreeStore", {
        extend: "Ext.data.TreeStore",
        model: "Sch.model.Resource",
        storeId: "resources",
        requires: ["Sch.patches.TreeStore"],
        mixins: ["Sch.patches.NodeStore", "Sch.data.mixin.UniversalModelGetter", "Sch.data.mixin.CacheHintHelper", "Sch.data.mixin.ResourceStore", "Sch.data.mixin.FilterableTreeStore"],
        alias: "store.resourcetreestore",
        constructor: function() {
            this.callParent(arguments);
            this.initTreeFiltering();
            if (this.getModel() !== Sch.model.Resource && !(this.getModel().prototype instanceof Sch.model.Resource)) {
                throw "The model for the ResourceTreeStore must subclass Sch.model.Resource"
            }
        },
        setRootNode: function() {
            this.isSettingRoot = true;
            var a = this.callParent(arguments);
            this.isSettingRoot = false;
            return a
        }
    });
