Ext.define('Ext.ux.dams.ModelManager',{
	statics: {
		create: function(modelName,data) {
			var tmpStore,
				isArray = Ext.isArray(data) ;
				
			data = isArray ? data : [data] ;
			
			tmpStore = Ext.create('Ext.data.Store',{
				autoLoad: true,
				sortOnLoad: false,
				sortOnFilter: false,
				model: modelName,
				data : data,
				proxy: {
					type: 'memory'
				}
			});
			
			return isArray ? tmpStore.getRange() : tmpStore.getAt(0) ;
		},
		unregister: function(modelName) {
			Ext.ModelManager.unregisterType(modelName) ;
			Ext.undefine(modelName) ;
		}
	}
});