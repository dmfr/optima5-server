Ext.define('StoreFieldsTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field_code',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_text',   type: 'string'},
		{name: 'field_text_full',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_type_text',   type: 'string'},
		{name: 'field_linktype',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'table_code',   type: 'string'},
		{name: 'table_field_code',   type: 'string'},
		{name: 'file_code',   type: 'string'},
		{name: 'file_field_code',   type: 'string'},
		{name: 'bible_code',   type: 'string'},
		{name: 'bible_type',   type: 'string'},
		{name: 'bible_field_code',   type: 'string'},
		{name: 'csvsrc_idx', type: 'int', defaultValue: -1 },
		{name: 'csvsrc_text', type: 'string'}
	]
});
Ext.define('StoreFieldsNewModel', {
	extend: 'Ext.data.Model',
	idProperty: 'csvsrc_idx',
	fields: [
		{name: 'csvsrc_idx',  type: 'int'},
		{name: 'csvsrc_text',   type: 'string'},
		{name: 'new_field_code',   type: 'string'},
		{name: 'new_field_type',   type: 'string'},
		{name: 'new_field_is_index',   type: 'boolean'},
		{name: 'new_field_is_primarykey',   type: 'boolean'}
	]
});

Ext.define('Optima5.Modules.CrmBase.DataImportPanel' ,{
	extend: 'Ext.panel.Panel',
	
	parentDataWindow: null,
	
	initComponent: function() {
		var me = this ;
		if( me.parentDataWindow && ((me.parentDataWindow.optimaModule) instanceof Optima5.Module) ) {} else {
			Optima5.Helper.logError('CrmBase:DataImportPanel','No module reference ?') ;
		}
		me.optimaModule = me.parentDataWindow.optimaModule ;
		
		Ext.apply(me,{
			//title: 'Import records from file',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				itemId: 'pCsv',
				title: 'Source : CSV input',
				xtype: 'panel',
				frame: true,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items:[{
					itemId: 'pCsvForm',
					minHeight: 150,
					xtype: 'form',
					fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 100,
						anchor: '100%'
					},
					frame:false,
					border: false,
					bodyPadding: 0,
					bodyCls: 'ux-noframe-bg',
					items: [{
						xtype: 'fieldset',
						title: 'Current buffer',
						items: [{
							xtype: 'fieldcontainer',
							layout: 'hbox',
							fieldLabel: 'File source',
							items: [{
								xtype: 'filefield',
								flex:1,
								name: 'csvsrc_binary',
								buttonText: '...',
								listeners: {
									change: {
										fn: me.doUpload,
										scope:me
									}
								}
							},{
								xtype: 'box',
								width: 16,
								html: '&#160;'
							},{
								xtype: 'displayfield',
								fieldLabel: '# of records',
								labelWidth: 70,
								fieldStyle: 'font-weight: bold',
								name: 'display_nbrecords',
								value: '0'
							}]
						}]
					},{
						xtype: 'fieldset',
						itemId: 'fsBuffer',
						hidden: true,
						title: 'Parameters',
						items: [{
							xtype: 'fieldcontainer',
							layout: 'hbox',
							items: [{
								xtype: 'fieldcontainer',
								layout: {
									type: 'vbox',
									align: 'stretch'
								},
								fieldDefaults: {
									labelAlign: 'left',
									labelWidth: 70
								},
								defaults: {
									listeners: {
										change: {
											fn: me.onParamsChange,
											scope:me
										}
									}
								},
								items: [{
									xtype: 'checkbox',
									name: 'firstrow_is_header',
									boxLabel: 'First row as header',
									inputValue: 'true'
								},{
									xtype: 'combobox',
									width: 100,
									name: 'delimiter',
									fieldLabel: 'Delimiter',
									forceSelection: true,
									editable: false,
									store: {
										fields: ['delimiter_code','delimiter_symbol'],
										data : [
											{delimiter_code:'comma', delimiter_symbol:','},
											{delimiter_code:'semicolon', delimiter_symbol:';'},
											{delimiter_code:'pipe', delimiter_symbol:'|'},
											{delimiter_code:'tab', delimiter_symbol:'\\t'}
										]
									},
									queryMode: 'local',
									displayField: 'delimiter_symbol',
									valueField: 'delimiter_code'
								}]
							},{
								xtype: 'box',
								flex: 1,
								html: '&#160;'
							},{
								itemId: 'rgBibleTruncateMode',
								hidden: !(me.parentDataWindow.dataType=='bible'),
								xtype: 'radiogroup',
								columns: 1,
								vertical: true,
								items:[
									{boxLabel: 'Append to bible', name: 'bible_truncate_mode', inputValue: 'append', checked: true},
									{boxLabel: 'Truncate before', name: 'bible_truncate_mode', inputValue: 'truncate'}
								]
							},{
								itemId: 'rgFileOverwriteMode',
								hidden: !(me.parentDataWindow.dataType=='file'),
								xtype: 'radiogroup',
								columns: 1,
								vertical: true,
								items:[
									{boxLabel: 'Truncate before', name: 'file_truncate_mode', inputValue: 'truncate'},
									{boxLabel: 'Overwrite primaryKeys', name: 'file_truncate_mode', inputValue: 'overwrite', checked: true},
									{boxLabel: 'Ignore if exists', name: 'file_truncate_mode', inputValue: 'ignore'},
									{boxLabel: '<font color="red">Delete on primaryKeys</font>', name: 'file_truncate_mode', inputValue: 'delete'}
								]
							},{
								itemId: 'rgTableOverwriteMode',
								hidden: !(me.parentDataWindow.dataType=='table'),
								xtype: 'radiogroup',
								columns: 1,
								vertical: true,
								items:[
									{boxLabel: 'Append/Replace', name: 'table_truncate_mode', inputValue: 'append', checked: true},
									{boxLabel: 'Truncate before', name: 'table_truncate_mode', inputValue: 'truncate'}
								]
							},{
								xtype: 'box',
								flex: 1,
								html: '&#160;'
							},{
								xtype: 'component',
								overCls: 'op5-crmbase-dataimport-go-over',
								renderTpl: Ext.create('Ext.XTemplate',
									'<div class="op5-crmbase-dataimport-go">',
									'<div class="op5-crmbase-dataimport-go-btn">',
									'</div>',
									'</div>',
									{
										compiled:true,
										disableFormats: true
									}
								),
								listeners: {
									afterrender: function(c) {
										c.getEl().on('click',this.handleCommit,this) ;
									},
									scope: this
								}
							}]
						}]
					}]
				},{
					itemId: 'pCsvGridCtn',
					flex: 1,
					xtype: 'container',
					layout: 'fit',
					hidden: true,
					border: false
				}]
			},{
				width: 350,
				hidden: true,
				title: 'Target: File fields',
				xtype: 'treepanel',
				itemId: 'pFieldsTree',
				border:false,
				useArrows: true,
				rootVisible: false,
				store: {
					model: 'StoreFieldsTreeModel',
					nodeParam: 'field_code',
					root: {children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					xtype: 'treecolumn', //this is so we know which column will show the tree
					text: 'Data field',
					flex: 1,
					sortable: false,
					dataIndex: 'field_text',
					menuDisabled: true,
					renderer: function(value,metaData,record) {
						if( record.get('csvsrc_idx') >= 0 ) {
							return '<b>'+value+'</b>' ;
						}
						return value ;
					}
				},{
					text: 'CSV field',
					flex: 1,
					sortable: false,
					dataIndex: 'csvsrc_text',
					menuDisabled: true,
					renderer: function(value) {
						return '<b>'+value+'</b>' ;
					}
				}],
				listeners: {
					itemcontextmenu : function(view, record, item, index, event) {
						if( record.get('csvsrc_idx') < 0 ) {
							return ;
						}
						
						Ext.create('Ext.menu.Menu',{
							listeners: {
								hide: function(menu) {
									Ext.defer(function(){menu.destroy();},10) ;
								}
							},
							items : {
								iconCls: 'icon-bible-delete',
								text: 'Delete condition',
								handler : function() {
									record.set('csvsrc_idx',-1) ;
									record.set('csvsrc_text','') ;
									record.commit() ;
								},
								scope : me
							}
						}).showAt(event.getXY()) ;
					}
				},
				viewConfig: {
					listeners:{
						render:function(treeview){
							treeview.dropZone = Ext.create('Ext.dd.DropZone',treeview.getEl(),{
								ddGroup: 'DataImportDD-'+me.getId(),
								view: treeview,
								
								getTargetFromEvent : function(e) {
									var node = e.getTarget(this.view.getItemSelector()) ;
									return node ;
								},
								getTargetNode: function( node ) {
									var view = this.view,
										targetNode = view.getRecord(node) ;
										
									if( targetNode==null || !targetNode.isLeaf() ) {
										return null ;
									}
									return targetNode ;
								},
								
								onNodeOver: function(node,dragZone,e,data) {
									var targetNode = this.getTargetNode(node) ;
										
									if( targetNode==null ) {
										return this.dropNotAllowed ;
									}
									return this.dropAllowed ;
								},
								onNodeDrop: function(node,dragZone,e,data) {
									var targetNode = this.getTargetNode(node) ;
										
									if( targetNode==null ) {
										return false ;
									}
									
									// Set
									targetNode.set('csvsrc_idx',data.colIdx) ;
									targetNode.set('csvsrc_text',data.header.text) ;
									
									return true ;
								}
							}) ;
						},
						scope: me
					}
				}
			},{
				border: false,
				hidden: true,
				width: 500,
				xtype: 'form',
				itemId: 'pFormNew',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items:[{
					xtype: 'fieldset',
					title: 'New table definition',
					layout: 'anchor',
					padding: 10,
					items: [{
						xtype: 'textfield',
						name: 'store_code',
						fieldLabel: 'Table code',
						allowBlank: false
					},{
						xtype:'checkboxfield', 
						name: 'store_type_primarykey',
						boxLabel: 'Has primary key',
						//readOnly : (this.defineIsNew == false),
						listeners: {
							change:{
								fn: function(field,value) {
									var form = field.up('form'),
										grid = form.down('grid') ;
									grid.headerCt.down('[dataIndex="new_field_is_primarykey"]').setVisible(value) ;
									//list.setVisible(value) ;
								},
								scope : this
							}
						}
					}]
				},{
					xtype: 'grid',
					title: 'Columns mapping',
					flex: 1,
					store: {
						model: 'StoreFieldsNewModel',
						data: [],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					},
					plugins: [{
						ptype: 'cellediting',
						pluginId: 'cellediting',
						clicksToEdit: 1
					}],
					columns: {
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
							dataIndex: 'csvsrc_text',
							text: 'Source column',
							width: 120
						},{
							dataIndex: 'new_field_code',
							text: 'Target code',
							width: 120,
							editor: {
								xtype: 'textfield',
								maskRe: /[A-Za-z0-9_]/
							}
						},{
							dataIndex: 'new_field_type',
							text: 'Type',
							width: 80,
							editor: {
								xtype: 'combobox',
								forceSelection: true,
								editable: false,
								store: {
									fields: ['type'],
									data : [
										{"type":"string"},
										{"type":"text"},
										{"type":"number"},
										{"type":"extid"},
										{"type":"date"}
									]
								},
								queryMode: 'local',
								displayField: 'type',
								valueField: 'type'
							}
						},{
							xtype: 'checkcolumn',
							hidden: true,
							dataIndex: 'new_field_is_primarykey',
							text: 'Key?',
							width: 60
						},{
							xtype: 'checkcolumn',
							dataIndex: 'new_field_is_index',
							text: 'Index?',
							width: 60
						}]
					}
				}]
			}]
		}) ;
		
		me.callParent() ;
		
		me.startLoading() ;
	},
	startLoading: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_importTransaction',
			_subaction: 'init',
			data_type: me.parentDataWindow.dataType,
			file_code: me.parentDataWindow.fileId,
			bible_code: me.parentDataWindow.bibleId,
			table_code: me.parentDataWindow.tableId
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxReponse = Ext.decode(response.responseText) ;
				if( ajaxReponse.success == false ) {
					var msg = 'Failed' ;
					if( ajaxReponse.denied ) {
						msg = 'Authorization denied' ;
					}
					Ext.Msg.alert('Failed', msg, function() {
						me.destroy() ;
					});
				}
				else {
					me.transaction_id = ajaxReponse.transaction_id ;
					if( ajaxReponse.is_new ) {
						me.getComponent('pFormNew').setVisible(true);
					} else {
						me.getComponent('pFieldsTree').setRootNode( ajaxReponse.treefields_root ) ;
						me.getComponent('pFieldsTree').setVisible(true);
						me.getComponent('pFieldsTree').getRootNode().cascadeBy( function(node) {
							if( node.get('table_field_is_binary') ) {
								node.set('icon','images/op5img/ico_dataadd_16.gif') ;
							}
						}) ;
					}
				}
			},
			scope: this
		});
	},
	
	doUpload: function() {
		var me = this ;
			csvForm = me.getComponent('pCsv').getComponent('pCsvForm').getForm() ;
		
		if(csvForm.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_action: 'data_importTransaction',
				_transaction_id: me.transaction_id,
				_subaction: 'csvsrc_upload'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading source...');
			csvForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form, action){
					msgbox.close() ;
					
					var response = Ext.JSON.decode(action.response.responseText) ;
					me.handleResponse(response) ;
				},
				failure: function(form, action){
					msgbox.close() ;
					
					var str = 'Error during upload' ;
					if( action.response.responseText ) {
						var response = Ext.JSON.decode(action.response.responseText) ;
						if( response != null && response.failure != null ) {
							str =  response.failure ;
						}
					}
					Ext.Msg.alert('Failed', str) ;
					me.handleResponse(null) ;
				},
				scope: me
			});
		}
	},
	onParamsChange: function() {
		var me = this;
			csvForm = me.getComponent('pCsv').getComponent('pCsvForm').getForm() ;
			
		if( me.suspendOnParamsChange ) {
			return ;
		}
			
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_importTransaction',
			_transaction_id: me.transaction_id,
			_subaction: 'params_set',
			csvsrc_params: Ext.JSON.encode(csvForm.getValues())
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function( response ) {
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				this.handleResponse(ajaxResponse) ;
			},
			scope: this
		});
	},
	
	handleResponse: function(ajaxResponse) {
		var me = this,
			csvGridCtn = me.getComponent('pCsv').getComponent('pCsvGridCtn'),
			csvForm = me.getComponent('pCsv').getComponent('pCsvForm'),
			formNew = me.getComponent('pFormNew') ;
		
		if( ajaxResponse == null || typeof ajaxResponse.data == 'undefined' ) {
			csvGridCtn.setVisible(false) ;
			csvGridCtn.removeAll() ;
			
			// hide form fieldset
			csvForm.getComponent('fsBuffer').setVisible(false) ;
			
			return ;
		}
		
		var ajaxData = ajaxResponse.data ;
		
		// Create grid
		if( ajaxData.grid_columns && ajaxData.grid_data ) {
			var jsFields=[], jsColumns=[], jsData=[] ;
			
			for( var i=0 ; i<ajaxData.grid_columns.length ; i++ ) {
				jsFields.push({
					name: ajaxData.grid_columns[i].dataIndex,
					type: 'string'
				}) ;
				jsColumns.push(ajaxData.grid_columns[i]) ;
			}
			
			var csvGrid = Ext.create('Ext.grid.Panel',{
				scroll: 'horizontal',
				columns: {
					defaults: {
						menuDisabled: true,
						sortable: false,
						draggable: false
					},
					items: jsColumns
				},
				enableColumnResize: true,
				enableColumnMove:   false,
				store: {
					fields: jsFields,
					data: ajaxData.grid_data
				}
			}) ;
			csvGrid.child('headercontainer').on('destroy',function(csvGridHeaderView) {
				if( csvGridHeaderView.ddel ) {
					csvGridHeaderView.ddel.destroy() ;
				}
			}) ;
			csvGrid.child('headercontainer').on('render',function(csvGridHeaderView) {
				csvGridHeaderView.ddel = Ext.get(document.createElement('div'));
				Ext.getBody().appendChild( csvGridHeaderView.ddel );
				csvGridHeaderView.dragZone = Ext.create('Ext.dd.DragZone',csvGridHeaderView.getEl(), {
					ddGroup: 'DataImportDD-'+me.getId(),
					view: csvGridHeaderView,
					
					colHeaderCls: Ext.baseCSSPrefix + 'column-header',
					
					getRepairXY: function() {
						return this.dragData.header.el.getXY();
					},
					getDragData: function(e) {
						var header = e.getTarget('.'+this.colHeaderCls),
							headerCmp,
							ddel = this.view.ddel ;

						if (header) {
							headerCmp = Ext.getCmp(header.id);
							ddel.dom.innerHTML = Ext.getCmp(header.id).text;
							return {
								records:[],
								ddel: ddel.dom,
								header: headerCmp,
								colIdx: this.view.getHeaderIndex(headerCmp)
							};
						}
						return false;
					}
				});
			},me) ;
			
			csvGridCtn.removeAll() ;
			csvGridCtn.add(csvGrid) ;
			csvGridCtn.setVisible(true) ;
		}
		if( formNew.isVisible() ) {
			var formNewGridData = [] ;
			if( ajaxData.grid_columns ) {
				var csvsrcIdx=0 ;
				Ext.Array.each( ajaxData.grid_columns, function(csvsrcCol) {
					formNewGridData.push({
						csvsrc_idx: csvsrcIdx++,
						csvsrc_text: csvsrcCol.text,
						new_field_code: csvsrcCol.text.split(' ').join('_').replace(/[^a-z0-9_]+/gi, "").toUpperCase(),
						new_field_type: 'string'
					});
				}) ;
			}
			formNew.down('grid').getStore().loadData(formNewGridData) ;
		}
		
		// Load form data
		if( ajaxData.csvsrc_params ) {
			csvForm.getComponent('fsBuffer').setVisible(true) ;
			me.suspendOnParamsChange = true ;
			var formValues = ajaxData.csvsrc_params ;
			if( !Ext.isEmpty(formValues.truncate_mode) ) {
				switch( me.parentDataWindow.dataType ) {
					case 'bible' :
						formValues['bible_truncate_mode'] = formValues.truncate_mode ;
						break ;
						
					case 'file' :
						formValues['file_truncate_mode'] = formValues.truncate_mode ;
						break ;
						
					case 'table' :
						formValues['table_truncate_mode'] = formValues.truncate_mode ;
						break ;
				}
			}
			csvForm.getForm().setValues(formValues) ;
			me.suspendOnParamsChange = false ;
		}
		
		
		if( ajaxData.map_fieldCode_csvsrcIdx ) {
			// Apply existing mapping
			var fieldsTree = me.getComponent('pFieldsTree') ;
			Ext.Object.each( ajaxData.map_fieldCode_csvsrcIdx, function(fieldCode,csvsrcIdx) {
				var csvsrcText = ajaxData.grid_columns[csvsrcIdx].text ;
				var fieldNode = fieldsTree.getStore().getNodeById(fieldCode) ;
				if( fieldNode != null ) {
					fieldNode.set('csvsrc_idx',csvsrcIdx) ;
					fieldNode.set('csvsrc_text',csvsrcText) ;
				}
			}) ;
		} else {
			// clear mapping
			me.getComponent('pFieldsTree').getRootNode().cascadeBy( function(rec) {
				rec.set('csvsrc_idx',-1) ;
				rec.set('csvsrc_text','') ;
				rec.commit() ;
			},me) ;
		}
	},
	
	handleCommit: function() {
		var msgTitle = 'Do import',
			msgText = 'Commit buffer using selected mapping ?' ;
		var me = this,
			csvForm = me.getComponent('pCsv').getComponent('pCsvForm').getForm(),
			formNew = me.getComponent('pFormNew') ;
		if( csvForm.getValues().file_truncate_mode == 'delete' ) {
			msgTitle = 'Do delete' ;
			msgText = '<b>Will delete on primary key(s) match</b>' ;
		}
		if( formNew.isVisible() && !formNew.getForm().isValid() ) {
			return ;
		}
		Ext.Msg.confirm(msgTitle, msgText, function(btn){
			if( btn == 'yes' ) {
				if( this.getComponent('pFormNew').isVisible() ) {
					this.handleCommitNew() ;
				} else {
					this.handleCommitDo() ;
				}
			}
		},this) ;
	},
	handleCommitNew: function() {
		var me = this,
			formNew = me.getComponent('pFormNew') ;
		if( !formNew.isVisible() || !formNew.getForm().isValid() ) {
			return ;
		}
		
		var values = formNew.getForm().getValues() ;
		var formNewGridData = [] ;
		formNew.down('grid').getStore().each( function(rec) {
			formNewGridData.push( rec.getData() ) ;
		}) ;
		values['define_fields'] = formNewGridData ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_importTransaction',
			_transaction_id: me.transaction_id,
			_subaction: 'do_commit_new',
			define_data: Ext.JSON.encode(values)
		});
		
		var msgbox = Ext.Msg.wait('Import in progress...');
		me.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (10 * 60 * 1000),
			params: ajaxParams ,
			success: function( response ) {
				msgbox.close();
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				if( ajaxResponse.success ) {
					me.optimaModule.postCrmEvent('definechange',{
					});
					me.destroy() ;
				} else {
					var msg = 'Import failed' ;
					if( ajaxResponse.error ) {
						msg = ajaxResponse.error ;
					}
					Ext.Msg.alert('Failed', msg);
				}
			},
			scope: this
		});
	},
	handleCommitDo: function() {
		var me = this,
			csvForm = me.getComponent('pCsv').getComponent('pCsvForm').getForm() ,
			fieldsTree = me.getComponent('pFieldsTree') ;
			
		map_fieldCode_csvsrcIdx = {} ;
		fieldsTree.getRootNode().cascadeBy( function(node) {
			var nodeFieldcode = node.get('field_code') ;
			if( node.get('csvsrc_idx') >= 0 ) {
				map_fieldCode_csvsrcIdx[nodeFieldcode] = node.get('csvsrc_idx') ;
			}
		}) ;
		
		var truncateMode = '' ;
		switch( me.parentDataWindow.dataType ) {
			case 'bible' :
				truncateMode = csvForm.getValues().bible_truncate_mode ;
				break ;
				
			case 'file' :
				truncateMode = csvForm.getValues().file_truncate_mode ;
				break ;
				
			case 'table' :
				truncateMode = csvForm.getValues().table_truncate_mode ;
				break ;
		}
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_importTransaction',
			_transaction_id: me.transaction_id,
			_subaction: 'do_commit',
			truncate_mode: truncateMode,
			map_fieldCode_csvsrcIdx: Ext.JSON.encode(map_fieldCode_csvsrcIdx)
		});
		
		var msgbox = Ext.Msg.wait('Import in progress...');
		me.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (10 * 60 * 1000),
			params: ajaxParams ,
			success: function( response ) {
				msgbox.close();
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				if( ajaxResponse.success ) {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: me.parentDataWindow.dataType,
						bibleId: me.parentDataWindow.bibleId,
						fileId: me.parentDataWindow.fileId,
						tableId: me.parentDataWindow.tableId
					});
					me.destroy() ;
				} else {
					var msg = 'Import failed' ;
					if( ajaxResponse.error ) {
						msg = ajaxResponse.error ;
					}
					Ext.Msg.alert('Failed', msg);
				}
			},
			scope: this
		});
	},
	
	onDestroy: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_importTransaction',
				_transaction_id: this.transaction_id ,
				_subaction: 'end'
			}
		}) ;
		this.callParent() ;
	}
}) ;
