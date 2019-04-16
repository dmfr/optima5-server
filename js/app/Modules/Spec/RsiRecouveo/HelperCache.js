Ext.define('RsiRecouveoCfgNodeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'node', type:'string'},
		{name: 'id', type:'string'},
		{name: 'text', type:'string'},
		{name: 'parent', type:'string'}
	]
});

Ext.define('RsiRecouveoLoadMsg', {
    singleton: true,
    loadMsg: 'Chargement en cours...'

});
Ext.define('RsiRecouveoCfgOptItemModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'node', type:'string'},
		{name: 'id', type:'string'},
		{name: 'text', type:'string'},
		{name: 'next', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgOptModel',{
	extend: 'Ext.data.Model',
	idProperty: 'bible_code',
	fields: [
		{name: 'bible_code', type:'string'},
		{name: 'atr_code', type:'string'},
		{name: 'atr_txt', type:'string'}
	],
	hasMany: [{
		model: 'RsiRecouveoCfgOptItemModel',
		name: 'records',
		associationKey: 'records'
	}]
});

Ext.define('RsiRecouveoCfgAtrLibModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'node', type:'string'},
		{name: 'id', type:'string'},
		{name: 'text', type:'string'},
		{name: 'next', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgAtrModel',{
	extend: 'Ext.data.Model',
	idProperty: 'atr_id',
	fields: [
		{name: 'atr_id', type:'string'},
		{name: 'atr_desc', type:'string'},
		{name: 'atr_field', type:'string'},
		{name: 'atr_type', type:'string'},
		{name: 'is_filter', type:'boolean'},
		{name: 'is_globalfilter', type:'boolean'},
		{name: 'is_editable', type:'boolean'},
		{name: 'filter_values', type:'auto'}
	],
	hasMany: [{
		model: 'RsiRecouveoCfgAtrLibModel',
		name: 'records',
		associationKey: 'records'
	}]
});

