Ext.define("Sch.crud.encoder.Json", {
    format: "json",
    encode: function(a) {
        return Ext.JSON.encode(a)
    },
    decode: function(a) {
        if (typeof a == "object") {
            return a
        }
        return Ext.JSON.decode(a, true)
    }
});
