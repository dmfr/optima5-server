Ext.define('RsiRecouveoFileTplModel',{ // TO: RsiRecouveoFileModel
	extend: 'Ext.data.Model',
	idProperty: 'file_filerecord_id',
	fields: [
		{name: 'file_filerecord_id', type:'int'},
		{name: 'id_ref', type:'string'},
		{name: 'acc_id', type:'string'},
		{name: 'acc_txt', type:'string'},
		{name: 'acc_siret', type:'string'},
		{name: 'status', type:'string'},
		{name: 'status_closed', type:'boolean'},
		{name: 'date_open', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_last', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'next_action', type: 'string', allowNull:true},
		{name: 'next_date', type:'date', dateFormat:'Y-m-d H:i:s', allowNull:true},
		{name: 'inv_nb', type: 'number'},
		{name: 'inv_amount_due', type: 'number'},
		{name: 'inv_amount_total', type: 'number'}
	]
}) ;
Ext.define('RsiRecouveoFileActionModel',{
	extend: 'Ext.data.Model',
	idProperty: 'fileaction_filerecord_id',
	fields: [
		{name: 'fileaction_filerecord_id', type:'int'},
		{name: 'link_status', type:'string'},
		{name: 'link_action', type:'string'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'date_sched', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_actual', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'txt', type: 'string'},
		
		{name: 'calc_eta_range', type:'string'}
	]
}) ;
Ext.define('RsiRecouveoRecordTplModel',{ // TO: RsiRecouveoRecordModel
	extend: 'Ext.data.Model',
	idProperty: 'record_filerecord_id',
	fields: [
		{name: 'record_filerecord_id', type:'int'},
		{name: 'acc_id', type:'string'},
		{name: 'date_record', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_value', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'amount', type:'number'},
		{name: 'clear_is_on', type:'boolean'},
		{name: 'clear_assign', type: 'string'}
	]
}) ;
Ext.define('RsiRecouveoAdrPostalModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adrpostal_filerecord_id',
	fields: [
		{name: 'adrpostal_filerecord_id', type:'int'},
		{name: 'adr_name', type:'string'},
		{name: 'adr_postal_txt', type:'string'},
		{name: 'status', type:'boolean'}
	]
}) ;
Ext.define('RsiRecouveoAdrTelModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adrtel_filerecord_id',
	fields: [
		{name: 'adrtel_filerecord_id', type:'int'},
		{name: 'adr_name', type:'string'},
		{name: 'adr_tel_txt', type:'string'},
		{name: 'status', type:'boolean'}
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
				Ext.apply( eventParams, {
					fileNew: postParams.fileNew,
					fileFilerecordId: postParams.fileFilerecordId
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