Ext.define('RsiRecouveoCfgStatusModel',{
	extend: 'Ext.data.Model',
	idProperty: 'status_id',
	fields: [
		{name: 'status_id', type:'string'},
		{name: 'status_txt', type:'string'},
		{name: 'status_code', type:'string'},
		{name: 'status_color', type:'string'},
		{name: 'sched_none', type:'boolean'},
		{name: 'sched_lock', type:'boolean'},
		{name: 'sched_prefix', type:'boolean'},
		{name: 'is_disabled', type:'boolean'}
	]
});
Ext.define('RsiRecouveoCfgActionModel',{
	extend: 'Ext.data.Model',
	idProperty: 'action_id',
	fields: [
		{name: 'action_id', type:'string'},
		{name: 'action_txt', type:'string'},
		{name: 'action_cls', type:'string'},
		{name: 'group_id', type:'string'},
		{name: 'status_open', type:'auto'},
		{name: 'status_next', type:'auto'},
		{name: 'is_direct', type:'boolean'},
		{name: 'is_next', type:'boolean'},
		{name: 'is_next_sched', type:'boolean'},
		{name: 'agenda_class', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgActionEtaModel',{
	extend: 'Ext.data.Model',
	idProperty: 'eta_range',
	fields: [
		{name: 'eta_range', type:'string'},
		{name: 'eta_txt', type:'string'},
		{name: 'eta_color', type:'string'},
		{name: 'upto_days', type:'int'}
	]
});
Ext.define('RsiRecouveoCfgBalageModel',{
	extend: 'Ext.data.Model',
	idProperty: 'segmt_id',
	fields: [
		{name: 'segmt_id', type:'string'},
		{name: 'segmt_txt', type:'string'},
		{name: 'calc_from_days', type:'int'}
	]
});
Ext.define('RsiRecouveoCfgTemplateModel',{
	extend: 'Ext.data.Model',
	idProperty: 'tpl_id',
	fields: [
		{name: '_empty', type:'boolean'},
		{name: 'tpl_id', type:'string'},
		{name: 'tpl_name', type:'string'},
		{name: 'tpl_group', type:'string'},
		{name: 'manual_is_on', type:'boolean'},
		{name: 'input_fields_json', type:'string'},
		{name: 'html_title', type:'string'},
		{name: 'html_body', type:'string'}
	]
});
Ext.define('RsiRecouveoCfgSocModel',{
	extend: 'Ext.data.Model',
	idProperty: 'soc_id',
	fields: [
		{name: 'soc_id', type:'string'},
		{name: 'soc_name', type:'string'},
		{name: 'soc_xe_currency', type:'boolean'},
		{name: 'atr_ids', type:'auto'}
	]
});

Ext.define('RsiRecouveoConfigMetagenModel',{
	extend: 'Ext.data.Model',
	idProperty: 'meta_key',
	fields: [
		{name: 'meta_key', type:'string'},
		{name: 'meta_value', type:'string'}
	]
});

Ext.define('RsiRecouveoConfigEmailTplModel',{
	extend: 'Ext.data.Model',
	idProperty: 'email_adr',
	fields: [
		{name: 'email_adr', type:'string'},
		{name: 'email_name', type:'string'},
		{name: 'email_signature', type:'string'},
		{name: 'server_url', type:'string'},
		{name: 'server_username', type:'string'},
		{name: 'server_passwd', type:'string'},
		{name: 'link_is_default', type:'boolean'},
		{name: 'link_SOC', type:'auto'}
	]
});

Ext.define('RsiRecouveoConfigUserTplModel',{
	extend: 'Ext.data.Model',
	idProperty: 'user_id',
	fields: [
		{name: 'user_id', type:'string'},
		{name: 'user_pw', type:'string'},
		{name: 'user_short', type:'string'},
		{name: 'user_fullname', type:'string'},
		{name: 'user_jobtitle', type:'string'},
		{name: 'user_email', type:'string'},
		{name: 'user_tel', type:'string'},
		{name: 'status_is_ext', type:'boolean'},
		{name: 'link_SOC', type:'auto'}
	]
});

Ext.define('RsiRecouveoConfigScenarioStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'scenstep_code',
	fields: [
		{name: 'scenstep_code', type:'string'},
		{name: 'scenstep_tag', type:'string'},
		{name: 'schedule_idx', type:'int'},
		{name: 'schedule_daystep', type:'int'},
		{name: 'link_action', type:'string'},
		{name: 'link_tpl', type:'string'},
		{name: 'mail_modes_json', type:'string'},
		{name: 'exec_is_auto', type:'boolean'}
	]
});
Ext.define('RsiRecouveoConfigScenarioPreModel',{
	extend: 'Ext.data.Model',
	idProperty: 'scenstep_code',
	fields: [
		{name: 'prestep_code', type:'string'},
		{name: 'prestep_tag', type:'string'},
		{name: 'prestep_daybefore', type:'int'},
		{name: 'link_action', type:'string'},
		{name: 'link_tpl', type:'string'},
		{name: 'mail_modes_json', type:'string'},
		{name: 'exec_is_auto', type:'boolean'}
	]
});
Ext.define('RsiRecouveoConfigScenarioTplModel',{
	extend: 'Ext.data.Model',
	idProperty: 'scen_code',
	fields: [
		{name: 'scen_code', type:'string'},
		{name: 'scen_txt', type:'string'},
		{name: 'balance_min', type:'number'},
		{name: 'balance_max', type:'number'}
	]
});

Ext.define('RsiRecouveoConfigSocMetafieldModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'metafield_code', type:'string'},
		{name: 'metafield_desc', type:'string'},
		{name: 'metafield_assoc', type:'string'},
		{name: 'is_filter', type:'boolean'},
		{name: 'is_globalfilter', type:'boolean'},
		{name: 'is_editable', type:'boolean'},
		{name: 'is_doprint', type:'boolean'}
	]
});
Ext.define('RsiRecouveoConfigSocPrintfieldModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'printfield_code', type:'string'},
		{name: 'printfield_text', type:'string'}
	]
});
Ext.define('RsiRecouveoConfigSocModel',{
	extend: 'Ext.data.Model',
	idProperty: 'scen_code',
	fields: [
		{name: 'soc_id', type:'string'},
		{name: 'soc_name', type:'string'},
		{name: 'soc_xe_currency', type:'boolean'}
	],
	hasMany: [{
		model: 'RsiRecouveoConfigSocMetafieldModel',
		name: 'metafields',
		associationKey: 'metafields'
	},{
		model: 'RsiRecouveoConfigSocPrintfieldModel',
		name: 'printfields',
		associationKey: 'printfields'
	}]
});

