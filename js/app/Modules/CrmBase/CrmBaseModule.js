Ext.define('Optima5.Modules.CrmBase.CrmBaseModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.CrmBase.MainWindow'
	],
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		var win = me.createWindow({},Optima5.Modules.CrmBase.MainWindow) ;
		win.show() ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		var me = this ;
		
		var eventParams = {} ;
		switch( crmEvent ) {
			case 'datachange' :
			case 'definechange' :
				Ext.apply( eventParams, {
					storeType: postParams.storeType,
					bibleId: postParams.bibleId,
					fileId: postParams.fileId
				}) ;
				break ;
			case 'togglepublish' :
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});