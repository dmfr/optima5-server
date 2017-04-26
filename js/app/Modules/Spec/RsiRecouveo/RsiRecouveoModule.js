var globalMaxDate = new Date('2099-01-01') ;
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
		{name: 'next_fileaction_filerecord_id', type: 'int'},
		{name: 'next_action', type: 'string', allowNull:true},
		{name: 'next_date', type:'date', dateFormat:'Y-m-d H:i:s', allowNull:true,
			sortType: function(v) {
				if( v==null ) {
					return globalMaxDate ;
				}
				return v ;
			}
		},
		{name: 'next_eta_range', type: 'string', allowNull:true},
		{name: 'next_agenda_class', type: 'string', allowNull:true},
		{name: 'inv_nb', type: 'number'},
		{name: 'inv_amount_due', type: 'number'},
		{name: 'inv_amount_total', type: 'number'},
		{name: 'inv_balage', type: 'auto'},
		
		{name: 'from_file_filerecord_id', type:'int'}
	],
	statusIsSchedLock: function() {
		var fileStatus = this.get('status'),
			statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(fileStatus),
			isSchedLock = !!(statusRow && statusRow.sched_lock) ;
		return isSchedLock ;
	},
	statusIsSchedNone: function() {
		var fileStatus = this.get('status'),
			statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(fileStatus),
			isSchedNone = !!(statusRow && statusRow.sched_none) ;
		return isSchedNone ;
	}
}) ;

Ext.define('RsiRecouveoFileActionModel',{
	extend: 'Ext.data.Model',
	idProperty: 'fileaction_filerecord_id',
	fields: [
		{name: 'fileaction_filerecord_id', type:'int'},
		{name: 'link_status', type:'string'},
		{name: 'link_action', type:'string'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'date_sched', type:'date', dateFormat:'Y-m-d H:i:s', allowNull: true},
		{name: 'date_actual', type:'date', dateFormat:'Y-m-d H:i:s', allowNull:true},
		{name: 'txt', type: 'string'},
		
		{name: 'scenstep_code', type: 'string'},
		{name: 'scenstep_tag', type: 'string'},
		
		{name: 'link_newfile_filerecord_id', type: 'int', allowNull:true},
		{name: 'link_env_filerecord_id', type: 'int', allowNull:true},
		
		{name: 'link_tpl', type: 'string'},
		
		{name: 'calc_eta_range', type:'string'}
	]
}) ;
Ext.define('RsiRecouveoFileActionCalcModel',{
	extend: 'RsiRecouveoFileActionModel',
	idProperty: 'fileaction_filerecord_id',
	fields: [
		{name: 'calc_date', type:'string', allowNull:true, depends: ['date_sched', 'date_actual'], convert: function(value,record) {
			if( record.get('status_is_ok') ) {
				return Ext.Date.format(record.get('date_actual'),'Y-m-d') ;
			} else {
				return Ext.Date.format(record.get('date_sched'),'Y-m-d') ;
			}
		}}
	]
}) ;

Ext.define('RsiRecouveoRecordTplModel',{ // TO: RsiRecouveoRecordModel
	extend: 'Ext.data.Model',
	idProperty: 'record_filerecord_id',
	fields: [
		{name: 'record_filerecord_id', type:'int'},
		{name: 'record_id', type:'string'},
		{name: 'acc_id', type:'string'},
		{name: 'date_record', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_value', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'amount', type:'number'},
		{name: 'letter_is_on', type:'boolean'},
		{name: 'letter_code', type: 'string'},
		{name: '_checked', type: 'boolean'},
		
		{name: 'calc_balage_segmt_id', type:'string'}
	]
}) ;
Ext.define('RsiRecouveoRecordLinkModel',{
	extend: 'Ext.data.Model',
	idProperty: 'recordlink_filerecord_id',
	fields: [
		{name: 'recordlink_filerecord_id', type:'int'},
		{name: 'file_filerecord_id', type:'int'},
		{name: 'file_id_ref', type:'string'},
		{name: 'link_is_active', type:'boolean'},
		{name: 'date_link_on', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'date_link_off', type:'date', dateFormat:'Y-m-d H:i:s'}
	]
}) ;

Ext.define('RsiRecouveoAdrbookEntryModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adrbookentry_filerecord_id',
	fields: [
		{name: 'adrbookentry_filerecord_id', type:'int'},
		{name: 'adr_type', type:'string'},
		{name: 'adr_txt', type:'string'},
		{name: 'status_is_priority', type:'boolean'},
		{name: 'status_is_confirm', type:'boolean'},
		{name: 'status_is_invalid', type:'boolean'}
	]
}) ;
Ext.define('RsiRecouveoAdrbookModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adrbook_filerecord_id',
	fields: [
		{name: 'adrbook_filerecord_id', type:'int'},
		{name: 'adr_entity', type:'string'},
		{name: 'adr_entity_obs', type:'string'}
	],
	hasMany: [{
		model: 'RsiRecouveoAdrbookEntryModel',
		name: 'adrbookentries',
		associationKey: 'adrbookentries'
	}]
}) ;

Ext.define('RsiRecouveoAccountTplModel',{
	extend: 'Ext.data.Model',
	idProperty: 'acc_id',
	fields: [
		{name: 'acc_id', type:'string'},
		{name: 'acc_txt', type:'string'},
		{name: 'acc_siret', type:'string'},
		{name: 'adr_postal', type:'string'}
	]
}) ;

Ext.define('RsiRecouveoEnvelopeDocumentPreviewModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'page_index', type:'int'},
		{name: 'thumb_base64', type:'string'}
	]
});
Ext.define('RsiRecouveoEnvelopeDocumentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'envdoc_media_id',
	fields: [
		{name: 'envdoc_media_id', type:'string'},
		{name: 'envdoc_filerecord_id', type:'int', allowNull:true},
		{name: 'doc_desc', type:'string'},
		{name: 'doc_pagecount', type:'int'}
	]
});
Ext.define('RsiRecouveoEnvelopeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'env_filerecord_id',
	fields: [
		{name: 'env_filerecord_id', type:'int'},
		{name: 'env_title', type:'string'},
		{name: 'env_date', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'file_filerecord_id', type: 'int'},
		{name: 'file_id_ref', type: 'string'},
		{name: 'peer_code', type: 'string'},
		{name: 'peer_adr', type: 'string'},
		{name: 'stat_count_doc', type: 'int'},
		{name: 'stat_count_page', type: 'int'}
	],
	hasMany: [{
		model: 'RsiRecouveoEnvelopeDocumentModel',
		name: 'docs',
		associationKey: 'docs'
	}]
});



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
			
			case 'openaccount' :
				Ext.apply( eventParams, {
					accId: postParams.accId,
					filterAtr: postParams.filterAtr,
					focusFileFilerecordId: postParams.focusFileFilerecordId
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
