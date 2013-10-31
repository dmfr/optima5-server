Ext.define('Optima5.Modules.Spec.WbMrfoxy.WbMrfoxyModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.WbMrfoxy.MainWindow'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		me.createWindow({},Optima5.Modules.Spec.WbMrfoxy.MainWindow) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});