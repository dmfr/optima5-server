Ext.define('QbookBibleQobjModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'q_type',  type: 'string'},
		
		{name: 'query_id',  type: 'int'},
		{name: 'query_name',   type: 'string'},
		{name: 'target_file_code',   type: 'string'},
		
		{name: 'qmerge_id',  type: 'int'},
		{name: 'qmerge_name',   type: 'string'}
	],
	hasMany: [{ 
		model: 'QueryWhereModel',
		name: 'fields_where',
		associationKey: 'fields_where'
	},{
		model: 'QueryGroupModel',
		name: 'fields_group',
		associationKey: 'fields_group'
	},{
		model: 'QuerySelectModel',
		name: 'fields_select',
		associationKey: 'fields_select'
	},{
		model: 'QueryProgressModel',
		name: 'fields_progress',
		associationKey: 'fields_progress'
	},{
		model: 'QmergeMwhereModel',
		name: 'fields_mwhere',
		associationKey: 'fields_mwhere'
	},{
		model: 'QmergeMselectModel',
		name: 'fields_mselect',
		associationKey: 'fields_mselect'
	}]
});

Ext.define('QbookInputvarModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'inputvar_lib',   type: 'string'},
		{name: 'inputvar_type',   type: 'string'},
		{name: 'inputvar_linktype',   type: 'string'},
		{name: 'inputvar_linkbible',   type: 'string'},
		{name: 'src_backend_is_on',   type: 'boolean'},
		{name: 'src_backend_file_code',   type: 'string'},
		{name: 'src_backend_file_field_code',   type: 'string'},
		{name: 'date_align_is_on',   type: 'boolean'},
		{name: 'date_align_segment_type',   type: 'string'},
		{name: 'date_align_direction_end',   type: 'boolean'},
		{name: 'date_calc_is_on',   type: 'boolean'},
		{name: 'date_calc_segment_type',   type: 'string'},
		{name: 'date_calc_segment_count',   type: 'int'}
	],
	idgen: {
		type: 'sequential',
		seed: 1000,
		prefix: 'IV_'
	}
});

Ext.define('QbookQobjFieldModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'target_query_wherefield_idx',   type: 'int'},
		{name: 'target_qmerge_mwherefield_idx',   type: 'int'},
		{name: 'target_subfield',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'src_inputvar_idx',   type: 'int'},
		{name: 'src_inputvar_jsId',   type: 'auto'}
	]
});
Ext.define('QbookQobjModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'qobj_lib',   type: 'string'},
		{name: 'target_q_type',   type: 'string'},
		{name: 'target_query_id',   type: 'int'},
		{name: 'target_qmerge_id',   type: 'int'}
	],
	hasMany: [{ 
		model: 'QbookQobjFieldModel',
		name: 'qobj_fields',
		associationKey: 'qobj_fields'
	}],
	idgen: {
		type: 'sequential',
		seed: 1000,
		prefix: 'QOBJ_'
	}
});

Ext.define('QbookValueSavetoModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'target_backend_file_code',   type: 'string'},
		{name: 'target_backend_file_field_code',   type: 'string'}
	]
});
Ext.define('QbookValueSymbolModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'sequence',  type: 'int'},
		{name: 'math_operation',   type: 'string'},
		{name: 'math_parenthese_in',   type: 'boolean'},
		{name: 'math_operand_inputvar_idx',   type: 'int'},
		{name: 'math_operand_inputvar_jsId',   type: 'auto'},
		{name: 'math_operand_qobj_idx',   type: 'int'},
		{name: 'math_operand_qobj_jsId',   type: 'auto'},
		{name: 'math_operand_selectfield_idx',   type: 'int'},
		{name: 'math_operand_mselectfield_idx',   type: 'int'},
		{name: 'math_staticvalue',   type: 'numeric'},
		{name: 'math_parenthese_out',   type: 'boolean'}
	]
});
Ext.define('QbookValueModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'select_lib',  type: 'string'},
		{name: 'math_round', type: 'numeric'}
	],
	validations: [
		{type: 'length',    field: 'select_lib',     min: 1},
	],
	hasMany: [{ 
		model: 'QbookValueSymbolModel',
		name: 'math_expression',
		associationKey: 'math_expression'
	},{
		model: 'QbookValueSavetoModel',
		name: 'saveto',
		associationKey: 'saveto'
	}]
});


