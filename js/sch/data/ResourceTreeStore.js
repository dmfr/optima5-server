Ext.define("Sch.data.ResourceTreeStore", {
    extend: "Ext.data.TreeStore",
    model: "Sch.model.Resource",
    mixins: ["Sch.data.mixin.ResourceStore", "Sch.data.mixin.FilterableTreeStore"],
    constructor: function () {
        this.callParent(arguments);
        this.initTreeFiltering();
        if (this.getModel() !== Sch.model.Resource && !(this.getModel().prototype instanceof Sch.model.Resource)) {
            throw "The model for the ResourceTreeStore must subclass Sch.model.Resource"
        }
    },
    setRootNode: function () {
        this.isSettingRoot = true;
        var a = this.callParent(arguments);
        this.isSettingRoot = false;
        return a
    }
}, function () {
    this.override(Sch.data.mixin.FilterableTreeStore.prototype.inheritables() || {})
});
