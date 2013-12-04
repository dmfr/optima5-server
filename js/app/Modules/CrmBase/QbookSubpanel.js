Ext.define('Optima5.Modules.CrmBase.QbookSubpanel' ,{
	extend: 'Ext.panel.Panel',
			  
	parentQbookPanel: null,
	inputvarRecords: [],
	inputvarFieldType: null,
	inputvarFieldLinkbible: null,

	initComponent: function() {
		this.callParent() ;
	},
			  
	getQbookPanel: function() {
		return this.parentQbookPanel ;
	},
	getParentId: function() {
		if( this.getQbookPanel() ) {
			return this.getQbookPanel().getId() ;
		}
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