Ext.define('DefineJoinTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'alt_file_code',  type: 'string'},
		{name: 'file_field_code',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'text',   type: 'string'}
	]
});
Ext.define('DefineJoinMapModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'target_file_field_code',  type: 'string'},
		{name: 'target_field_type',  type: 'string'},
		{name: 'target_text',  type: 'string'},
		{name: 'local_alt_file_code',   type: 'string'},
		{name: 'local_file_field_code',   type: 'string'},
		{name: 'local_text',  type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.DefineStoreFieldJoinPanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires: ['Ext.ux.RowDropZone'],
	
	defineStorePanel: null,
	elementtabIdx: null,
	
	getElementtab: function() {
		return this.defineStorePanel.query('tabpanel')[0].child('#elementtab') ;
	},
	getElementtabRecord: function() {
		return this.getElementtab().getStore().getAt(this.elementtabIdx) ;
	},
	
	initComponent: function() {
		var me = this ;
		
		if( (me.defineStorePanel) instanceof Optima5.Modules.CrmBase.DefineStorePanel ) {} else {
			Optima5.Helper.logError('CrmBase:DefineStoreFieldJoinPanel','No DefineStorePanel reference ?') ;
		}
		me.on('destroy',function(thisview) {
			delete thisview.defineStorePanel ;
		},me) ;
		
		Ext.apply(me,{
			layout:{
				type:'hbox',
				align:'stretch'
			},
			items:[{
				xtype:'treepanel',
				itemId:'localTree',
				title: 'Local file',
				displayField: 'text',
				flex: 1,
				border: false,
				useArrows: true,
				rootVisible: false,
				store: {
					model: 'DefineJoinTreeModel',
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
						ddGroup: 'TreeToGrid'+me.getId()
					}
				}
			},{
				xtype:'panel',
				itemId:'targetPanel',
				title: 'Join target',
				flex: 2,
				border: false,
				layout: {
					type:'vbox',
					align:'stretch'
				},
				items: [{
					xtype:'form',
					border: false,
					frame:false,
					bodyPadding: 10,
					flex:1,
					bodyCls: 'ux-noframe-bg',
					defaults: {
						//anchor: '100%'
					},
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						labelSeparator: '',
						labelWidth: 75
					},
					items:[{
						xtype:'combobox',
						name:'target_file_code',
						fieldLabel:'Target file',
						anchor:'100%',
						forceSelection:true,
						editable:false,
						queryMode: 'local',
						displayField: 'fileLib' ,
						valueField: 'fileCode',
						store:{
							fields: ['fileCode', 'fileLib'],
							data : []
						},
						listeners: {
							change: {
								fn: me.onTargetFileSet ,
								scope: me
							}
						},
						hidden: true
					},{
						xtype:'combobox',
						name:'select_file_field_code',
						fieldLabel:'Select field',
						anchor:'100%',
						forceSelection:true,
						editable:false,
						queryMode: 'local',
						displayField: 'fieldLib' ,
						valueField: 'fieldCode',
						store:{
							fields: ['fieldCode', 'fieldLib'],
							data : []
						},
						hidden: true
					}]
				},{
					xtype:'grid',
					border: true,
					flex: 2,
					hidden: true,
					store: {
						model: 'DefineJoinMapModel',
						data: [],
						proxy: {
							type:'memory'
						}
					},
					columns: {
						defaults: {
							sortable: false,
							draggable: false,
							menuDisabled: true,
							maintainFlex:true
						},
						items: [{
							text: 'Target from',
							dataIndex:'target_text',
							flex: 2
						},{
							text: 'Join To',
							dataIndex:'local_text',
							flex: 3,
							renderer: function( value, metadata, record ) {
								if( value ) {
									metadata.tdCls = 'op5-crmbase-definejoin-grid-td-ok' ;
									if( record.get('local_alt_file_code') && record.get('local_alt_file_code') != '' ) {
										return '(' + record.get('local_alt_file_code') + ') ' + value ;
									} else {
										return value ;
									}
								} else {
									metadata.tdCls = 'op5-crmbase-definejoin-grid-td-empty' ;
									return '' ;
								}
							}
						}]
					},
					plugins: Ext.create('Ext.ux.RowDropZone',{
						ddGroup: 'TreeToGrid'+me.getId(),
						onRowDrop: function( dragData, dropTarget ) {
							var targetFieldRecord = dropTarget.record,
								localFieldRecord = dragData.records[0] ;
							if( targetFieldRecord && localFieldRecord ) {
								me.onMapAssign( targetFieldRecord, localFieldRecord ) ;
							}
						}
					})
				}]
			}]
		});
		
		this.callParent() ;
	},
	
	
	setElementtabIdx: function( elementtabIdx ) {
		var me = this ;
		
		me.getEl().mask() ;
		
		// Clear all stores
		var targetForm = me.getComponent('targetPanel').child('form').getForm(),
			targetFileCodeCombo = targetForm.findField('target_file_code'),
			selectFieldCodeCombo = targetForm.findField('select_file_field_code'),
			mapGrid = me.getComponent('targetPanel').child('grid') ;
		targetFileCodeCombo.setVisible(false) ;
		selectFieldCodeCombo.setVisible(false) ;
		mapGrid.setVisible(false) ;
		
		// Register rowIdx
		me.elementtabIdx = elementtabIdx ;
		if( me.getElementtabRecord() == null ) {
			Optima5.Helper.logError('CrmBase:DefineStoreFieldJoinPanel','No elementtab record index ?') ;
			me.elementtabIdx = null ;
			return ;
		}
		
		// Set Values
		me.on('ready',function() {
			me.getEl().unmask() ;
			me.applyValues() ;
		},me,{single:true}) ;
		
		me.on('beforehide',me.storeValues,me) 
		
		// Start Ajax queries chain
		me.buildLocalTreeDone = false ;
		me.buildLocalTree() ;
		
		me.buildTargetFilesDone = false ;
		me.buildTargetFiles() ;
	},
	
	buildLocalTree: function() {
		var me = this,
			optimaModule = me.defineStorePanel.optimaModule,
			defineForm = me.defineStorePanel.query('form')[0].getForm(),
			parentCombo = defineForm.findField('store_parent_code'),
			parentFileCode = ( parentCombo.getValue() != '' ? parentCombo.getValue() : null ),
			parentFileName = parentCombo.getStore().findRecord('fileCode',parentFileCode).data.fileLib ;
			
		// Current File has parent ?
		if( parentFileCode != null ) {
			optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_action: 'define_manageTransaction',
					_transaction_id: me.defineStorePanel.transactionID,
					_subaction:'tool_getAltFileFields',
					file_code : parentFileCode
				},
				success: function(response) {
					var ajaxData = Ext.decode(response.responseText).data ;
					
					var treeParentFileNode = {
						alt_file_code:parentFileCode,
						text: '<b>'+parentFileName+'</b>',
					
						expanded: true,
						leaf: false,
						children: []
					}
					Ext.Array.each( ajaxData, function(v) {
						treeParentFileNode.children.push({
							alt_file_code: parentFileCode,
							file_field_code: v.entry_field_code,
							field_type: v.entry_field_type,
							text: v.entry_field_lib,
							leaf:true
						});
					}) ;
					me.buildLocalTreeDo( treeParentFileNode ) ;
				},
				scope: me
			});
		} else {
			me.buildLocalTreeDo( null ) ;
		}
	},
	buildLocalTreeDo: function( treeParentFileNode ) {
		var me = this,
			defineForm = me.defineStorePanel.query('form')[0].getForm(),
			currentFileCode = defineForm.findField('store_code').getValue(),
			currentFileName = defineForm.findField('store_lib').getValue() ;
			
			
		var treeRootNode = {
			root:true,
			children:[] 
		};
		
		if( treeParentFileNode ) {
			treeRootNode.children.push( treeParentFileNode ) ;
		}
		
		// Get defined fields for current file
		var treeCurrentFileNode = {
			expanded: true,
			leaf: false,
			children: [],
			alt_file_code: null,
			text: '<b>'+currentFileName+'</b>'
		};
		Ext.Array.each( me.getElementtab().getStore().getRange(), function(rec){
			treeCurrentFileNode.children.push({
				alt_file_code: null,
				file_field_code: rec.get('entry_field_code'),
				text: rec.get('entry_field_lib'),
				field_type: rec.get('entry_field_type'),
				leaf: true
			});
		});
		treeRootNode.children.push(treeCurrentFileNode) ;
		
		me.getComponent('localTree').setRootNode( treeRootNode ) ;
		me.buildLocalTreeDone = true ;
		me.onBuild() ;
	},
	lookupTreeNode: function( altFileCode, fileFieldCode ) {
		var me = this,
			rootNode = me.getComponent('localTree').getRootNode(),
			fileNode = ( rootNode ? rootNode.findChild('alt_file_code',altFileCode) : null ),
			fieldNode = ( fileNode ? fileNode.findChild('file_field_code',fileFieldCode) : null ) ;
		return fieldNode ;
	},
	
	buildTargetFiles: function() {
		var me = this,
			optimaModule = me.defineStorePanel.optimaModule,
			defineForm = me.defineStorePanel.query('form')[0].getForm(),
			currentFileCode = defineForm.findField('store_code').getValue() ;
		/*
		 * Init Target File combo 
		 * - AJAX for "primary key" files
		 */
		optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'define_manageTransaction',
				_transaction_id: me.defineStorePanel.transactionID,
				_subaction:'tool_getAltFiles'
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText).data ;
				var altFiles = [{fileCode:null,fileLib:'- No target selected -'}] ;
				Ext.Array.each( ajaxData, function(v) {
					if( v.file_type != 'file_primarykey' ) {
						return ;
					}
					if( v.file_code == currentFileCode ) {
						return ;
					}
					altFiles.push({
						fileCode: v.file_code,
						fileLib: v.file_code+': '+v.file_lib
					});
				}) ;
				
				me.getComponent('targetPanel').child('form').getForm().findField('target_file_code').setValue(null) ;
				me.getComponent('targetPanel').child('form').getForm().findField('target_file_code').getStore().loadData(altFiles) ;
				me.buildTargetFilesDone = true ;
				me.onBuild() ;
			},
			scope: me
		});
	},
	onBuild: function() {
		var me = this ;
		if( !me.buildLocalTreeDone ) {
			return ;
		}
		if( !me.buildTargetFilesDone ) {
			return ;
		}
		me.fireEvent('ready',me) ;
	},
	
	onTargetFileSet: function() {
		var me = this,
			optimaModule = me.defineStorePanel.optimaModule,
			targetForm = me.getComponent('targetPanel').child('form').getForm(),
			targetFileCodeCombo = targetForm.findField('target_file_code'),
			targetFileCode = targetFileCodeCombo.getValue(),
			selectFieldCodeCombo = targetForm.findField('select_file_field_code'),
			mapGrid = me.getComponent('targetPanel').child('grid') ;
		
		if( targetFileCode == null ) {
			selectFieldCodeCombo.setVisible( false );
			selectFieldCodeCombo.setValue(null) ;
			selectFieldCodeCombo.getStore().removeAll() ;
			
			mapGrid.setVisible( false );
			mapGrid.getStore().removeAll() ;
			
			return ;
		}
			
		optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'define_manageTransaction',
				_transaction_id: me.defineStorePanel.transactionID,
				_subaction:'tool_getAltFileFields',
				file_code : targetFileCode
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText).data ;
				var elementtabRecord = me.getElementtabRecord() ;
				
				var targetFields = [] ;
				Ext.Array.each( ajaxData, function(v) {
					targetFields.push({
						fieldCode: v.entry_field_code,
						fieldLib: v.entry_field_code + ': ' + v.entry_field_lib
					});
				},me) ;
				selectFieldCodeCombo.setVisible( true );
				selectFieldCodeCombo.getStore().loadData( targetFields ) ;
				if( targetFileCode == elementtabRecord.get('join_target_file_code') ) {
					selectFieldCodeCombo.setValue( elementtabRecord.get('join_select_file_field_code') ) ;
				}
				
				
				var mapFields = [],
					mapRecord = null ;
				Ext.Array.each( ajaxData, function(v) {
					if( !v.entry_field_is_primarykey ) {
						return ;
					}
					mapRecord = {
						target_file_field_code: v.entry_field_code,
						target_field_type: v.entry_field_type,
						target_text: v.entry_field_lib
					} ;
					
					if( targetFileCode == elementtabRecord.get('join_target_file_code') ) {
						var defineJoinMap = elementtabRecord.get('join_map') ;
						for( var idx=0 ; idx<defineJoinMap.length ; idx++ ) {
							var defineJoinMapEntry = defineJoinMap[idx] ;
							if( defineJoinMapEntry.join_target_file_field_code == v.entry_field_code ) {
								var fieldNode = me.lookupTreeNode( defineJoinMapEntry.join_local_alt_file_code , defineJoinMapEntry.join_local_file_field_code ) ;
								Ext.apply( mapRecord , {
									local_alt_file_code: defineJoinMapEntry.join_local_alt_file_code,
									local_file_field_code: defineJoinMapEntry.join_local_file_field_code,
									local_text: ( fieldNode != null ? fieldNode.get('text') : '??' )
								}) ;
								break ;
							}
						}
					}
					
					mapFields.push(mapRecord) ;
				},me) ;
				mapGrid.getStore().loadData(mapFields) ;
				mapGrid.setVisible( true );
			},
			scope: me
		});
	},
	onMapAssign: function( targetFieldRecord, localFieldRecord ) {
		if( targetFieldRecord.get('target_field_type') == localFieldRecord.get('field_type') ) {
			targetFieldRecord.set('local_alt_file_code',localFieldRecord.get('alt_file_code'));
			targetFieldRecord.set('local_file_field_code',localFieldRecord.get('file_field_code'));
			targetFieldRecord.set('local_text',localFieldRecord.get('text'));
		} else {
			targetFieldRecord.set('local_alt_file_code',null);
			targetFieldRecord.set('local_file_field_code',null);
			targetFieldRecord.set('local_text',null);
		}
	},
	
	applyValues: function() {
		var me = this,
			targetForm = me.getComponent('targetPanel').child('form').getForm(),
			targetFileCodeCombo = targetForm.findField('target_file_code'),
			joinFileCode = me.getElementtabRecord().get('join_target_file_code') ;
		// Application de la valeur target_file_code
		// -> change event => onTargetFileSet => application des valeurs restantes 
			
		targetFileCodeCombo.setVisible( true ) ;
		if( joinFileCode && joinFileCode != '' ) {
			targetFileCodeCombo.setValue(joinFileCode) ;
		}
	},
	storeValues: function() {
		var me = this,
			elementtabRecord = me.getElementtabRecord(),
			targetForm = me.getComponent('targetPanel').child('form').getForm(),
			targetFileCodeCombo = targetForm.findField('target_file_code'),
			selectFieldCodeCombo = targetForm.findField('select_file_field_code'),
			mapGrid = me.getComponent('targetPanel').child('grid') ;
	
		if( targetFileCodeCombo.getValue() == null ) {
			elementtabRecord.set('join_target_file_code',null) ;
			elementtabRecord.set('join_select_file_field_code',null) ;
			elementtabRecord.set('join_map',[]) ;
			return true ;
		}
		
		var validationFailed = false ;
		if( selectFieldCodeCombo.getValue() == null ) {
			validationFailed = true ;
		}
		mapGrid.getStore().each(function(r){
			if( r.get('local_file_field_code') == null || r.get('local_file_field_code') == '' ) {
				validationFailed = true ;
			}
		},me) ;
		if( validationFailed ) {
			return false ;
		}
		
		var joinMap = [] ;
		mapGrid.getStore().each(function(r){
			joinMap.push({
				join_target_file_field_code: r.get('target_file_field_code'),
				join_local_alt_file_code: r.get('local_alt_file_code'),
				join_local_file_field_code: r.get('local_file_field_code')
			});
		},me) ;
		elementtabRecord.set('join_target_file_code',targetFileCodeCombo.getValue());
		elementtabRecord.set('join_select_file_field_code',selectFieldCodeCombo.getValue());
		elementtabRecord.set('join_map',joinMap);
		return true ;
	}
});