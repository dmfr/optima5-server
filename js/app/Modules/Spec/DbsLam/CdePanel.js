Ext.define('DbsInconsoCdeLigGridModel',{
	extend: 'Ext.data.Model',
	idParam: 'cdelig_filerecord_id',
	fields: [
		{name: 'cdelig_filerecord_id', type:'int'},
		{name: 'lig_id', type:'string'},
		{name: 'stk_prod', type:'string'},
		{name: 'stk_prod_txt', type:'string'},
		{name: 'qty_comm', type:'number'},
		{name: 'qty_cde', type:'number'}
	]
}) ;
Ext.define('DbsLamCdeGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'cde_filerecord_id',
	fields: [
		{name: 'cde_filerecord_id', type:'int'},
		{name: 'cde_nr', type:'string'},
		{name: 'cde_bl', type:'string'},
		{name: 'cde_ref', type:'string'},
		{name: 'status', type:'string'},
		{name: 'status_txt', type:'string'},
		{name: 'date_cde', type:'date', dateFormat:'Y-m-d'},
		{name: 'date_due', type:'date', dateFormat:'Y-m-d'},
		{name: 'date_closed', type:'date', dateFormat:'Y-m-d'},
		{name: 'vl_nbum', type:'int'},
		{name: 'vl_kg', type:'number'},
		{name: 'vl_m3', type:'number'},
		{name: 'adr_name', type:'string'},
		{name: 'adr_cp', type:'string'},
		{name: 'adr_country', type:'string'},
		
		{name: 'link_transfer_filerecord_id', type:'int'},
		{name: 'link_transfer_txt', type:'string'}
	]
});