Ext.define('Optima5.Modules.CrmBase.QbookPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbaseqbook',
			  
	requires: [
		'Optima5.Modules.CrmBase.QbookSubpanelInput',
		'Optima5.Modules.CrmBase.QbookSubpanelQprocess',
		'Optima5.Modules.CrmBase.QbookSubpanelValues'
	] ,
			  
	
	transaction_id : 0 ,
	qbook_id      : 0 ,
	qbook_name    : '',

	backend_file_code : null,
	inputvarStore: null,
	qobjStore: null,
	valueStore: null,
	
	bibleQobjsStore: null,
	bibleFilesTreefields: null,
	
	qsrcFileCode: null,
	qsrcFilerecordId: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border: false,
			layout: 'accordion',
			//autoDestroy: true,
			items:[]
		}) ;
		
		me.on('render',me.onPanelRender,me,{single:true}) ;
		
		me.addEvents('querysaved') ;
		me.addEvents('backendfilerecordchange','selectbackendfile') ; // BackendFile mgmt
		me.addEvents('qbookztemplatechange') ;  // Floating panel to load/save ztemplates
		
		me.callParent() ;
	},
	onPanelRender: function(panel) {
		var me = this ;
		
		var gridPanelDropTargetEl =  panel.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'FilerecordToAnything',
			notifyEnter: function(ddSource, e, data) {
				//Add some flare to invite drop.
				panel.body.mask();
			},
			notifyOut: function() {
				panel.body.unmask() ;
			},
			notifyDrop: function(ddSource, e, data){
				panel.body.unmask() ;
				
				// Reference the record (single selection) for readability
				var dragRecord = ddSource.dragData.records[0],
					dragRecordClass = Ext.getClassName(dragRecord) ;
				if( dragRecordClass.indexOf('FileGrid-') != 0 ) {
					return false ;
				}
				var fileCode = dragRecordClass.substr('FileGrid-'.length) ;
				if( fileCode != me.backend_file_code ) {
					return false ;
				}
				
				me.onDropFilerecord( fileCode, dragRecord.get('filerecord_id') ) ;
				
				return true;
			}
		});
	},
	
	qbookNew: function() {
		var me = this ;
		me.onLoadBegin() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_subaction: 'init',
			is_new: 'true'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	qbookOpen: function( qbookId ) {
		var me = this ;
		me.onLoadBegin() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_subaction: 'init',
			qbook_id: qbookId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText)
				if( ajaxResponse.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.transaction_id = ajaxResponse.transaction_id ;
					me.addComponents( ajaxResponse ) ;
				}
			},
			scope: this
		});
	},
	
	onLoadBegin: function() {
		var me = this ;
		me.loading = true ;
		if( me.rendered ) {
			me.loadMask = new Ext.LoadMask(me,{msg:"Please wait..."}) ;
			me.loadMask.show() ;
		} else {
			me.on('afterrender',function(p) {
				if( p.loading ) {
					return ;
				}
				p.loadMask = new Ext.LoadMask(p,{msg:"Please wait..."}) ;
				p.loadMask.show() ;
			},me,{single:true}) ;
		}
	},
	onLoadEnd: function() {
		var me = this ;
		if( me.loadMask ) {
			me.loadMask.hide() ;
		}
		me.loading = false ;
	},
	
	addComponents: function( ajaxResponse ) {
		var me = this ;
		
		me.transaction_id = ajaxResponse.transaction_id ;
		if( ajaxResponse.qbook_id && ajaxResponse.qbook_id > 0 ) {
			me.qbook_id = ajaxResponse.qbook_id ;
			me.qbook_name =  ajaxResponse.qbook_name ;
			me.backend_file_code = ajaxResponse.backend_file_code ;
		}
		
		var me = this ;
		
		me.bibleQobjsStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QbookBibleQobjModel',
			data : ajaxResponse.bible_qobjs,
			proxy: {
				type: 'memory' ,
				reader: {
						type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			},
			getByQueryId: function(queryId) {
				var matchRec = null ;
				this.each(function(rec) {
					if( rec.get('q_type') == 'query' && rec.get('query_id') == queryId ) {
						matchRec = rec ;
						return false ;
					}
				});
				return matchRec ;
			},
			getByQmergeId: function(qmergeId) {
				var matchRec = null ;
				this.each(function(rec) {
					if( rec.get('q_type') == 'qmerge' && rec.get('qmerge_id') == qmergeId ) {
						matchRec = rec ;
						return false ;
					}
				});
				return matchRec ;
			}
		}) ;
		
		me.bibleFilesTreefields = {} ;
		Ext.Object.each( ajaxResponse.bible_files_treefields, function(k,v) {
			var treestore = Ext.create('Ext.data.TreeStore',{
				model: 'QueryFieldsTreeModel',
				nodeParam: 'field_code',
				root: v
			});
			
			me.bibleFilesTreefields[k] = treestore ;
		},me) ;
		
		
		me.inputvarStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QbookInputvarModel',
			data : ajaxResponse.qbook_arr_inputvar , //me.mselectFields
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			}
		}) ;
		
		me.qobjStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QbookQobjModel',
			data : ajaxResponse.qbook_arr_qobj , //me.mselectFields
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			}
		}) ;
		
		me.valueStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QbookValueModel',
			data : ajaxResponse.qbook_arr_value , //me.mselectFields
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			}
		}) ;
		
		// Sync jsId
		me.qobjStore.each( function(qobjRecord) {
			qobjRecord.qobj_fields().each( function(qobjFieldRecord) {
				var jsId ;
				
				if( qobjFieldRecord.get('src_inputvar_idx') != -1 ) {
					jsId = me.inputvarStore.getAt( qobjFieldRecord.get('src_inputvar_idx') ).getId() ;
					qobjFieldRecord.set('src_inputvar_jsId',jsId) ;
				} else {
					qobjFieldRecord.set('src_inputvar_jsId','') ;
				}
			},me) ;
		},me) ;
		me.valueStore.each( function(valueRecord) {
			valueRecord.math_expression().each( function(valueSymbolRecord) {
				var jsId ;
				
				if( valueSymbolRecord.get('math_operand_inputvar_idx') != -1 ) {
					jsId = me.inputvarStore.getAt( valueSymbolRecord.get('math_operand_inputvar_idx') ).getId() ;
					valueSymbolRecord.set('math_operand_inputvar_jsId',jsId) ;
				} else {
					valueSymbolRecord.set('math_operand_inputvar_jsId','') ;
				}
				
				if( valueSymbolRecord.get('math_operand_qobj_idx') != -1 ) {
					jsId = me.qobjStore.getAt( valueSymbolRecord.get('math_operand_qobj_idx') ).getId() ;
					valueSymbolRecord.set('math_operand_qobj_jsId',jsId) ;
				} else {
					valueSymbolRecord.set('math_operand_qobj_jsId','') ;
				}
			},me) ;
		},me) ;
		// ----------------
		
		me.removeAll() ;
		me.add([
			Ext.create('Optima5.Modules.CrmBase.QbookSubpanelInput',{
				parentQbookPanel: me,
				inputvarStore: me.inputvarStore,
				backendFileCode: me.backend_file_code,
				title: 'Input/source variables',
				border:false,
				listeners: {
					selectbackendfile: me.onSelectBackendFile,
					scope:me
				}
			}),
			Ext.create('Optima5.Modules.CrmBase.QbookSubpanelQprocess',{
				parentQbookPanel: me,
				inputvarStore: me.inputvarStore,
				qobjStore: me.qobjStore,
				title: 'Queries/Qmerges chain',
				border:false
			}),
			Ext.create('Optima5.Modules.CrmBase.QbookSubpanelValues',{
				parentQbookPanel: me,
				inputvarStore: me.inputvarStore,
				qobjStore: me.qobjStore,
				valueStore: me.valueStore,
				title: 'Calc Values',
				border:false
			})
		]) ;
		me.query('panel')[0].expand() ;
		
		me.onLoadEnd() ;
	},
	onSelectBackendFile: function(backendFileCode) {
		var me = this ;
		me.backend_file_code = backendFileCode ;
		me.fireEvent('selectbackendfile',backendFileCode) ; //relay event
		me.releaseFilerecord() ;
	},
	onDropFilerecord: function(fileCode, filerecordId) {
		var me = this ;
		me.qsrcFileCode = fileCode ;
		me.qsrcFilerecordId = filerecordId ;
		me.fireEvent('backendfilerecordchange',fileCode,filerecordId) ;
	},
	releaseFilerecord: function() {
		var me = this ;
		me.qsrcFileCode = null ;
		me.qsrcFilerecordId = null ;
		me.fireEvent('backendfilerecordchange',null,null) ;
	},
	
	prepareSubmit: function() {
		var me = this ;
		// Sync back jsId => idx
		me.qobjStore.each( function(qobjRecord) {
			qobjRecord.qobj_fields().each( function(qobjFieldRecord) {
				var jsId = qobjFieldRecord.get('src_inputvar_jsId') ;
				if( jsId != null && jsId != '' ) {
					qobjFieldRecord.set('src_inputvar_idx', me.inputvarStore.indexOfId(jsId)) ;
				} else {
					qobjFieldRecord.set('src_inputvar_idx', -1) ;
				}
			},me) ;
		},me) ;
		me.valueStore.each( function(valueRecord) {
			valueRecord.math_expression().each( function(valueSymbolRecord) {
				var jsId ;
				
				jsId = valueSymbolRecord.get('math_operand_inputvar_jsId') ;
				if( jsId != null && jsId != '' ) {
					valueSymbolRecord.set('math_operand_inputvar_idx', me.inputvarStore.indexOfId(jsId)) ;
				} else {
					valueSymbolRecord.set('math_operand_inputvar_idx', -1) ;
				}
				
				jsId = valueSymbolRecord.get('math_operand_qobj_jsId') ;
				if( jsId != null && jsId != '' ) {
					valueSymbolRecord.set('math_operand_qobj_idx', me.qobjStore.indexOfId(jsId)) ;
				} else {
					valueSymbolRecord.set('math_operand_qobj_idx', -1) ;
				}
			},me) ;
		},me) ;
		// ----------------
	},

	
	remoteAction: function( actionCode, actionParam ) {
		var me = this ;
		switch( actionCode ) {
			case 'submit' :
				me.remoteActionSubmit( Ext.emptyFn, me ) ;
				break ;
			case 'save' :
				me.remoteActionSubmit( me.remoteActionSave, me ) ;
				break ;
			case 'saveas' :
				var newQueryName = actionParam ;
				me.remoteActionSubmit( me.remoteActionSaveAs, me, [newQueryName] ) ;
				break ;
			case 'delete' :
				me.remoteActionSubmit( me.remoteActionDelete, me ) ;
				break ;
				
			case 'toggle_publish' :
				var isPublished = actionParam ;
				me.remoteActionSubmit( me.remoteActionTogglePublish, me, [isPublished]  ) ;
				break ;
				
			case 'run' :
				var runParams = {} ;
				if( Ext.isObject(actionParam) && actionParam.qbookZtemplateSsid ) {
					runParams['qbookZtemplateSsid'] = actionParam.qbookZtemplateSsid ;
				}
				me.remoteActionSubmit( me.remoteActionRun, me, runParams ) ;
				break ;
				
			default :
				break ;
		}
	},
	remoteActionSubmit: function( callback, callbackScope, callbackArguments ) {
		var me = this ;
		
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		me.prepareSubmit() ;
		
		var inputvarStoreData = [] ;
		var inputvarStoreRecords = me.inputvarStore.getRange();
		for (var i = 0; i < inputvarStoreRecords.length; i++) {
			inputvarStoreData.push(inputvarStoreRecords[i].getData(true));
		}
		var qobjStoreData = [] ;
		var qobjStoreRecords = me.qobjStore.getRange();
		for (var i = 0; i < qobjStoreRecords.length; i++) {
			qobjStoreData.push(qobjStoreRecords[i].getData(true));
		}
		var valueStoreData = [] ;
		var valueStoreRecords = me.valueStore.getRange();
		for (var i = 0; i < valueStoreRecords.length; i++) {
			valueStoreData.push(valueStoreRecords[i].getData(true));
		}
		
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
			
			backend_file_code: ( me.backend_file_code != null ? me.backend_file_code : '' ),
			qbook_arr_inputvar: Ext.JSON.encode(inputvarStoreData) ,
			qbook_arr_qobj:     Ext.JSON.encode(qobjStoreData) ,
			qbook_arr_value:    Ext.JSON.encode(valueStoreData)
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					callback.call( me, callbackArguments ) ;
				}
			},
			scope: me
		});
	},
	remoteActionSave: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'save'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qbook_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionSaveAs: function( newQueryName ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'saveas',
			qbook_name: newQueryName
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qbook_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionDelete: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'delete'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querydelete',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querydelete',true ) ;
					me.destroy() ;
				}
			},
			scope: me
		});
	},
	remoteActionTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'toggle_publish',
			isPublished: isPublished
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('togglepublishquery',{
						qType:'qbook',
						qbookId:me.qbook_id
					}) ;
				}
			},
			scope: me
		});
	},
	remoteActionRun: function( runParams ) {
		var me = this ;
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		if( me.backend_file_code != null && me.backend_file_code != '' ) {
			if( me.qsrcFilerecordId != null ) {
				Ext.apply(ajaxParams,{
					qsrc_filerecord_id: me.qsrcFilerecordId
				}) ;
			} else {
				Ext.Msg.alert('Missing src filerecord', 'Drag & drop filerecord to specify source file');
				return ;
			}
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				msgbox.close() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
				}
				else {
					// do something to open window
					me.openQueryResultPanel( ajaxData.RES_id, runParams.qbookZtemplateSsid ) ;
				}
			},
			scope: me
		});
	},
	openQueryResultPanel: function( resultId, qbookZtemplateSsid ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id : me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: resultId,
			qbook_ztemplate_ssid: qbookZtemplateSsid
		}) ;
		me.optimaModule.createWindow({
			title:me.qbook_name ,
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			items: [ queryResultPanel ]
		}) ;
		
		queryResultPanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	}
}) ;