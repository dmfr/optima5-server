Ext.define('Optima5.Modules.Spec.WbMrfoxy.WbMrfoxyModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		me.createWindow({
			width:900,
			height:640,
			resizable:true,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.WbMrfoxy.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});