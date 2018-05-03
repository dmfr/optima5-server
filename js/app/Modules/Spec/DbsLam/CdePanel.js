Ext.define('Optima5.Modules.Spec.DbsLam.CdePanel',{
	extend:'Ext.panel.Panel',
	
	fileId: 'CDE',
	maxPerPage: 10000,
	
	initComponent: function() {
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
		
		this.doConfigure() ;
	},
	
	doConfigure: function() {
		this.autoRefreshTask = new Ext.util.DelayedTask( function(){
			if( this.isDestroyed ) { // private check
				return ;
			}
			this.doLoad(false) ;
		},this);
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getFileGrid_config',
				file_code: this.fileId
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onConfigure( jsonResponse ) ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onConfigure: function( jsonResponse ) {
		var pCenter = this.down('#pCenter') ;
		
		var pushModelfields = [], atrCdeColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.CDE_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'CDE_'+attribute.mkey,
					width: 75
				} ;
				atrCdeColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		
		
		var gridCfg = {
			xtype:'gridpanel',
			border: false,
			store: this.onConfigureBuildStore(jsonResponse.data) ,
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
						if( record.get('SDG_field_CDE_NR') ) {
							metaData.tdCls += ' op5-group-expand' ;
						}
					}
				},{
					text: 'Identification',
					columns: [{
						text: '<b>ID #</b>',
						dataIndex: 'SDG_field_CDE_NR',
						width: 80,
						tdCls: 'op5-spec-dbsinconso-boldcolumn',
						filter: {
							type: 'string'
						},
						summaryType: 'count'
					},{
						text: 'BL #',
						dataIndex: 'SDG_field_CDE_BL',
						width: 80,
						filter: {
							type: 'string'
						}
					},{
						text: 'Ref Cli',
						dataIndex: 'SDG_field_CDE_REF',
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
					isColumnStatus: true,
					width: 100,
					renderer: function(v,m,record) {
						var tmpProgress = record.get('SDG_field_STATUS_entry_STATUS') / 100 ;
						var tmpText = record.get('SDG_field_STATUS_entry_STATUS')+' : '+record.get('SDG_field_STATUS_entry_STATUS_TXT') ;
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
					dataIndex: 'SDG_field_STATUS',
					filter: {
						type: 'op5crmbasebible',
						optimaModule: this.optimaModule,
						bibleId: 'STATUS_CDE'
					},
					groupable: true,
					_groupBy: 'SDG_field_STATUS'
				},{
					text: 'Dates / Time',
					columns: [{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: 'Cde reçue',
						dataIndex: 'SDG_field_DATE_CDE',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						groupable: true,
						_groupBy: 'SDG_field_DATE_CDE'
					},{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: '<b>Attendu</b>',
						dataIndex: 'SDG_field_DATE_DUE',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						tdCls: 'op5-spec-dbsinconso-boldcolumn',
						groupable: true,
						_groupBy: 'SDG_field_DATE_DUE'
					},{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						text: 'Fin/Closed',
						dataIndex: 'SDG_field_DATE_CLOSED',
						width: 80,
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						},
						groupable: true,
						_groupBy: 'SDG_field_DATE_CLOSED'
					}]
				},{
					text: 'Variantes logistiques',
					columns: [{
						xtype: 'numbercolumn',
						align: 'right',
						format: '0',
						text: 'Nb UM',
						dataIndex: 'SDG_field_VL_NBUM',
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
						dataIndex: 'SDG_field_VL_KG',
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
						dataIndex: 'SDG_field_VL_M3',
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
						dataIndex: 'SDG_field_ADR_COUNTRY',
						width: 50,
						filter: {
							type: 'stringlist'
						}
					},{
						text: 'CP',
						dataIndex: 'SDG_field_ADR_CP',
						width: 65,
						filter: {
							type: 'string'
						}
					},{
						text: 'Dest',
						dataIndex: 'SDG_field_ADR_NAME',
						width: 100,
						filter: {
							type: 'stringlist'
						}
					},{
						text: 'Trspt',
						dataIndex: 'SDG_field_TRSPT_NAME',
						width: 75,
						filter: {
							type: 'stringlist'
						},
						groupable: true,
						_groupBy: 'SDG_field_TRSPT_NAME'
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
			}]
		} ;
		
		
		pCenter.removeAll() ;
		pCenter.add( gridCfg ) ;
		
		this.hideLoadmask() ;
	},
	onConfigureBuildStore: function( ajaxData ) {
		var gridModelName = 'FileGrid'+'-'+this.getId() ;
		
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		var noNew = false ;
		if( ajaxData.define_file.file_parent_code != '' ) {
			noNew = true ;
		}
		Ext.Object.each( ajaxData.grid_fields , function(k,v) {
			// console.dir(v) ;
			/*
			if( !(v.entry_field_is_highlight) && false )
				return ;
			*/
			if( v.is_key == true )
				keyfield = v.field ;
			
			switch( v.type )
			{
				case 'number' :
				case 'date' :
					var fieldType = v.type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.field,
				type: fieldType
			}) ;
			if( v.type == 'date' ) {
				Ext.apply(fieldObject,{
					dateFormat: 'Y-m-d H:i:s'
				}) ;
			}
			modelFields.push( fieldObject ) ;
		},this) ;
		
		if( this.gridModelName ) {
			Ext.ux.dams.ModelManager.unregister( this.gridModelName ) ;
		}
		Ext.define(gridModelName, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		this.gridModelName = gridModelName ;
		
		var gridstore = Ext.create('Ext.data.Store', {
			model: gridModelName,
			remoteSort: false,
			remoteFilter: true,
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getFileGrid_data' ,
					file_code: this.fileId
				},
				reader: {
					type: 'json',
					rootProperty: 'data',
					totalProperty: 'total'
				}
			}),
			sorters: [{
				property: 'SDG_field_CDE_NR',
				direction: 'DESC'
			}],
			listeners: {
				beforeload: {
					fn: this.onBeforeLoad,
					scope: this
				},
				load: {
					fn: Ext.emptyFn,
					scope: this
				}
			}
		});
		
		return gridstore ;
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
		
		var title = cdeRecord.get('SDG_field_CDE_NR') ;
		
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
						name: 'SDG_field_CDE_NR'
					},{
						xtype: 'displayfield',
						fieldLabel: 'BL #',
						name: 'SDG_field_CDE_BL'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Ref Cli',
						name: 'SDG_field_CDE_REF'
					}]
				}]
			},{
				flex: 3,
				region: 'south',
				xtype: 'grid',
				store: {
					fields: [{name:'cdelig_id',type:'string'}],
					autoLoad: false,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_action: 'data_getFileGrid_data' ,
							file_code: this.fileId+'_POS'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
					sorters:[{
						property : 'cdelig_id',
						direction: 'ASC'
					}]
				},
				columns: [{
					dataIndex: 'SDG_POS_field_LIG_ID',
					text: 'Lig.ID',
					width: 80
				},{
					dataIndex: 'SDG_POS_field_PROD',
					text: 'Article',
					width: 90
				},{
					dataIndex: 'SDG_POS_field_PROD_entry_PROD_TXT',
					text: 'Desc',
					width: 150
				},{
					dataIndex: 'SDG_POS_field_QTY',
					text: 'Qty',
					align: 'right',
					width: 60
				}]
			}]
		};
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			prodForm = eastInnerPanel.child('form') ;
		
		prodForm.loadRecord(cdeRecord) ;
		Ext.Array.each( eastInnerPanel.query('grid'), function(gridPanel) {
			gridPanel.getStore().load({
				params: {
					filter: Ext.JSON.encode([{property:'cde_id',operator:'eq',value: sdgRecord.get('cde_id')}])
				}
			}) ;
		});
	},
	
	
	
	doQuit: function() {
		if( !this.noDestroy ) {
			this.destroy() ;
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
