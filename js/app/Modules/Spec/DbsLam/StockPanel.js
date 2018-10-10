Ext.define('DbsLamStockTreeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'treenode_key',
	fields: [
		{name: 'treenode_key', type:'string'},
		{name: 'field_ROW_ID', type:'string'},
		{name: 'field_POS_ZONE', type:'string'},
		{name: 'field_POS_ROW', type:'string'}
	]
});

Ext.define('DbsLamStockGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'stk_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'pos_zone', type:'string'},
		{name: 'pos_row', type:'string'},
		{name: 'pos_bay', type:'string'},
		{name: 'pos_level', type:'string'},
		{name: 'pos_bin', type:'string'},
		{name: 'inv_id', type:'int', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true},
		{name: 'inv_qty_out', type:'number', useNull:true},
		{name: 'inv_sn', type:'string'},
		{name: 'inv_container', type:'string'},
		{name: 'prealloc', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.StockPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamButton'],
	
	_popupMode: false,
	_enableDD: false,
	whseCode: null,
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamStockGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 3,
				region: 'center',
				itemId: 'pCenter',
				border: false,
				xtype: 'panel',
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
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Sites / Warehouses',
					itemId: 'btnWhse',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onWhseSet() ;
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
					icon:'images/op5img/ico_new_16.gif',
					text:'Création adresse(s)',
					handler: function() { this.handleNew() },
					scope: this
				},{
					icon:'images/op5img/ico_print_16.png',
					text:'Impression Inventaires'
				}],
				items: []
			},{
				region: 'east',
				flex: 2,
				xtype: 'panel',
				layout: 'fit',
				itemId:'mStockFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					/*
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					*/
					beforeexpand: this.onBeforeExpandEast,
					scope:this
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( !this.down('#pGrid') ) {
				return ;
			}
			if( this.down('#pGrid').getStore().loading || this.down('#pGrid').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		if( this._popupMode ) {
			this.down('toolbar').setVisible(false) ;
			this.down('#mStockFormContainer').setVisible(false) ;
		}
		
		this.doConfigure() ;
	},
	
	
	onWhseSet: function() {
		var filterSiteBtn = this.down('#btnWhse') ;
		if( !Ext.isEmpty(filterSiteBtn.getValue()) ) {
			this.whseCode = filterSiteBtn.getValue() ;
		} else {
			this.whseCode = null ;
		}
		
		this.doConfigure() ;
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		if( !this.whseCode ) {
			pCenter.removeAll() ;
			pCenter.add({xtype:'component',cls: 'ux-noframe-bg', flex:1}) ;
			return ;
		}
		
		
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.ADR_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'ADR_'+attribute.mkey,
					width: 75
				} ;
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'STOCK_'+attribute.mkey,
					width: 75
				} ;
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamStockGridModel',
			fields: pushModelfields
		});
		
		var treepanelCfg = {
			border: 1,
			width: 240,
			xtype: 'treepanel',
			itemId: 'pTree',
			store: {
				model: 'DbsLamStockTreeModel',
				root:{
					iconCls:'task-folder',
					expanded:true,
					treenode_key:'&',
					field_ROW_ID: 'Warehouse zones'
				},
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'data_getBibleTree',
						bible_code: 'ADR'
					}
				}),
				listeners: {
					load: function(store) {
						if( store.getNodeById(this.whseCode) ) {
							store.setRootNode( store.getNodeById(this.whseCode).copy(undefined,true) ) ;
						}
					},
					scope: this
				}
			},
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			columns: {
				defaults: {
					menuDisabled: false,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					xtype:'treecolumn',
					dataIndex: 'field_ROW_ID',
					text: 'ID',
					width: 200,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					dataIndex: 'field_POS_ZONE',
					text: 'Zone',
					width: 50
				},{
					dataIndex: 'field_POS_ROW',
					text: 'Allée',
					width: 50
				}]
			},
			listeners: {
				selectionchange: function() {
					this.doGridReload();
				},
				scope: this
			}
		};
		
		var gridpanelCfg = {
			border: false,
			flex:1,
			xtype:'gridpanel',
			itemId: 'pGrid',
			store: {
				model: this.tmpGridModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'stock_getGrid'
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
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					text: '',
					width: 24,
					renderer: function(v,metadata,record) {
						if( Ext.isEmpty(record.get('inv_prod')) && !record.get('prealloc') ) {
							metadata.tdCls = 'op5-spec-dbslam-stock-avail'
						} else {
							if( !Ext.isEmpty(record.get('inv_prod')) ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
							}
							if( record.get('prealloc') ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-prealloc'
							}
						}
					}
				},{
					dataIndex: 'adr_id',
					text: 'ID',
					width: 90,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					text: 'Position',
					columns: [{
						dataIndex: 'pos_bay',
						text: 'Pos.',
						width: 50
					},{
						dataIndex: 'pos_level',
						text: 'Niv.',
						width: 50
					},{
						dataIndex: 'pos_bin',
						text: 'Case',
						width: 50
					}]
				},{
					text: 'Location Attributes',
					columns: atrAdrColumns
				},{
					text: 'Stock Attributes',
					columns: atrStockColumns
				},{
					text: 'Attributs',
					columns: [{
						dataIndex: 'inv_container',
						text: 'Container',
						width: 100
					},{
						dataIndex: 'inv_prod',
						text: 'P/N',
						width: 100,
						filter: {
							type: 'string'
						}
					},{
						dataIndex: 'inv_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'inv_qty',
						text: 'Qty disp',
						align: 'right',
						width: 75
					},{
						hidden: !(this._enableDD && this._enablePartialTake),
						itemId: 'takecolumn',
						xtype: 'actioncolumn',
						align: 'center',
						width: 36,
						items: [{
							icon: 'images/op5img/ico_dataadd_16.gif',  // Use a URL in the icon config
							tooltip: 'Take',
							isDisabled: function(view,rowIndex,colIndex,item,record ) {
								if( Ext.isEmpty(record.get('inv_qty')) || record.get('inv_qty') <= 0 ) {
									return true ;
								}
								return false
							},
							handler: function(grid, rowIndex, colIndex) {
								var record = grid.getStore().getAt(rowIndex);
								if( Ext.isEmpty(record.get('inv_qty')) || record.get('inv_qty') <= 0 ) {
									return ;
								}
								this.handlePartialTake( record ) ;
							},
							scope: this
						}]
					},{
						dataIndex: 'inv_qty_out',
						text: 'Qty out',
						align: 'right',
						width: 75,
						renderer: function(v) {
							if( v<=0 ) {
								return '&#160;' ;
							}
							return v ;
						}
					},{
						dataIndex: 'inv_sn',
						text: 'Serial',
						width: 100
					}]
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			},{
				ptype: 'uxgridfilters'
			}],
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('inv_qty_out') > 0 && record.get('inv_qty') == 0 ) {
						return 'op5-spec-dbslam-stock-out' ;
					}
					if( !record.get('status') ) {
						return 'op5-spec-dbslam-stock-disabled' ;
					}
				},
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
		};
		if( this._enableDD ) {
			Ext.apply(gridpanelCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
			Ext.apply(gridpanelCfg.viewConfig,{
				plugins: {
					ddGroup : (Ext.isString(this._enableDD) ? this._enableDD : 'DbsLamStockDD'),
					ptype: 'gridviewdragdrop'
				}
			});
		}
		if( true ) {
			Ext.apply(gridpanelCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
		}
		
		pCenter.removeAll() ;
		pCenter.add(treepanelCfg,gridpanelCfg) ;
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
			this.setFormRecord(null) ;
			this.doGridReload() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	doGridReload: function() {
		var gridpanel = this.down('#pCenter').down('#pGrid') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('#pCenter').down('#pTree') ;
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		var params = {} ;
		
		Ext.apply(params,{
			whse_code: this.whseCode
		}) ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			Ext.apply(params,{
				filter_treenodeKey: selectedNodes[0].getId()
			}) ;
		}
		
		options.setParams(params) ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		
		var eastpanel = this.getComponent('mStockFormContainer') ;
		if( eastpanel.isVisible() ) {
			this.setFormRecord(null) ;
		}
	},
	
	setFormRecord: function(record) {
		var me = this,
			eastpanel = me.getComponent('mStockFormContainer') ;
		if( record == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
	},
	
	
	handlePartialTake: function( gridRecord ) {
		
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			width:400,
			height:300,
			
			cls: 'ux-noframe-bg',
			
			stockFilerecordId: gridRecord.get('stk_filerecord_id'),
			
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
				labelWidth: 125,
				anchor: '100%'
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Partial allocation</b><br><br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: 'Address',
				value: gridRecord.get('adr_id')
			},{
				xtype: 'displayfield',
				fieldLabel: 'P/N',
				value: gridRecord.get('inv_prod')
			},{
				xtype: 'displayfield',
				fieldLabel: 'Qty avail',
				value: gridRecord.get('inv_qty')
			},{
				xtype: 'numberfield',
				name: 'mvt_qty',
				fieldLabel: '<b>'+'Alloc. qty'+'</b>',
				maxValue: gridRecord.get('inv_qty'),
				minValue: 1,
				allowBlank: false,
				anchor: '',
				width: 200
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitTake() ;
				},
				scope: this
			}],
			doSubmitTake: function() {
				this.fireEvent('stkalloc',this,{stk_filerecord_id:this.stockFilerecordId, mvt_qty: this.getForm().findField('mvt_qty').getValue()})
				this.destroy();
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.on('stkalloc',function(form,obj) {
			console.dir(obj) ;
			this.fireEvent('stkalloc',this,obj) ;
		},me) ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	
	
	onBeforeExpandEast: function( eastpanel ) {
		eastpanel.removeAll() ;
		eastpanel.add({
			xtype: 'form',
			cls: 'ux-noframe-bg',
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			items: [{
				xtype: 'fieldset',
				title: 'Document selection',
				items: [{
					xtype: 'textfield',
					fieldLabel: 'Adjust qty.'
				}]
			},{
				xtype: 'fieldset',
				title: 'Document selection',
				items: [{
					xtype: 'textfield',
					fieldLabel: 'Adjust qty.'
				}]
			}]

		}) ;
	},
	
	
	doQuit: function() {
		this.destroy() ;
	}
});
