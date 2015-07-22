    Ext.define("Sch.data.mixin.UniversalModelGetter", {
        getModelById: function(b) {
            var a = this;
            return a.getNodeById ? a.getNodeById(b) : a.getById(b)
        },
        getModelByInternalId: function(b) {
            var a = this;
            return a.byInternalIdMap ? a.byInternalIdMap[b] : a.getByInternalId(b)
        }
    });
