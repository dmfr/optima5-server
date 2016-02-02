Ext.define('DbsLamProdGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'prod_id', type:'string'},
		{name: 'prod_txt', type:'string'},
		{name: 'spec_is_batch', type:'boolean'},
		{name: 'spec_is_dlc', type:'boolean'},
		{name: 'spec_is_sn', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.ProductsPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamButton'],
	
	initComponent: function() {
		this.tmpModelName = 'DbsLamProdGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.tmpGridTreeModelName = 'DbsLamProdGridTreeModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridTreeModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 1,
				region: 'center',
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				tbar:[{
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'SOC',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Companies / Customers',
					itemId: 'btnSoc',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onSocSet() ;
							},
							scope: this
						},
						ready: {
							fn: function() {
								
							},
							scope: this
						}
					}
				}),'-',{
					icon: 'images/op5img/ico_search_16.gif',
					handler: function(btn) {
						btn.up().down('#txtSearch').reset() ;
					}
				},{
					xtype: 'textfield',
					itemId: 'txtSearch',
					width: 100,
					listeners: {
						change: function(field) {
							var value = field.getValue(),
								store = this.down('grid').getStore() ;
							if( Ext.isEmpty(value) ) {
								store.clearFilter() ;
								return ;
							}
							store.filter('prod_id',value) ;
						},
						scope: this
					}
				},'->',{
					icon:'images/op5img/ico_new_16.gif',
					text:'Création Article',
					handler: function() {},
					scope: this
				}],
				items: []
			},{
				region: 'east',
				flex: 3,
				xtype: 'panel',
				layout: 'fit',
				itemId:'mProdsFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:this
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.doConfigure() ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		if( this.isVisible() ) {
			this.setViewRecord(null);
			this.down('gridpanel').getStore().load() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	
	
	
	onSocSet: function() {
		var filterSiteBtn = this.down('#btnSoc') ;
		if( !Ext.isEmpty(filterSiteBtn.getValue()) ) {
			this.socCode = filterSiteBtn.getValue() ;
		} else {
			this.socCode = null ;
		}
		
		this.doConfigure() ;
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		if( !this.socCode ) {
			pCenter.removeAll() ;
			pCenter.add({xtype:'component',cls: 'ux-noframe-bg', flex:1}) ;
			return ;
		}
		
		var pushModelfields = [], atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.PROD_fieldcode ) {
				atrColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		var boolRenderer = function(value) {
			if( value==1 ) {
				return '<b>X</b>' ;
			}
			else {
				return '' ;
			}
		}
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsLamProdGridModel',
			fields: pushModelfields
		});
		
		pCenter.removeAll() ;
		pCenter.add({
			border: false,
			flex:1,
			xtype:'gridpanel',
			store: {
				model: this.tmpModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'prods_getGrid'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onGridBeforeLoad,
					load: Ext.emptyFn,
					scope: this
				}
			},
			columns: {
				defaults: {
					menuDisabled: false,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: true,
					groupable: false,
					lockable: false
				},
				items: [{
					text: '',
					width: 24,
					renderer: function(v,metadata,record) {
						if( Ext.isEmpty(record.get('inv_prod')) ) {
							metadata.tdCls = 'op5-spec-dbslam-stock-avail'
						} else {
							metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
						}
					}
				},{
					dataIndex: 'prod_id',
					text: 'Code',
					width: 120,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					dataIndex: 'prod_txt',
					text: 'Description',
					width: 190
				},{
					text: 'Flags',
					columns: [{
						dataIndex: 'spec_is_batch',
						text: 'Batch',
						renderer: boolRenderer,
						width: 70
					},{
						dataIndex: 'spec_is_dlc',
						text: 'DLC',
						renderer: boolRenderer,
						width: 70
					},{
						dataIndex: 'spec_is_sn',
						text: 'Serial',
						renderer: boolRenderer,
						width: 70
					}]
				},{
					text: 'Attributs',
					columns: atrColumns
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			}],
			viewConfig: {
				preserveScrollOnRefresh: true,
				listeners: {
					beforerefresh: function(view) {
						view.isRefreshing = true ;
					},
					refresh: function(view) {
						view.isRefreshing = false ;
					}
				}
			},
			listeners: {
				itemclick: this.onItemClick,
				scope: this
			}
		});
	},
	
	
	
	
	onGridBeforeLoad: function(store,options) {
		var params = {} ;
		
		Ext.apply(params,{
			soc_code: this.socCode
		}) ;
		
		options.setParams(params) ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		this.setViewRecord(record) ;
	},
	
	
	
	setViewRecord: function(record) {
		var me = this,
			eastpanel = me.getComponent('mProdsFormContainer') ;
		if( record == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.ADR_fieldcode ) {
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		pushModelfields.push({
			name: 'stk_filerecord_id',
			type: 'int'
		});
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridTreeModelName ) ;
		Ext.define(this.tmpGridTreeModelName, {
			extend: 'DbsLamTransferGridModel',
			fields: pushModelfields,
			idProperty: 'id'
		});
		
		var gridTreeColumns = {
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
				xtype: 'treecolumn',
				text: '<b>Location</b>',
				dataIndex: 'tree_adr',
				width: 200,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: '<b>Status</b>',
				dataIndex: 'step_code',
				width: 65,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'stk_prod',
					text: 'Article',
					width: 100
				},{
					dataIndex: 'stk_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75
				},{
					dataIndex: 'stk_sn',
					text: 'Serial',
					width: 100
				}]
			}]
		};
		
		eastpanel.removeAll() ;
		eastpanel.add({
			title: 'Tree/Location',
			xtype: 'treepanel',
			itemId: 'pGridTree',
			store: {
				model: this.tmpGridTreeModelName,
				root:{},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			collapsible: false,
			useArrows: false,
			rootVisible: false,
			multiSelect: false,
			singleExpand: false,
			columns: gridTreeColumns,
			listeners: {
				itemcontextmenu: this.onTreeContextMenu,
				scope: this
			}
		}) ;
		var title = 'Article <b>'+record.get('prod_id')+'</b>' ;
		
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		this.doTreeLoad( record.getId() ) ;
	},
	doTreeLoad: function( prodId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'prods_getStockGrid',
				filter_id: prodId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var store = Ext.create('Ext.data.Store',{
					model: this.tmpGridTreeModelName,
					data: ajaxResponse.data,
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				}) ;
				this.onTreeLoad(store) ;
			},
			scope: this
		}) ;
	},
	onTreeLoad: function(store) {
		// buildTree
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleTreeOne',
				bible_code: 'ADR'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				var dataRoot = ajaxResponse.dataRoot ;
				this.onTreeLoadBuildTree(dataRoot,store) ;
			},
			scope: this
		}) ;
	},
	onTreeLoadBuildTree: function(dataRoot,gridStore) {
		var treeStore = Ext.create('Ext.data.TreeStore',{
			model: 'DbsLamLiveTreeModel',
			data: dataRoot,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		//qualify records
		var map_treeAdr_childrenAdr = {} ;
		var map_treeAdr_gridRows = {} ;
		gridStore.each( function(gridRecord) {
			var gridRow = Ext.clone(gridRecord.getData()),
				treeAdr ;
				
			if( !gridRecord.get('current_adr_tmp') ) {
				if( !map_treeAdr_childrenAdr.hasOwnProperty(gridRecord.get('current_adr_treenodeKey')) ) {
					map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')] = [] ;
				}
				if( !Ext.Array.contains(map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')], gridRecord.get('current_adr_entryKey')) ) {
					map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')].push(gridRecord.get('current_adr_entryKey')) ;
				}
				treeAdr = gridRecord.get('current_adr_entryKey') ;
			} else {
				treeAdr = gridRecord.get('current_adr_treenodeKey') ;
			}
			
			if( !map_treeAdr_gridRows.hasOwnProperty(treeAdr) ) {
				map_treeAdr_gridRows[treeAdr] = [] ;
			}
			
			gridRow.stk_filerecord_id = gridRecord.get('stk_filerecord_id') ;
			
			gridRow.leaf = true ;
			
			if( gridRecord.get('status_is_reject') ) {
				gridRow.icon = 'images/op5img/ico_cancel_small.gif' ;
			} else if( gridRecord.get('step_code') != '' ) {
				gridRow.icon = 'images/op5img/ico_wait_small.gif' ;
			}
			
			map_treeAdr_gridRows[treeAdr].push(gridRow) ;
		}) ;
		
		var cascadeRoot = function(node) {
			node['tree_adr'] = node.nodeKey ;
			delete node.checked ;
			node['icon'] = '' ;
			if( Ext.isEmpty(node.children) ) {
				node['leaf'] = false ;
				node['expanded'] = true ;
				node.children = [] ;
			}
			if( map_treeAdr_childrenAdr[node.tree_adr] ) {
				Ext.Array.each(map_treeAdr_childrenAdr[node.tree_adr], function(newAdr) {
					node.children.push({
						expanded: true,
						leaf: false,
						tree_adr: newAdr,
						nodeKey: newAdr,
						children: []
					});
				}) ;
			}
			if( map_treeAdr_gridRows[node.tree_adr] ) {
				Ext.Array.each(map_treeAdr_gridRows[node.tree_adr], function(gridRow) {
					node.children.push(gridRow);
				}) ;
				return ;
			}
			Ext.Array.each( node.children, function(childNode) {
				cascadeRoot(childNode) ;
			});
		} ;
		cascadeRoot(dataRoot) ;
		
		var treeStore = Ext.create('Ext.data.TreeStore',{
			model: this.tmpGridTreeModelName,
			data: dataRoot,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		while(true) {
			var nodesToRemove = [] ;
			treeStore.getRoot().cascadeBy(function(node) {
				if( !node.isRoot() && !node.isLeaf() && !node.hasChildNodes() ) {
					nodesToRemove.push(node) ;
					return false ;
				}
			}) ;
			if( nodesToRemove.length == 0 ) {
				break ;
			}
			Ext.Array.each(nodesToRemove, function(node) {
				node.remove();
			});
		}
		
		this.getComponent('mProdsFormContainer').down('treepanel').setRootNode(treeStore.getRootNode()) ;
	},
	onTreeContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecord = record;
		
		var lib, arrFilerecordIds=[] ;
		if( !Ext.isEmpty(selRecord.get('tree_adr')) ) {
			// test
			var testFail = false ;
			record.cascadeBy(function(s) {
				if( s==record ){
					return ;
				}
				if( !s.isLeaf() ) {
					testFail = true ; 
				}
			}) ;
			if( testFail ) {
				return ;
			}
			
			lib = '<b>'+selRecord.get('tree_adr')+'</b>' ;
			record.cascadeBy(function(s) {
				if( s.isLeaf() && s.get('stk_filerecord_id') ) {
					arrFilerecordIds.push(s.get('stk_filerecord_id')); 
				}
			}) ;
		} else {
			lib = '<b>id:</b>'+record.get('stk_filerecord_id') ;
			arrFilerecordIds.push(record.get('stk_filerecord_id')) ;
		}
		
		gridContextMenuItems.push({
			iconCls: 'icon-bible-new',
			text: 'Relocate <b>'+lib+'</b>',
			handler : function() {
				this.openRelocatePopup(arrFilerecordIds,lib) ;
			},
			scope : this
		});
		
		var gridContextMenu = Ext.create('Ext.menu.Menu',{
			items : gridContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		gridContextMenu.showAt(event.getXY());
	},
	
	
	
	
	
	
	
	
	
	openRelocatePopup: function(arrFilerecordIds,lib) {
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			width:400,
			height:250,
			
			cls: 'ux-noframe-bg',
			
			arrFilerecordIds: arrFilerecordIds,
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			xtype: 'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 100
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Déplacement d\'une adresse existante</b><br>Pour valider, veuillez saisir l\'adresse <u>destination</u>'}
			},{
				xtype: 'displayfield',
				anchor: '',
				width: 180,
				fieldLabel: 'Item(s)',
				value: lib
			},{
				xtype: 'displayfield',
				anchor: '',
				width: 180,
				fieldLabel: 'Stock lines count',
				value: '<b>'+arrFilerecordIds.length+'</b>'
			},{
				xtype: 'textfield',
				name: 'dest_adr_id',
				anchor: '',
				width: 180,
				fieldLabel: 'Adresse'
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitRelocate() ;
				},
				scope: this
			}],
			doSubmitRelocate: function() {
				var formPanel = this,
					form = formPanel.getForm(),
					formValues = form.getValues() ;
					
				var relocateObj = {
					arrFilerecordIds: this.arrFilerecordIds,
					dest_adr_id: formValues.dest_adr_id
				} ;
				
				this.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_dbs_lam',
						_action: 'prods_doRelocate',
						data: Ext.JSON.encode(relocateObj)
					},
					success: function(response) {
						var jsonResponse = Ext.JSON.decode(response.responseText) ;
						this.onSubmitRelocate(jsonResponse) ;
					},
					callback: function() {
						//this.hideLoadmask() ;
					},
					scope: this
				});
			},
			onSubmitRelocate: function(ajaxResponse) {
				var formPanel = this,
					form = formPanel.getForm(),
					formValues = form.getValues() ;
											 
				if( ajaxResponse.success ) {
					this.optimaModule.postCrmEvent('datachange') ;
					this.destroy() ;
				} else {
					form.findField('dest_adr_id').markInvalid('Error') ;
				}
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	
	
	doQuit: function() {
		this.destroy() ;
	}
});