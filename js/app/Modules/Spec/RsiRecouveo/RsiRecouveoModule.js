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
		{name: 'inv_nb', type: 'number'},
		{name: 'inv_amount_due', type: 'number'},
		{name: 'inv_amount_total', type: 'number'}
	],
	statusIsSchedLock: function() {
		var fileStatus = this.get('status'),
			statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(fileStatus),
			isSchedLock = !!(statusRow && statusRow.sched_lock) ;
		return isSchedLock ;
	},
	getNextXAction: function(x) {
		var pendingActions = [] ;
		this.actions().each( function(fileActionRecord) {
			if( fileActionRecord.get('status_is_ok') ) {
				return ;
			}
			pendingActions.push({
				fileaction_filerecord_id: fileActionRecord.get('fileaction_filerecord_id'),
				date_sched: fileActionRecord.get('date_sched')
			}) ;
		}) ;
		Ext.Array.sort(pendingActions, function(o1,o2) {
			return o1.date_sched > o2.date_sched ;
		});
		var fileActionId = ( pendingActions[x-1] ? pendingActions[x-1]['fileaction_filerecord_id'] : null ) ;
		if( fileActionId ) {
			return this.actions().getById(fileActionId).getData() ;
		}
		return null ;
	},
	getNextAction: function() {
		return this.getNextXAction(1) ;
	},
	getAfterNextAction: function() {
		return this.getNextXAction(2) ;
	},
	getAvailableActions: function() {
		var availableActions = [] ;
		var statusCode = this.get('status'),
			isSchedLock = this.statusIsSchedLock() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			if( !Ext.isEmpty(action.status_open) ) {
				if( Ext.Array.contains(action.status_open,statusCode) ) {
					availableActions.push(action) ;
				}
				return ;
			}
			if( isSchedLock && (action.is_sched||action.is_direct) ) {
				return ;
			}
			if( !Ext.isEmpty(action.status_next) && Ext.Array.contains(action.status_next,statusCode) ) {
				//return ;
			}
			availableActions.push(action) ;
		}) ;
		return availableActions ;
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
		
		{name: 'calc_eta_range', type:'string'},
		
		{name: 'calc_date', type:'string', calculate: function (data) {
			if( data.status_is_ok ) {
				return Ext.Date.format(data.date_actual,'Y-m-d') ;
			} else {
				return Ext.Date.format(data.date_sched,'Y-m-d') ;
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
		{name: 'clear_is_on', type:'boolean'},
		{name: 'clear_assign', type: 'string'},
		{name: '_checked', type: 'boolean'}
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
Ext.define('RsiRecouveoAccountTplModel',{
	extend: 'Ext.data.Model',
	idProperty: 'acc_id',
	fields: [
		{name: 'acc_id', type:'string'},
		{name: 'acc_txt', type:'string'},
		{name: 'acc_siret', type:'string'}
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
			
			case 'openaccount' :
				Ext.apply( eventParams, {
					accId: postParams.accId,
					filterAtr: postParams.filterAtr
				}) ;
				break ;
			
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});
