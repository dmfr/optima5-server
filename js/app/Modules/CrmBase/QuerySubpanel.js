Ext.define('Optima5.Modules.CrmBase.QuerySubpanel' ,{
	extend: 'Ext.panel.Panel',

	initComponent: function() {
		this.callParent() ;
	},
			  
	getQueryPanel: function() {
		var objPanel = this.up('op5crmbasequery') ;
		if( typeof objPanel !== 'undefined' ) {
			return objPanel ;
		}
		return null ;
	},
			  
	saveGetArray: function() {
		var saveArr = [] ;
		var saveObj ;
		
		var records = this.query('>grid')[0].getStore().getRange();
		for (var i = 0; i < records.length; i++) {
			saveObj = {} ;
			Ext.apply( saveObj, records[i].data ) ;
			Ext.apply( saveObj, records[i].getAssociatedData() ) ;
			saveArr.push(saveObj);
		}
		
		return saveArr ;
	}
});