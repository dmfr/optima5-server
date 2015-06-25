    Ext.define("Sch.data.mixin.CacheHintHelper", {
        extend: "Ext.Mixin",
        mixinConfig: {
            before: {
                loadRecords: "loadRecords"
            }
        },
        loadRecords: function() {
            var a = this;
            a.fireEvent("cacheresethint", a)
        }
    });
