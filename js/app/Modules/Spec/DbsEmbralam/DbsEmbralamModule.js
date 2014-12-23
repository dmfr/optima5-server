Ext.define('Optima5.Modules.Spec.DbsEmbralam.DbsEmbralamModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsEmbralam.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsEmbralam.MainPanel',{
				optimaModule: me
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});