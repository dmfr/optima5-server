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

Ext.define('DbsLamProdComboboxModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'prod_soc', type:'string'},
		{name: 'prod_id', type:'string'},
		{name: 'prod_txt', type:'string'},
		{
			name: 'txt',
			type: 'string',
			convert: function(v, record) {
				return record.data.prod_id + ' / ' + record.data.prod_txt ;
			}
		}
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
				hidden: true, // TODO
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
				width: 110
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
				itemcontextmenu: this.onItemContextMenu,
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
		
	},
	onItemContextMenu: function(view, record, item, index, event) {
		var selRecords = view.getSelectionModel().getSelection();
		
		var gridContextMenuItems = new Array() ;
		if( selRecords.length != 1 ) {
			return ;
		} 
		var selRecord = selRecords[0] ;
		
		var logMenuItems = [],
			invProd = selRecord.get('id') ;
		if( !Ext.isEmpty(invProd) ) {
			logMenuItems.push({
				_log_filter_property: 'prod_id',
				_log_filter_value: invProd,
				text: 'P/N : <b>'+invProd+'</b>'
			}) ;
		}
		gridContextMenuItems.push({
			iconCls: 'op5-spec-dbslam-stock-logs',
			text: 'Movements log',
			menu: {
				defaults: {
					handler: function(menuitem) {
						this.optimaModule.postCrmEvent('openstocklog',{
							log_filter_property: menuitem._log_filter_property,
							log_filter_value: menuitem._log_filter_value
						}) ;
					},
					scope: this
				},
				items: logMenuItems
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
	
	
	
	
	doQuit: function() {
		this.destroy() ;
	}
});
