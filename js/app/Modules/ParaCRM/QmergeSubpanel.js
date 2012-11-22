Ext.define('Optima5.Modules.ParaCRM.QmergeSubpanel' ,{
	extend: 'Ext.panel.Panel',
			  
	parentQmergePanel: null,

	initComponent: function() {
		this.callParent() ;
	},
			  
	getQmergePanel: function() {
		return this.parentQmergePanel ;
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