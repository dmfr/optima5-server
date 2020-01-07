Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptLabelPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'fit',
			items: [{
				xtype: 'box',
				cls:'op5-waiting'
			}]
		});
		this.callParent() ;
	},
	loadFromTrsptEvent: function(trsptFilerecordId, trspteventFilerecordId) {
		
	},
	onLoadLabelData: function( labelData ) {
		
	}
}) ;
