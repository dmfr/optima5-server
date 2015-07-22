Ext.define('Optima5.Modules.CrmBase.CrmBaseModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.CrmBase.MainWindow'
	],
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({},Optima5.Modules.CrmBase.MainWindow) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		var me = this ;
		if( typeof postParams === 'undefined' ) {
			postParams = {} ;
		}
		
		var eventParams = {} ;
		switch( crmEvent ) {
			case 'datachange' :
			case 'definechange' :
			case 'togglepublishdata' :
				Ext.apply( eventParams, {
					dataType: postParams.dataType,
					bibleId: postParams.bibleId,
					fileId: postParams.fileId
				}) ;
				break ;
			
			case 'querychange' :
			case 'togglepublishquery' :
				Ext.apply( eventParams, {
					qType: postParams.qType,
					queryId: postParams.queryId,
					qmergeId: postParams.qmergeId,
					qwebId: postParams.qwebId
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});