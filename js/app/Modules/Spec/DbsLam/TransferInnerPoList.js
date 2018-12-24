Ext.define('DbsLamTransferInputPoModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'transferinputpo_filerecord_id', type:'int', allowNull:true},
		{name: 'transferstep_filerecord_id', type:'int'},
		
		{name: 'po_txt', type: 'string'},
		{name: 'stk_prod', type: 'string'},
		{name: 'qty_po', type: 'number', allowNull:true},
		{name: 'qty_input', type: 'number', allowNull:true},
		
		{name: '_input_is_on', type: 'boolean'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerPoList',{
	extend:'Ext.grid.Panel',
   mixins: {
		inner: 'Optima5.Modules.Spec.DbsLam.TransferInnerMixin'
	},
	
	_specTab: 'TransferInnerPoList',
	
	initComponent: function() {
		var optimaModule = this.optimaModule ;
		
		var listColumns = {
			defaults: {
				menuDisabled: true,
				draggable: false,
				sortable: false,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: [{
				dataIndex: 'status',
				text: '',
				width: 24,
				renderer: function(v,metadata,record) {
					if( record.get('qty_po') == null ) {
						metadata.tdCls = 'op5-spec-dbslam-po-init'
					} else if( record.get('qty_input') < record.get('qty_po') ) {
						metadata.tdCls = 'op5-spec-dbslam-po-partial'
					} else {
						metadata.tdCls = 'op5-spec-dbslam-po-complete'
					}
				}
			},{
				dataIndex: 'po_txt',
				text: 'PO Line #',
				width: 180,
				editorTpl: {
					xtype: 'textfield',
					allowBlank: true
				}
			},{
				dataIndex: 'stk_prod',
				text: 'P/N',
				width: 200,
				renderer: function(v,m,r) {
					if( r.get('transferinputpo_filerecord_id') ) {
						return '<b>'+v+'</b>' ;
					}
					return v ;
				},
				editorTpl: {
					xtype: 'combobox',
					forceSelection:true,
					allowBlank:false,
					editable:true,
					typeAhead:false,
					selectOnFocus: false,
					selectOnTab: true,
					queryMode: 'remote',
					displayField: 'id',
					valueField: 'id',
					queryParam: 'filter',
					minChars: 2,
					fieldStyle: 'text-transform:uppercase',
					store: {
						autoLoad: true,
						fields: ['id'],
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'prods_getIds'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						listeners: {
							scope: this
						}
					},
					listeners: {
						scope: this
					}
				}
			},{
				dataIndex: 'qty_po',
				text: 'Qty PO',
				align: 'right',
				width: 100,
				editorTpl: {
					xtype: 'numberfield',
					allowBlank: false,
					minValue: 1
				}
			},{
				dataIndex: 'qty_input',
				text: 'Qty received',
				align: 'right',
				width: 100,
				renderer: function(v) {
					if( v>0 ) {
						return '<b>'+v+'</b>' ;
					}
					return v ;
				}
			}]
		};
		
		Ext.apply(this,{
				//xtype:'gridpanel',
				//itemId: 'pLigs',
				store: {
					model: 'DbsLamTransferInputPoModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					listeners: {
						scope: this
					}
				},
				selModel: {
					mode: 'SINGLE'
				},
				columns: listColumns,
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRenderer',
					synchronousRender: true
				},{
					ptype: 'rowediting',
					pluginId: 'pEditor',
					clicksToEdit: 2,
					listeners: {
						beforeedit: this.onEditorBeforeEdit,
						edit: this.onEditorEdit,
						canceledit: this.onEditorCancelEdit,
						scope: this
					}
				}],
				listeners: {
					itemclick: this.onListItemClick,
					itemcontextmenu: this.onListContextMenu,
					scope: this
				},
				viewConfig: {
					enableTextSelection: true,
					preserveScrollOnRefresh: true,
					getRowClass: function(record) {
					},
					listeners: {
						beforerefresh: function(view) {
							view.isRefreshing = true ;
						},
						refresh: function(view) {
							view.isRefreshing = false ;
						}
					}
				}
		}) ;
		
		this.callParent() ;
		this.initInner() ;
		this.setTitle( '<font color="red">PO/Input list</font>' ) ;
		
		// Closeable mode
		this.on('beforeclose',this.onBeforeClose,this) ;
	},
	
	refreshData: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInputPo_getLigs',
				transfer_filerecordId: this.getActiveTransferRecord().get('transfer_filerecord_id'),
				transferStep_filerecordId: this.getActiveTransferStepRecord(true).get('transferstep_filerecord_id')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadData(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		
	},
	onLoadData: function( ajaxData ) {
		this.getStore().loadRawData( ajaxData ) ;
	},
	
	
	// ******** on item click/context *******
	onListItemClick: function(view,record) {
		/*
		this.setFormRecord(record) ;
		*/
	},
	onListContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection(),
			selRecord = selRecords[0] ;
		if( selRecords.length!=1 || selRecord!=record ) {
			return ;
		}
		if( record.get('transferinputpo_filerecord_id')==null ) {
			return ;
		}
		
		var gridContextMenu = Ext.create('Ext.menu.Menu',{
			items: [{
				iconCls: 'icon-bible-edit',
				text: 'Edit PO row',
				handler : function() {
					this.getPlugin('pEditor').startEdit(record) ;
				},
				scope : this
			},{
				iconCls: 'icon-bible-delete',
				text: 'Delete PO row',
				handler : function() {
					var doDelete ;
					this.submitEditor(record,doDelete=true) ;
				},
				scope : this
			}],
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		gridContextMenu.showAt(event.getXY());
	},
	
	
	
	// ********* Editor functions *********
	onEditorBeforeEdit: function(editor, context) {
		var pLigs = context.grid ;
		Ext.Array.each( pLigs.getColumns(), function(col) {
			if( col.editorTpl ) {
				col.setEditor(col.editorTpl) ;
			} else {
				col.setEditor(null) ;
			}
		}) ;
		
		if( !context.record.get('transferinputpo_filerecord_id') && !context.record.get('_input_is_on') ) {
			return false ;
		}
	},
	onEditorEdit: function( editor, context ) {
		var editorForm = editor.editor,
			values = context.newValues ;
		
		this.submitEditor(context.record) ;
	},
	onEditorCancelEdit: function(editor,context) {
		var store = context.store,
			record = context.record ;
		if( record.get('_input_is_on') ) {
			store.remove(record) ;
		}
	},
	
	submitEditor: function( editorRecord, doDelete=false ) {
		var recordData = editorRecord.getData() ;
		if( doDelete ) {
			Ext.apply(recordData,{
				_delete: true
			}) ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInputPo_setLig',
				transfer_filerecordId: this.getActiveTransferRecord().get('transfer_filerecord_id'),
				transferStep_filerecordId: this.getActiveTransferStepRecord(true).get('transferstep_filerecord_id'),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					this.onSubmitFailed() ;
					return ;
				}
				this.onSubmitSuccess() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSubmitFailed: function() {
		Ext.MessageBox.alert('Error','Item not accepted', function() {
			var toDel = [] ;
			this.getStore().each( function(rec) {
				if( rec.get('_input_is_on') ) {
					toDel.push(rec) ;
				}
			}) ;
			this.getStore().remove(toDel) ;
		}, this) ;
	},
	onSubmitSuccess: function() {
		this.refreshData() ;
	},
	
	
	handleInputNew: function() {
		var news = this.getStore().insert(0,{
			_input_is_on: true,
			transferstep_filerecord_id: this.getActiveTransferStepRecord(true).get('transferstep_filerecord_id')
		}) ;
		var newRecord = news[0] ;
		this.getPlugin('pEditor').startEdit(newRecord) ;
	},
	
	
	onBeforeClose: function() {
		if( this._deleteDone ) {
			return true ;
		}
		Ext.Msg.confirm('Delete PO List','Delete current PO List ?', function(btn){
			if( btn=='yes' ) {
				this.handleDeleteSelf() ;
			}
		},this) ;
		return false ;
	},
	handleDeleteSelf: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInputPo_setState',
				transfer_filerecordId: this.getActiveTransferRecord().get('transfer_filerecord_id'),
				transferStep_filerecordId: this.getActiveTransferStepRecord(true).get('transferstep_filerecord_id'),
				inputlist_obj: Ext.JSON.encode({
					inputlist_is_on: false
				})
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				this._deleteDone = true ;
				this.close() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}) ;