Ext.define('Optima5.Modules.Spec.DbsLam.CdePanel',{
	extend:'Ext.panel.Panel',
	
	fileId: 'CDE',
	maxPerPage: 10000,
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamCdeGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		Ext.apply(this,{
			layout: 'border',
			tbar:[{
				hidden: this.noDestroy,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doRefresh() ;
				},
				scope: this
			},'->',{
				itemId: 'xlsExport',
				text: 'Export CSV',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function() {
					this.doDownload() ;
				},
				scope: this
			}],
			items: [{
				region: 'center',
				xtype: 'panel',
				layout: 'fit',
				border: false,
				itemId: 'pCenter'
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				width: 400,
				itemId:'pEast',
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
		}) ;
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
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
			this.doRefresh() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		var pushModelfields = [], atrCdeColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.CDE_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'CDE_'+attribute.mkey,
					width: 75,
					filter: {
						type: 'stringlist'
					}
				} ;
				atrCdeColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamCdeGridModel',
			fields: pushModelfields,
			hasMany: [{
				model: 'DbsLamCdeLigGridModel',
				name: 'ligs',
				associationKey: 'ligs'
			}]
		});
		
		
		var gridCfg = {
			xtype:'gridpanel',
			border: false,
			store: {
				model: this.tmpGridModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'cde_getGrid'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: Ext.emptyFn,
					load: Ext.emptyFn,
					scope: this
				}
			},
			bufferedRenderer: true,
			progressRenderer: (function () {
				return function(progress,text) {
				};
			})(),
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			columns: {
				defaults:{
					menuDisabled: false,
					draggable: false,
					sortable: true,
					hideable: false,
					resizable: true
				},
				items:[{
					width: 24,
					lockable: false,
					autoLock: true,
					sortable: false,
					resizable: false,
					draggable: false,
					hideable: false,
					menuDisabled: true,
					renderer: function(v,metaData,record) {
						if( record.get('cde_nr') ) {
							metaData.tdCls += ' op5-group-expand' ;
						}
					}
				},{
					text: 'Identification',
					columns: [{
						text: '<b>ID #</b>',
						dataIndex: 'cde_nr',
						width: 110,
						tdCls: 'op5-spec-dbsinconso-boldcolumn',
						filter: {
							type: 'string'
						},
						summaryType: 'count'
					},{
						text: 'BL #',
						dataIndex: 'cde_bl',
						width: 80,
						filter: {
							type: 'string'
						}
					},{
						text: 'Ref Cli',
						dataIndex: 'cde_ref',
						width: 100,
						filter: {
							type: 'string'
						}
					}]
				},{
					text: 'Attributes',
					columns: atrCdeColumns
				},{
					text: 'Status',
					columns: [{
						text: 'Current',
						isColumnStatus: true,
						width: 100,
						renderer: function(v,m,record) {
							var tmpProgress = record.get('status') / 100 ;
							var tmpText = record.get('status')+' : '+record.get('status_txt') ;
								var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
								if( record.get('status_color') ) {
									//b.setStyle(
								}
								b.updateProgress(tmpProgress,tmpText);
								v = Ext.DomHelper.markup(b.getRenderTree());
								b.destroy() ;
							return v;
						},
						menuDisabled:false,
						dataIndex: 'status',
						filter: {
							type: 'op5crmbasebible',
							optimaModule: this.optimaModule,
							bibleId: 'STATUS_CDE'
						},
						groupable: true,
						_groupBy: 'status'
					},{
						text: 'Transfer',
						dataIndex: 'link_transfer_txt',
						filter: {
							type: 'stringlist'
						}
					}]
				},{
					text: 'Dates / Time',
					columns: [{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: 'Cde reçue',
						dataIndex: 'date_cde',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						groupable: true,
						_groupBy: 'date_cde'
					},{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: '<b>Attendu</b>',
						dataIndex: 'date_due',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						tdCls: 'op5-spec-dbsinconso-boldcolumn',
						groupable: true,
						_groupBy: 'date_due'
					},{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: 'Fin/Closed',
						dataIndex: 'date_closed',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						groupable: true,
						_groupBy: 'date_closed'
					}]
				},{
					text: 'Variantes logistiques',
					columns: [{
						xtype: 'numbercolumn',
						align: 'right',
						format: '0',
						text: 'Nb UM',
						dataIndex: 'vl_nbum',
						width: 60,
						filter: {
							type: 'number'
						},
						summaryType: 'sum',
						summaryRenderer: Ext.util.Format.numberRenderer( '0' )
					},{
						xtype: 'numbercolumn',
						align: 'right',
						format: '0,000',
						text: 'Pds (kg)',
						dataIndex: 'vl_kg',
						width: 70,
						filter: {
							type: 'number'
						},
						summaryType: 'sum',
						summaryRenderer: Ext.util.Format.numberRenderer( '0,000' )
					},{
						xtype: 'numbercolumn',
						align: 'right',
						format: '0,000.00',
						text: 'Vol (m3)',
						dataIndex: 'vl_m3',
						width: 70,
						filter: {
							type: 'number'
						},
						summaryType: 'sum',
						summaryRenderer: Ext.util.Format.numberRenderer( '0,000.00' )
					}]
				},{
					text: 'Livraison',
					columns: [{
						text: 'Pays',
						dataIndex: 'adr_country',
						width: 50,
						filter: {
							type: 'stringlist'
						}
					},{
						text: 'CP',
						dataIndex: 'adr_cp',
						width: 65,
						filter: {
							type: 'string'
						}
					},{
						text: 'Dest',
						dataIndex: 'adr_name',
						width: 100,
						filter: {
							type: 'stringlist'
						}
					}]
				}]
			},
			listeners: {
				afterlayout: function( gridpanel ) {
					gridpanel.headerCt.on('menucreate',this.onColumnsMenuCreate,this) ;
				},
				itemclick: this.onItemClick,
				scope: this
			},
			features: [{
				ftype: 'groupingsummary',
				hideGroupedHeader: false,
				enableGroupingMenu: false,
				enableNoGroups: false
			}],
			viewConfig: {
				enableTextSelection: true
			}
		} ;
		if( this._enableDD ) {
			Ext.apply(gridCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
			Ext.apply(gridCfg.viewConfig,{
				plugins: {
					ddGroup : 'DbsLamCdesDD',
					ptype: 'gridviewdragdrop',
					enableDrag: true,
					enableDrop: false
				}
			});
		}
		
		
		pCenter.removeAll() ;
		pCenter.add( gridCfg ) ;
		
		this.hideLoadmask() ;
	},
	
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		
		menu.add({
			itemId: 'grid-groupby',
			icon: 'images/op5img/ico_groupby_16.png',
			text: 'Group By',
			handler: function(menuitem) {
				this.onColumnGroupBy( menuitem.up('menu').activeHeader._groupBy ) ;
			},
			scope: this
		},{
			itemId: 'grid-cleargroups',
			icon: 'images/op5img/ico_groupclear_16.png',
			text: 'Clear Groups',
			handler: function(menuitem) {
				this.onColumnGroupBy( null ) ;
			},
			scope: this
		});
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			HelperCache = Optima5.Modules.Spec.DbsPeople.HelperCache,
			colCfg = menu.activeHeader.colCfg;
		menu.down('#grid-groupby').setVisible( !Ext.isEmpty(menu.activeHeader._groupBy) ) ;
	},
	onColumnGroupBy: function( groupField ) {
		var grid = this.down('#pCenter').down('grid'),
			store = grid.getStore(),
			model = store.model,
			fieldDesc = model.getField(groupField) ;
		
		if( groupField == null ) {
			store.clearGrouping() ;
		} else {
			var groupFn ;
			switch( fieldDesc.type ) {
				case 'date' :
					groupFn = function (record) {
						return Ext.Date.format(record.get(groupField), 'Y-m-d');
					} ;
					break ;
					
				default :
					groupFn = null ;
					break ;
			}
			
			store.group({
				property: groupField,
				groupFn: groupFn
			}) ;
		}
	},
	onGridGroupChange: function( gridStore, grouper ) {
		var grid = this.down('#pCenter').down('grid'),
			 groupFields = [] ;
		
		if( grouper ) {
			groupFields.push( grouper.getProperty() ) ;
		}
		Ext.Array.each( grid.headerCt.query('[_groupBy]'), function(col) {
			if( col.hideable ) {
				return ;
			}
			if( col._alwaysHidden ) {
				col.hide() ;
			} else if( Ext.Array.contains(groupFields , col._groupBy) ) {
				col.hide() ;
			} else {
				col.show() ;
			}
		}) ;
	},
	
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		if( Ext.isEmpty(cellColumn.dataIndex) ) {
			this.setFormRecord(record) ;
		}
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
	},
	
	onBeforeLoad: function(store, operation) {
		operation.setLimit(this.maxPerPage) ;
	},
	
	
	
	setFormRecord: function(cdeRecord) {
		var me = this,
			eastpanel = me.getComponent('pEast') ;
		if( cdeRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		
		var title = cdeRecord.get('cde_nr') ;
		
		var eastPanelCfg = {
			xtype: 'panel',
			layout: {
				type: 'border',
				align: 'stretch'
			},
			items:[{
				flex: 1,
				region: 'center',
				height: 150,
				xtype: 'form',
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 70,
					anchor: '100%'
				},
				frame:false,
				border: false,
				autoScroll: true,
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				items: [{
					xtype:'fieldset',
					title: 'Identification',
					defaults: {
						margin: 2,
						fieldBodyCls: '' // Otherwise height would be set at 22px
					},
					items:[{
						xtype: 'displayfield',
						fieldLabel: 'ID #',
						name: 'cde_nr'
					},{
						xtype: 'displayfield',
						fieldLabel: 'BL #',
						name: 'cde_bl'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Ref Cli',
						name: 'cde_ref'
					}]
				}]
			},{
				flex: 3,
				region: 'south',
				xtype: 'grid',
				store: {
					model: 'DbsInconsoCdeLigGridModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					sorters:[{
						property : 'cdelig_id',
						direction: 'ASC'
					}]
				},
				columns: [{
					dataIndex: 'lig_id',
					text: 'Lig.ID',
					width: 40
				},{
					dataIndex: 'stk_prod',
					text: 'Article',
					width: 120
				},{
					dataIndex: 'stk_prod_txt',
					text: 'Desc',
					width: 150
				},{
					hidden: true,
					dataIndex: 'qty_comm',
					text: 'Qty.Orig',
					align: 'right',
					width: 75
				},{
					dataIndex: 'qty_cde',
					text: 'Qty.Order',
					align: 'right',
					width: 75
				}]
			}]
		};
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			cdeForm = eastInnerPanel.child('form'),
			cdeLigs = eastInnerPanel.child('grid') ;
		cdeForm.loadRecord(cdeRecord) ;
		cdeLigs.getStore().loadData( cdeRecord.getData(true)['ligs'] ) ;
	},
	
	
	
	doQuit: function() {
		if( !this.noDestroy ) {
			this.destroy() ;
		} else {
			this.fireEvent('candestroy',this) ;
		}
	},
	doRefresh: function() {
		this.down('#pCenter').down('grid').getStore().load() ;
	},	
	doDownload: function() {
		var me = this,
			grid = this.down('#pCenter').down('grid') ;
		if( !grid ) {
			return ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_action: 'data_getFileGrid_exportCSV' ,
			file_code: this.fileId
		}) ;
		
		if( grid.filters && grid.filters.getFilterData().length > 0 ) {
			Ext.apply( exportParams, {
				filter: Ext.JSON.encode(grid.filters.getFilterData())
			}) ;
		}
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
}) ;
