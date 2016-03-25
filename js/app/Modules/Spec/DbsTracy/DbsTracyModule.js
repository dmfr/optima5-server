Ext.define('Optima5.Modules.Spec.DbsTracy.DbsTracyModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsTracy.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.DbsTracy.MainPanel',{
				optimaModule: me,
				border: false
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
			case 'opentrspt' :
				Ext.apply( eventParams, {
					trsptNew: postParams.trsptNew,
					trsptFilerecordId: postParams.trsptFilerecordId
				}) ;
				break ;
			case 'openorder' :
				Ext.apply( eventParams, {
					orderNew: postParams.orderNew,
					orderFilerecordId: postParams.orderFilerecordId
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
