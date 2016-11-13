Ext.define('RsiRecouveoFileModel',{
	extend: 'Ext.data.Model',
	idProperty: 'filerecord_id',
	fields: [
		{name: 'filerecord_id', type:'int'},
		{name: 'atr_bu', type:'string'},
		{name: 'atr_div', type:'string'},
		{name: 'atr_sect', type:'string'},
		{name: 'id_ref', type:'string'},
		{name: 'id_txt', type:'string'},
		{name: 'status_txt', type:'string'},
		{name: 'status_color', type: 'string'},
		{name: 'inv_nb', type: 'string'},
		{name: 'inv_amount_due', type: 'string'},
		{name: 'inv_amount_total', type: 'string'}
	]
}) ;



Ext.define('Optima5.Modules.Spec.RsiRecouveo.RsiRecouveoModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.MainPanel',{
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
				
			case 'openfile' :
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
