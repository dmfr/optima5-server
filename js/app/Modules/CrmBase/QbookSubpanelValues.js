Ext.define('QbookValuesTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'text', type:'string'},
		{name: 'src_inputvar_jsId',   type: 'string'},
		{name: 'src_qobj_jsId',   type: 'string'},
		{name: 'src_query_selectfield_idx',   type: 'int'},
		{name: 'src_qmerge_mselectfield_idx',   type: 'int'}
	]
});

Ext.define('QbookBackendTargetTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field_code',
	fields: [
		{name: 'text',  type: 'string'},
		{name: 'backend_file_code',  type: 'string'},
		{name: 'backend_file_field_code',   type: 'string'},
		{name: 'backend_file_field_isDisabled',   type: 'boolean'},
		{name: 'src_value_idx',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.CrmBase.QbookSubpanelValues' ,{
	extend: 'Optima5.Modules.CrmBase.QbookSubpanel',
			  
	alias: 'widget.op5crmbaseqbookvalues',
	
	inputvarStore : null ,
	qobjStore : null ,
	valueStore : null ,
	
	
	initComponent: function() {
		var me = this,
			hasSaveto = false ;
		
		me.valueStore.each( function(valueRecord,valueRecordIdx) {
			valueRecord.saveto().each( function(valueSavetoRecord) {
				hasSaveto = true ;
			},me) ;
		},me) ;
		
		Ext.apply(this,{
			layout: {
				type: 'border',
				align: 'stretch'
			},
			items:[{
				region:'west',
				flex: 1,
				xtype: 'treepanel',
				itemId: 'bWestTree' ,
				title: 'Source values / Qobject values',
				border: false,
				collapsible:false ,
				collapseDirection:'left',
				collapseMode:'header',
				collapsed: false,
				headerPosition:'right',
				useArrows: true,
				rootVisible: false,
				store: {
					model: 'QbookValuesTreeModel',
					root: {
						root:true,
						children:[]
					}
				},
				viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'QbookValuesToQbookValue'+me.getParentId()
					}
				}
			},{
				xtype:'panel',
				itemId: 'pCenter' ,
				region:'center',
				flex: 2,
				border: false,
				title:'Output values',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [ Ext.apply(me.initComponentCreateGrid(),{
					flex:1 
				}),Ext.apply(me.initComponentCreateFormulaPanel(),{
					flex:1 
				})]
			},{
				region:'east',
				flex: 1,
				xtype: 'treepanel',
				itemId: 'bEastTree' ,
				title: 'Store values to backend file',
				border: false,
				collapsible:true ,
				collapseDirection:'right',
				collapseMode:'header',
				collapsed: (!hasSaveto),
				headerPosition:'left',
				useArrows: true,
				rootVisible: false,
				store: {
					model: 'QbookBackendTargetTreeModel',
					root: {
						root:true,
						children:[]
					}
				},
				listeners: {
					itemclick: function( view, record, item, index, event ) {
					},
					itemcontextmenu: function(view, record, item, index, event) {
						if( record.getDepth() < 2 ) {
							return ;
						}
						while( record.getDepth() > 2 ) {
							record = record.parentNode ;
						}
						if( !record.hasChildNodes() ) {
							return ;
						}
						
						var targetFileCode = record.get('backend_file_code'),
							targetFileFieldCode = record.get('backend_file_field_code') ;
						
						gridContextMenuItems = new Array() ;
						gridContextMenuItems.push({
							iconCls: 'icon-bible-delete',
							text: 'Unassign',
							handler : function() {
								me.onRemoveSaveto( targetFileCode, targetFileFieldCode ) ;
							},
							scope : me
						});
						
						var gridContextMenu = Ext.create('Ext.menu.Menu',{
							items : gridContextMenuItems
						}) ;
						
						gridContextMenu.showAt(event.getXY());
					},
					scope: me
				},
				viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						ddGroup:'QbookValueToBackendField'+this.getParentId(),
						enableDrag:false,
						enableDrop:true,
						appendOnly:true,
						allowParentInsert:false,
						containerScroll: true
					},
					listeners:{
						beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
							if( data.records.length != 1 ) {
								return false ;
							}
							var dragRecord = data.records[0] ;
							if( Ext.getClassName(dragRecord) != 'QbookValueModel' || Ext.getClassName(dropRecord) != 'QbookBackendTargetTreeModel' ) {
								return false ;
							}
							if( dropRecord.getDepth() != 2 || dropRecord.get('backend_file_field_isDisabled') ) {
								return false ;
							}
							
							dropHandlers.wait = true ;
							
							var targetFileCode = dropRecord.get('backend_file_code'),
								targetFileFieldCode = dropRecord.get('backend_file_field_code') ;
							
							// *** Delete any "saveto" targeted at selected file field
							me.valueStore.suspendEvents(false) ;
							me.valueStore.each( function(valueRecord) {
								var toDelete = [] ;
								valueRecord.saveto().each( function(valueSavetoRecord) {
									if( valueSavetoRecord.get('target_backend_file_code') == targetFileCode 
										&& valueSavetoRecord.get('target_backend_file_field_code') == targetFileFieldCode
									) {
										toDelete.push(valueSavetoRecord) ;
									}
								},me) ;
								valueRecord.saveto().remove(toDelete) ;
							},me) ;
							me.valueStore.resumeEvents() ;
							
							var valueRecord = dragRecord ;
							var valueSavetoRecord = Ext.create('QbookValueSavetoModel',{
								target_backend_file_code: targetFileCode,
								target_backend_file_field_code:targetFileFieldCode
							}) ;
							valueRecord.saveto().insert(0,valueSavetoRecord) ;
							valueRecord.commit() ;
							return true ;
						},
						scope:this
					}
				}
			}]
		});
		
		this.callParent();
		this.syncWestTree() ;
		this.syncEastTree() ;
		this.mon( me.inputvarStore, 'datachanged', this.syncWestTree, this ) ;
		this.mon( me.inputvarStore, 'update', this.syncWestTree, this ) ;
		this.mon( me.qobjStore, 'datachanged', this.syncWestTree, this ) ;
		this.mon( me.qobjStore, 'update', this.syncWestTree, this ) ;
		this.mon( me.valueStore, 'datachanged', this.syncEastTree, this ) ;
		this.mon( me.valueStore, 'update', this.syncEastTree, this ) ;
		this.mon( this.parentQbookPanel, 'selectbackendfile', this.syncEastTree, this ) ;
	},
	
	syncEastTree: function() {
		var me = this,
			bEastTree = me.getComponent('bEastTree'),
			backendFileCode = me.parentQbookPanel.backend_file_code ;
		
		if( backendFileCode == null || backendFileCode == '' 
			|| typeof me.getQbookPanel().bibleFilesTreefields[backendFileCode] === 'undefined'
		) {
			console.log('none') ;
			bEastTree.setVisible(false) ;
			bEastTree.setRootNode({
				root:true,
				children:[]
			}) ;
			return ;
		}
		
		// **** Map index  file%field => srcvalueIdx
		var mapFilefieldValueidx = {},
			mKey ;
		me.valueStore.each( function(valueRecord,valueRecordIdx) {
			valueRecord.saveto().each( function(valueSavetoRecord) {
				mKey = valueSavetoRecord.get('target_backend_file_code')+'|'+valueSavetoRecord.get('target_backend_file_field_code') ;
				mapFilefieldValueidx[mKey] = valueRecordIdx ;
			},me) ;
		},me) ;
		
		// *** Construction de l'arbre ****
		var rootChildren = [] ;
		me.getQbookPanel().bibleFilesTreefields[backendFileCode].getRootNode().eachChild( function( fileNode ) {
			if( fileNode.get('field_code') != backendFileCode ) {
				return ;
			}
			var fileFieldNodes = [] ;
			fileNode.eachChild( function( fileFieldNode ) {
				var valueNode = [],
					ttmp = fileFieldNode.get('field_code').split('_field_'),
					fileCode = ttmp[0],
					fileFieldCode = ttmp[1],
					mKey = fileCode+'|'+fileFieldCode ;
				
				if( typeof mapFilefieldValueidx[mKey] !== 'undefined' ) {
					var valueRecordIdx = mapFilefieldValueidx[mKey],
						valueRecord = me.valueStore.getAt(valueRecordIdx) ;
					valueNode.push({
						text: '<b>'+valueRecord.get('select_lib')+'</b>',
						icon: 'images/dot_orange_16.gif',
						backend_file_code: fileCode,
						backend_file_field_code:fileFieldCode,
						src_value_idx: mapFilefieldValueidx[mKey],
						leaf: true
					}) ;
				}
				
				var text = fileFieldNode.get('field_text') ;
				if( valueNode.length > 0 ) {
					text = '<b><font color="red">' + text + '</font></b>' ;
				}
				fileFieldNodes.push({
					text: text,
					icon: 'images/op5img/ico_showref_listall.gif',
					backend_file_code: fileCode,
					backend_file_field_code:fileFieldCode,
					backend_file_field_isDisabled: (fileFieldNode.get('field_type') != 'number'),
					children: valueNode,
					expanded: (valueNode.length > 0),
					leaf: false
				});
			},me) ;
			rootChildren.push({
				text: fileNode.get('field_text'),
				backend_file_code: fileNode.get('field_code'),
				children: fileFieldNodes,
				expanded: true
			}) ;
		},me) ;
		
		bEastTree.setVisible(true) ;
		bEastTree.setRootNode({
			root:true,
			expanded:true,
			children:rootChildren
		}) ;
	},
	syncWestTree: function() {
		var me = this,
			bibleQobjsStore = me.getQbookPanel().bibleQobjsStore ;
		
		// **** Arbre recap des Qobjs et de leur liens *****
		var rootChildren = [] ;
		var inputvarsChildren = [] ;
		me.inputvarStore.each( function(inputvarRecord) {
			inputvarsChildren.push({
				leaf: true,
				text: inputvarRecord.get('inputvar_lib'),
				src_inputvar_jsId: inputvarRecord.getId(),
				src_qobj_jsId: '',
				src_query_selectfield_idx: -1,
				src_qmerge_mselectfield_idx: -1
			}) ;
		},me) ;
		rootChildren.push({
			expanded:true,
			children:inputvarsChildren,
			icon: 'images/op5img/ico_showref_listall.gif',
			text: '<u>Input/source variables</u>',
		}) ;
		
		me.qobjStore.each( function(qobjRecord) {
			var qRecord,
				selectFields = [] ;
			switch( qobjRecord.get('target_q_type') ) {
				case 'query' :
					qRecord = bibleQobjsStore.getByQueryId(qobjRecord.get('target_query_id')) ;
					qRecord.fields_select().each( function( selectFieldRecord, selectFieldIdx ) {
						var selectField = {
							leaf: true,
							text: selectFieldRecord.get('select_lib'),
							src_inputvar_jsId: '',
							src_qobj_jsId: qobjRecord.getId(),
							src_query_selectfield_idx: selectFieldIdx,
							src_qmerge_mselectfield_idx: -1
						} ;
						selectFields.push(selectField) ;
					},me) ;
					rootChildren.push({
						expanded:true,
						icon: 'images/op5img/ico_process_16.gif',
						text: '<b>'+qobjRecord.get('qobj_lib')+'</b>',
						children: selectFields
					}) ;
					break ;
					
				case 'qmerge' :
					qRecord = bibleQobjsStore.getByQmergeId(qobjRecord.get('target_qmerge_id')) ;
					qRecord.fields_mselect().each( function( mselectFieldRecord, mselectFieldIdx ) {
						var selectField = {
							leaf: true,
							text: mselectFieldRecord.get('select_lib'),
							src_inputvar_jsId: '',
							src_qobj_jsId: qobjRecord.getId(),
							src_query_selectfield_idx: -1,
							src_qmerge_mselectfield_idx: mselectFieldIdx
						} ;
						selectFields.push(selectField) ;
					},me) ;
					rootChildren.push({
						expanded:true,
						icon: 'images/op5img/ico_filechild_16.gif',
						text: '<b>'+qobjRecord.get('qobj_lib')+'</b>',
						children: selectFields
					}) ;
					break ;
			}
		},me) ;
		
		me.getComponent('bWestTree').getStore().setRootNode({
			root:true,
			text:'',
			children:rootChildren,
			expanded:true
		});
	},
	
	initComponentCreateGrid: function() {
		var me = this,
			store = me.valueStore ;
		
		var rowEditing = Ext.create('Ext.grid.plugin.RowEditing') ;
		rowEditing.on('canceledit', function() {
			var records = store.getRange();
			for (var i = 0; i < records.length; i++) {
				if( records[i].validate().getCount() > 0 )
					store.remove(records[i]) ;
			}
		},me) ;
		
		
		var grid = Ext.create('Ext.grid.Panel',{
			plugins: [rowEditing],
			store: store ,
			sortableColumns: false ,
			columns: [
				{ menuDisabled: true , header: 'Field Code',  dataIndex: 'select_lib' , flex:1, editor:{xtype:'textfield'}  }
			],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'left',
				items: [{
					iconCls: 'icon-add',
					handler: function(){
						var newRecordIndex = 0 ;
						
						store.insert(newRecordIndex, Ext.create('QbookValueModel'));
						grid.getView().getSelectionModel().select(newRecordIndex) ;
						rowEditing.startEdit(newRecordIndex, 0);
					},
					scope: me
				}, '-', {
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = grid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							store.remove(selection);
						}
					},
					scope: me
				}]
			}],
			viewConfig: {
				plugins: [{
					ptype: 'gridviewdragdrop',
					ddGroup:'QbookValueToBackendField'+this.getParentId(),
					enableDrag:true,
					enableDrop:true
				}]
			}
		}) ;
		
		grid.getSelectionModel().on('selectionchange', function(selModel, selections){
			grid.down('#delete').setDisabled(selections.length === 0);
			me.setFormulaRecord( selections[0] ) ;
		},me);
		
		return grid ;
	},
	initComponentCreateFormulaPanel: function(){
		var me = this ;
		
		me.formulapanel = Ext.create('Ext.panel.Panel',{
			layout:'fit',
			border:false,
			items:[{
				xtype:'panel',
				border:false,
				frame:true
			}]
		}) ;
		
		return me.formulapanel ;
	},
			  
			  
	
	setFormulaRecord: function( editedrecord ){
		var me = this ;
		me.formulapanel.removeAll() ;
		if( typeof editedrecord === 'undefined' || editedrecord === null ) {
			me.formulapanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var formulaStore = editedrecord.math_expression() ;
		
		var formulaGrid = Ext.create('Ext.grid.Panel',{
			sortableColumns: false ,
			plugins: [Ext.create('Ext.grid.plugin.RowEditing')] ,
			store : formulaStore ,
			columns: [{
				menuDisabled: true ,
				header: 'Math' ,
				dataIndex: 'math_operation',
				width: 40 ,
				editor : {
					xtype: 'combobox',
					name: 'condition_bible_mode',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_operation','lib'],
						data : [
							{math_operation:'', lib:'no'},
							{math_operation:'+', lib:'+'},
							{math_operation:'-', lib:'-'},
							{math_operation:'*', lib:'X'},
							{math_operation:'/', lib:'/'},
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_operation'
				},
				renderer: function( value ) {
					if( value != null && value.length > 0 ) {
						return '<b>'+value+'</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>(</b>]' ,
				dataIndex: 'math_parenthese_in',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>(</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: 'Field/Value' ,
				dataIndex: 'math_fieldoperand',
				flex:1 ,
				renderer: function( value, metaData, record ) {
					if( record.get('math_staticvalue') > 0 ) {
						return 'STATIC(<u>'+record.get('math_staticvalue')+'</u>)' ;
					}
					
					if( record.get('math_operand_inputvar_jsId') && record.get('math_operand_inputvar_jsId') != '' ) {
						var inputvarRecord = me.inputvarStore.getById(record.get('math_operand_inputvar_jsId')) ;
						if( inputvarRecord != null ) {
							return '(value) ' + inputvarRecord.get('inputvar_lib') ;
						}
					}
					
					if( record.get('math_operand_qobj_jsId') && record.get('math_operand_qobj_jsId') != '' ) {
						var qobjRecord = me.qobjStore.getById(record.get('math_operand_qobj_jsId')),
							qRecord, selectFieldRecord, mselectFieldRecord ;
						if( qobjRecord == null ) {
							return '?' ;
						}
						switch( qobjRecord.get('target_q_type') ) {
							case 'query' :
								qRecord = me.getQbookPanel().bibleQobjsStore.getByQueryId(qobjRecord.get('target_query_id')) ;
								selectFieldRecord = qRecord.fields_select().getAt( record.get('math_operand_selectfield_idx') ) ;
								if( selectFieldRecord == null ) {
									return '?' ;
								}
								return qobjRecord.get('qobj_lib') + ' :: ' + selectFieldRecord.get('select_lib') ;
								
							case 'qmerge' :
								qRecord = me.getQbookPanel().bibleQobjsStore.getByQmergeId(qobjRecord.get('target_qmerge_id')) ;
								mselectFieldRecord = qRecord.fields_mselect().getAt( record.get('math_operand_mselectfield_idx') ) ;
								if( mselectFieldRecord == null ) {
									return '?' ;
								}
								return qobjRecord.get('qobj_lib') + ' :: ' + mselectFieldRecord.get('select_lib') ;
						}
					}
					
					return '?' ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>)</b>]' ,
				dataIndex: 'math_parenthese_out',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>)</b>' ;
					}
					return '' ;
				}
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					xtype:'label',
					text: 'R/d: '
				},{
					xtype: 'numberfield',
					name: 'math_round',
					width:35,
					value: editedrecord.get('math_round'),
					valueField: 'math_round',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_round',newValue) ;
						},
						scope:me
					}
				},'->',{
					itemId: 'addStatic',
					iconCls: 'icon-add',
					menu: {
						xtype:'menu' ,
						title: 'User options',
						items:[{
							xtype:'textfield' ,
							allowBlank: false,
							regex: /^[0-9]\d*(\.\d+)?$/ ,
							width:50
						},{
							xtype:'button',
							text:'Add value',
							handler: function(button){
								var textfield = button.up().query('textfield')[0] ;
								if( textfield.isValid() ) {
									var newRecord = Ext.create('QuerySelectFormulasymbolModel',{
										math_staticvalue:textfield.getValue()
									}) ;
									formulaGrid.getStore().insert( formulaGrid.getStore().count(), newRecord );
									
									Ext.menu.Manager.hideAll();
								}
							},
							scope:me
						}]
					}
				},{
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = formulaGrid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							formulaStore.remove(selection);
						}
					},
					scope: me
					
				}]
			}],
			listeners: {
				render: me.setFormulaRecordOnGridRender,
				scope: me
			},
			viewConfig: {
					listeners: {
						drop: function(){
						},
						scope: me
					},
					plugins: {
						ptype: 'gridviewdragdrop',
						ddGroup: 'queryselectreorder'+me.getParentId()
					}
			}
		}) ;
		formulaGrid.getSelectionModel().on('selectionchange', function(selModel, selections){
			formulaGrid.down('#delete').setDisabled(selections.length === 0);
		},me);
		
		me.formulapanel.add(formulaGrid) ;
	},
	setFormulaRecordOnGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'QbookValuesToQbookValue'+me.getParentId(),
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					if( selectedRecord.getDepth() != 2 ) {
						return false ;
					}
					
					var newRecord = Ext.create('QbookValueSymbolModel',{
						math_operand_inputvar_jsId: selectedRecord.get('src_inputvar_jsId'),
						math_operand_qobj_jsId: selectedRecord.get('src_qobj_jsId'),
						math_operand_selectfield_idx: selectedRecord.get('src_query_selectfield_idx'),
						math_operand_mselectfield_idx: selectedRecord.get('src_qmerge_mselectfield_idx')
					}) ;
					
					grid.getStore().insert( grid.getStore().count(), newRecord );

					/*
					// Load the record into the form
					formPanel.getForm().loadRecord(selectedRecord);
					// Delete record from the source store.  not really required.
					ddSource.view.store.remove(selectedRecord);
					*/
					return true;
			}
		});
	},
	
	
	onRemoveSaveto: function( targetFileCode, targetFileFieldCode ) {
		var me = this ;
		
		// *** Delete any "saveto" targeted at selected file field
		me.valueStore.each( function(valueRecord) {
			var toDelete = [] ;
			valueRecord.saveto().each( function(valueSavetoRecord) {
				if( valueSavetoRecord.get('target_backend_file_code') == targetFileCode 
					&& valueSavetoRecord.get('target_backend_file_field_code') == targetFileFieldCode
				) {
					toDelete.push(valueSavetoRecord) ;
				}
			},me) ;
			if( toDelete.length == 0 ) {
				return ;
			}
			valueRecord.saveto().remove(toDelete) ;
			valueRecord.commit() ;
		},me) ;
	}
}) ;