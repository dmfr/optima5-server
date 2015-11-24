Ext.define('Optima5.Modules.Spec.DbsLam.DbsLamModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsLam.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.MainPanel',{
				optimaModule: me
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		var me = this ;
		if( typeof postParams === 'undefined' ) {
			postParams = {} ;
		}
		
		var eventParams = {} ;
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});