Ext.define('RsiRecouveoCfgReportValueModel',{
	extend: 'Ext.data.Model',
	idProperty: 'reportval_id',
	fields: [
		{name: 'reportval_id', type:'string'},
		{name: 'reportval_txt', type:'string'},
		{name: 'reportval_iconCls', type:'string'},
		{name: 'reportgroup_id', type:'string'},
		{name: 'timescale', type:'string'},
		{name: 'value_type', type: 'string'},
		{name: 'value_suffix', type: 'string'},
		{name: 'subvalues', type:'auto'}
	]
});



Ext.define('Optima5.Modules.Spec.RsiRecouveo.HelperCache',{
	mixins: {
		observable: 'Ext.util.Observable'
	},
	
	singleton:true,
	
	isReady: false,
	nbLoaded: 0,
	nbToLoad: 0,
	
	constructor: function(config) {
		//build store
		var me = this ;
		me.mixins.observable.constructor.call(this, config);
	},
	init: function(optimaModule, cmpId) {
		var me = this ;
		me.optimaModule = optimaModule ;
		me.cmpId = cmpId ;
		me.isReady = false ;
		
		Ext.defer(function() {
			me.startLoading() ;
		},1000,me) ;
	},
	startLoading: function() {
		var me = this ;
		
		me.nbToLoad = 2 ;
		me.nbLoaded = 0 ;
		
		me.authHelperInit() ;
		me.fetchConfig() ;
	},
	onLoad: function() {
		var me = this ;
		me.nbLoaded++ ;
		if( me.nbToLoad <= me.nbLoaded ) {
			me.isReady = true ;
			me.fireEvent('ready') ;
		}
	},
	
	
	fetchConfig: function() {
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_rsi_recouveo',
			_action: 'cfg_getConfig'
		});
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.onLoadConfig( ajaxData ) ;
				}
			},
			scope: this
		});
	},
	onLoadConfig: function( ajaxData ) {
		this.cfgAtrStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgAtrModel',
			data : ajaxData.data.cfg_atr,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		this.cfgOptStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgOptModel',
			data : ajaxData.data.cfg_opt,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		this.cfgActionnextStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgNodeModel',
			data : ajaxData.data.cfg_actionnext,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		this.cfgStatusStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgStatusModel',
			data : ajaxData.data.cfg_status
		}) ;
		this.cfgActionStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgActionModel',
			data : ajaxData.data.cfg_action
		}) ;
		this.cfgActionEtaStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgActionEtaModel',
			data : ajaxData.data.cfg_action_eta
		}) ;
		this.cfgBalageStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgBalageModel',
			data : ajaxData.data.cfg_balage
		}) ;
		this.cfgTemplateStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgTemplateModel',
			data : ajaxData.data.cfg_template
		}) ;
		this.cfgUserStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoConfigUserTplModel',
			data : ajaxData.data.cfg_user
		}) ;
		this.cfgEmailStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoConfigEmailTplModel',
			data : ajaxData.data.cfg_email
		}) ;
		this.cfgMetagenStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoConfigMetagenModel',
			data : ajaxData.data.cfg_metagen
		}) ;
		this.cfgReportValueStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoCfgReportValueModel',
			data : ajaxData.data.cfg_reportval
		}) ;
		
		var tmpTreeStore = Ext.create('Ext.data.TreeStore',{
			model: 'RsiRecouveoCfgSocModel',
			root: {
				root: true,
				children: []
			},
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		while( true ) {
			var cnt = 0 ;
			var parentNode ;
			Ext.Array.each( ajaxData.data.cfg_soc, function(row) {
				if( tmpTreeStore.getNodeById( row.soc_id ) ) {
					return ;
				}
				if( Ext.isEmpty(row.soc_parent_id) ) {
					parentNode = tmpTreeStore.getRootNode() ;
				} else {
					parentNode = tmpTreeStore.getNodeById( row.soc_parent_id ) ;
				}
				if( !parentNode ) {
					return ;
				}
				cnt++ ;
				parentNode.appendChild(row);
			}) ;
			if( cnt==0 ) {
				break ;
			}
		}
		tmpTreeStore.getRootNode().cascadeBy( function(node) {
			if( node.childNodes.length == 0 ) {
				node.set('leaf',true) ;
			} else {
				node.expand() ;
			}
		}) ;
		this.cfgSocTreeStore = tmpTreeStore ;
		
		var cmpId = this.cmpId ;
		
		var pushModelFields = []
			, pushModelFieldsAccount = []
			, pushModelFieldsFile = []
			, pushModelFieldsRecord = []
			, pushModelFieldsCfg = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			pushModelFields.push({
				name: atrId,
				type: 'string'
			}) ;
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type == 'account' ) {
				pushModelFieldsAccount.push({
					name: atrRecord.atr_field,
					type: 'auto'
				}) ;
				pushModelFieldsFile.push({
					name: atrRecord.atr_field,
					type: 'auto'
				}) ;
			}
			if( atrRecord.atr_type == 'record' ) {
				pushModelFieldsFile.push({
					name: atrRecord.atr_field,
					type: 'auto'
				}) ;
				pushModelFieldsRecord.push({
					name: atrRecord.atr_field,
					type: 'auto'
				}) ;
			}
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			pushModelFieldsCfg.push({
				name: 'link_'+atrId,
				type: 'auto'
			}) ;
		}) ;
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoNotificationModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoNotificationModel'+'-'+cmpId,{
			extend: 'RsiRecouveoNotificationTplModel',
			idProperty: 'notification_filerecord_id'
		}) ;
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoRecordModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoRecordModel'+'-'+cmpId,{
			extend: 'RsiRecouveoRecordTplModel',
			idProperty: 'record_filerecord_id',
			fields: pushModelFieldsRecord,
			hasMany: [{
				model: 'RsiRecouveoRecordLinkModel',
				name: 'all_links',
				associationKey: 'all_links'
			}]
		}) ;
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoFileModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoFileModel'+'-'+cmpId,{
			extend: 'RsiRecouveoFileTplModel',
			idProperty: 'file_filerecord_id',
			fields: pushModelFieldsFile,
			hasMany: [{
				model: 'RsiRecouveoFileActionModel',
				name: 'actions',
				associationKey: 'actions'
			},{
				model: 'RsiRecouveoFileSubModel',
				name: 'filesubs',
				associationKey: 'filesubs'
			},{
				model: 'RsiRecouveoRecordModel'+'-'+cmpId,
				name: 'records',
				associationKey: 'records'
			}]
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoAccountModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoAccountModel'+'-'+cmpId,{
			extend: 'RsiRecouveoAccountTplModel',
			idProperty: 'acc_id',
			fields: pushModelFieldsAccount,
			hasMany: [{
				model: 'RsiRecouveoAccountNotepadModel',
				name: 'notepad',
				associationKey: 'notepad'
			},{
				model: 'RsiRecouveoAccountAttachmentModel',
				name: 'attachments',
				associationKey: 'attachments'
			},{
				model: 'RsiRecouveoAdrbookModel',
				name: 'adrbook',
				associationKey: 'adrbook'
			},{
				model: 'RsiRecouveoAccountTplModel',
				name: 'similar',
				associationKey: 'similar'
			},{
				model: 'RsiRecouveoFileModel'+'-'+cmpId,
				name: 'files',
				associationKey: 'files'
			},{
				model: 'RsiRecouveoRecordModel'+'-'+cmpId,
				name: 'records',
				associationKey: 'records'
			},{
				model: 'RsiRecouveoNotificationModel'+'-'+cmpId,
				name: 'notifications',
				associationKey: 'notifications'
			}]
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoConfigEmailModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoConfigEmailModel'+'-'+cmpId,{
			extend: 'RsiRecouveoConfigEmailTplModel',
			idProperty: 'email_adr',
			fields: []
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoConfigUserModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoConfigUserModel'+'-'+cmpId,{
			extend: 'RsiRecouveoConfigUserTplModel',
			idProperty: 'user_id',
			fields: pushModelFieldsCfg
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( 'RsiRecouveoConfigScenarioModel'+'-'+cmpId ) ;
		Ext.define('RsiRecouveoConfigScenarioModel'+'-'+cmpId,{
			extend: 'RsiRecouveoConfigScenarioTplModel',
			idProperty: 'scen_code',
			fields: pushModelFieldsCfg,
			hasMany: [{
				model: 'RsiRecouveoConfigScenarioStepModel',
				name: 'steps',
				associationKey: 'steps'
			},{
				model: 'RsiRecouveoConfigScenarioPreModel',
				name: 'presteps',
				associationKey: 'presteps'
			}]
		}) ;
		
		this.onLoad() ;
		
		var cssBlob = '' ;
		Ext.Array.each( this.getStatusAll(), function( statusRow ) {
			var color = statusRow.status_color,
				colorNodash = color.substring(1) ;
			cssBlob += ".bgcolor-"+colorNodash+" { background-color:"+color+" }\r\n" ;
		}) ;
		Ext.Array.each( this.getActionEtaAll(), function( actionEtaRow ) {
			var color = actionEtaRow.eta_color,
				colorNodash = color.substring(1) ;
			cssBlob += ".bgcolor-"+colorNodash+" { background-color:"+color+" }\r\n" ;
		}) ;
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5specrsirecouveo-'+this.cmpId);
	},
	getAccountModel: function() {
		return 'RsiRecouveoAccountModel'+'-'+this.cmpId ;
	},
	getFileModel: function() {
		return 'RsiRecouveoFileModel'+'-'+this.cmpId ;
	},
	getRecordModel: function() {
		return 'RsiRecouveoRecordModel'+'-'+this.cmpId ;
	},
	getNotificationModel: function() {
		return 'RsiRecouveoNotificationModel'+'-'+this.cmpId ;
	},
	getBankModel: function() {
		return 'RsiRecouveoBankModel' ;
	},
	getConfigEmailModel: function() {
		return 'RsiRecouveoConfigEmailModel'+'-'+this.cmpId ;
	},
	getConfigUserModel: function() {
		return 'RsiRecouveoConfigUserModel'+'-'+this.cmpId ;
	},
	getConfigScenarioModel: function() {
		return 'RsiRecouveoConfigScenarioModel'+'-'+this.cmpId ;
	},
	getConfigScenarioStepModel: function() {
		return 'RsiRecouveoConfigScenarioStepModel' ;
	},
	
	getAllAtrIds: function(arrSocs) {
		var atrIds = [] ;
		if( typeof arrSocs === 'undefined' ) {
			this.cfgAtrStore.each( function(atrRecord) {
				atrIds.push( atrRecord.getId() ) ;
			}) ;
			Ext.Array.sort(atrIds) ;
			return atrIds ;
		}
		
		this.cfgAtrStore.each( function(atrRecord) {
			if( atrRecord.get('is_globalfilter') ) {
				atrIds.push( atrRecord.getId() ) ;
			}
		}) ;
		Ext.Array.each( arrSocs, function(socId) {
			var socRec = this.cfgSocTreeStore.getById(socId) ;
			if( !socRec ) {
				return ;
			}
			Ext.Array.each( socRec.get('atr_ids'), function(atrId) {
				var atrRecord = this.cfgAtrStore.getById(atrId) ;
				if( !atrRecord ) {
					return ;
				}
				if( !Ext.Array.contains(atrIds,atrRecord.getId()) ) {
					atrIds.push( atrRecord.getId() ) ;
				}
			},this) ;
		},this);
		Ext.Array.sort(atrIds) ;
		return atrIds ;
	},
	getAtrHeader: function(atrId) {
		return this.cfgAtrStore.getById(atrId).getData() ;
	},
	getAtrData: function(atrId) {
		return this.cfgAtrStore.getById(atrId) ? Ext.pluck(this.cfgAtrStore.getById(atrId).records().getRange(), 'data') : null ;
	},
	
	getAllOptIds: function() {
		var atrIds = [] ;
		this.cfgOptStore.each( function(atrRecord) {
			atrIds.push( atrRecord.getId()) ;
		}) ;
		return atrIds ;
	},
	getOptHeader: function(optId) {
		return this.cfgOptStore.getById(optId).getData() ;
	},
	getOptData: function(optId) {
		return this.cfgOptStore.getById(optId) ? Ext.pluck(this.cfgOptStore.getById(optId).records().getRange(), 'data') : null ;
	},
	
	getStatusAll: function() {
		return Ext.pluck( this.cfgStatusStore.getRange(), 'data' ) ;
	},
	getStatusRowId: function( statusId ) {
		return ( this.cfgStatusStore.getById(statusId) ? this.cfgStatusStore.getById(statusId).getData() : null );
	},
	
	getActionAll: function() {
		return Ext.pluck( this.cfgActionStore.getRange(), 'data' ) ;
	},
	getActionRowId: function( actionId ) {
		return ( this.cfgActionStore.getById(actionId) ? this.cfgActionStore.getById(actionId).getData() : null );
	},
	
	getActionnextData: function() {
		return Ext.pluck( this.cfgActionnextStore.getRange(), 'data' ) ;
	},
	
	getActionEtaAll: function() {
		return Ext.pluck( this.cfgActionEtaStore.getRange(), 'data' ) ;
	},
	
	getBalageAll: function() {
		return Ext.pluck( this.cfgBalageStore.getRange(), 'data' ) ;
	},
	
	getTemplateAll: function() {
		return Ext.pluck( this.cfgTemplateStore.getRange(), 'data' ) ;
	},
	
	getSocRootNode: function() {
		return this.cfgSocTreeStore.getRootNode().copy(undefined,true) ;
	},
	getSocRowId: function(socId) {
		var socNode = this.cfgSocTreeStore.getRootNode().findChild('soc_id',socId) ;
		if( socNode ) {
			return socNode.getData() ;
		}
		return null ;
	},
	
	getUserAll: function() {
		return Ext.pluck( this.cfgUserStore.getRange(), 'data' ) ;
	},
	
	getEmailAll: function() {
		return Ext.pluck( this.cfgEmailStore.getRange(), 'data' ) ;
	},
	
	getReportValueAll: function() {
		return Ext.pluck( this.cfgReportValueStore.getRange(), 'data' ) ;
	},
	
	getMetagenValue: function(metagenKey) {
		if( !this.cfgMetagenStore.getById(metagenKey) ) {
			return ;
		}
		return this.cfgMetagenStore.getById(metagenKey).get('meta_value') ;
	},
	
	
	
	
	
	authHelperInit: function() {
		var me = this ;
		
		me.authId = null ;
		me.authSoc = [] ;
		me.authMapAtr = {} ;
		me.authProfile = null ;
		me.authIsExt = null ;
		
		// Query Bible
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_rsi_recouveo',
			_action: 'cfg_getAuth'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					me.authId = ajaxData.authId ;
					me.authSoc = ajaxData.authSoc ;
					me.authMapAtr = ajaxData.authMapAtr ;
					me.authProfile = ajaxData.authProfile ;
					me.authIsExt = ajaxData.authIsExt ;
				}
				
				me.onLoad() ;
			},
			scope: me
		});
	},
	
	authHelperHasAll: function() {
		var me = this ;
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return true ;
		}
		return false ;
	},
	authHelperListSoc: function() {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return null ;
		}
		return me.authSoc ;
	},
	authHelperListAtr: function(atrId) {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return null ;
		}
		if( me.authMapAtr.hasOwnProperty(atrId) ) {
			return me.authMapAtr[atrId] ;
		}
		return null ;
	},
	authHelperGetId: function() {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return null ;
		}
		return me.authId ;
	},
	authHelperGetProfile: function() {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return null ;
		}
		return me.authProfile ;
	},
	authHelperIsExt: function() {
		var me = this ;
			
		if( me.optimaModule.getSdomainRecord().get('auth_has_all') ) {
			return null ;
		}
		return me.authIsExt ;
	}
});
