Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerCdePickingPanel',{
	extend:'Ext.tree.Panel',
   mixins: {
		inner: 'Optima5.Modules.Spec.DbsLam.TransferInnerMixin'
	},
	
	initComponent: function() {
		this.tmpNeedLigsModelName = 'DbsLamTransferLigModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpNeedLigsModelName ) ;
		}) ;
		
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
		
		Ext.ux.dams.ModelManager.unregister( this.tmpNeedLigsModelName ) ;
		Ext.define(this.tmpNeedLigsModelName, {
			extend: 'DbsLamTransferLigModel',
			idProperty: 'id',
			fields: pushModelfields
		});
		
		
		this.ddGroup = 'DbsLamStockDD-'+this.getId() ;
		
		
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
					if( record.get('status_is_reject') ) {
						metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
					} else if( !record.get('status_is_ok') ) {
						metadata.tdCls = 'op5-spec-dbslam-stock-wait'
					} else {
						metadata.tdCls = 'op5-spec-dbslam-stock-avail'
					}
				}
			},{
				text: '<b>Status</b>',
				dataIndex: 'step_code',
				width: 65,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: '<b>Source Location</b>',
				dataIndex: 'current_adr',
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'container_ref',
					text: 'Container',
					width: 100
				},{
					dataIndex: 'stk_prod',
					text: 'P/N',
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
			},{
				text: '<b>Dest Location</b>',
				dataIndex: 'next_adr',
				renderer: function(v,metaData,record) {
					if( record.get('status_is_ok') ) {
						return '<b>'+v+'</b>' ;
					} else {
						return '<i>'+v+'</i>' ;
					}
				}
			}]
		};
		var listNeedColumns = Ext.clone(listColumns) ;
		Ext.Array.each(listNeedColumns.items, function(col) {
			if( col.columns ) {
				Ext.Array.each(col.columns, function(scol) {
					switch(scol.dataIndex) {
						case 'stk_prod' :
							Ext.apply(scol,{
								renderer: function(v,metaData,record) {
									if( record.getDepth()==1 ) {
										return ''+record.get('need_prod')+'' ;
									}
									return v ;
								}
							});
							break ;
						
						case 'mvt_qty' :
							Ext.apply(scol,{
								renderer: function(v,metaData,record) {
									if( record.getDepth()==1 ) {
										if( record.get('need_qty_remain') == 0 ) {
											metaData.tdCls = 'op5-spec-dbslam-stock-ok' ;
											return '&#160;' ;
										}
										return '<b><font color="red">'+record.get('need_qty_remain')+'</font></b>' ;
									}
									return v ;
								}
							});
							break ;
					}
				}) ;
				return ;
			}
			switch( col.dataIndex ) {
				case 'status' :
					Ext.apply(col,{
						renderer: function(v,metaData,record) {
							if( record.getDepth()==1 ) {
								return '' ;
							}
							//return v ;
							if( record.get('status_is_reject') ) {
								metaData.tdCls = 'op5-spec-dbslam-stock-notavail'
							} else if( !record.get('status_is_ok') ) {
								metaData.tdCls = 'op5-spec-dbslam-stock-wait'
							} else {
								metaData.tdCls = 'op5-spec-dbslam-stock-avail'
							}
						}
					});
					break ;
					
				case 'step_code' :
					Ext.apply(col,{
						width: 100,
						xtype: 'treecolumn',
						iconCls: 'no-icon',
						renderer: function(v,metaData,record) {
							if( record.getDepth()==1 ) {
								metaData.tdCls+= ' '+'x-grid-cell-overflowvisible' ; // colspan=2
								return '<b>'+record.get('need_txt')+'</b>' ;
							}
							return v ;
						}
					});
					break ;
			}
		}) ;
		
		Ext.apply(this,{
				//title: 'Needs/Picking',
				//xtype:'treepanel',
				//itemId: 'pNeedLigs',
				store: {
					model: this.tmpNeedLigsModelName,
					root: {root: true, expanded: true, children:[]},
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
				useArrows: true,
				rootVisible: false,
				multiSelect: false,
				singleExpand: false,
				columns: listNeedColumns,
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRenderer',
					synchronousRender: true
				}],
				listeners: {
					//beforedrop: this.doConfigureOnListNeedRender,
					itemclick: this.onListNeedItemClick,
					itemcontextmenu: this.onListNeedContextMenu,
					scope: this
				},
				viewConfig: {
					plugins: [{
						ptype: 'treeviewdragdrop',
						ddGroup: this.ddGroup,
						dragText: 'Affectation stock',
						appendOnly: true,
						enableDrag: false,
						enableDrop: true
					}],
					enableTextSelection: true,
					preserveScrollOnRefresh: true,
					getRowClass: function(record) {
					},
					listeners: {
						beforedrop: this.onListNeedDropStock,
						scope: this,
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
		this.setTitle( this.getInnerTitle() ) ;
	},
	
	refreshData: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		var cdeNeedData = Ext.clone(activeTransferRecord.getData(true)['cde_needs']),
			ligsData = Ext.clone(activeTransferStepRecord.getData(true)['ligs']) ;
		
		var map_transfercdeneedFilerecordId_arrLigs = {} ;
		Ext.Array.each( ligsData, function(ligRow) {
			var transfercdeneedFilerecordId = ligRow.cdepick_transfercdeneed_filerecord_id ;
			if( transfercdeneedFilerecordId==0 ) {
				return ;
			}
			if( !map_transfercdeneedFilerecordId_arrLigs.hasOwnProperty(transfercdeneedFilerecordId) ) {
				map_transfercdeneedFilerecordId_arrLigs[transfercdeneedFilerecordId] = [] ;
			}
			map_transfercdeneedFilerecordId_arrLigs[transfercdeneedFilerecordId].push( Ext.apply({
				leaf: true
			}, ligRow ) ) ;
		},this) ;
		
		
		
		var rootChildren = [] ;
		Ext.Array.each( cdeNeedData, function(needRow) {
			var transfercdeneedFilerecordId = needRow.transfercdeneed_filerecord_id ;
			rootChildren.push({
				transfercdeneed_filerecord_id: transfercdeneedFilerecordId,
				need_txt:  needRow.need_txt,
				need_prod: needRow.stk_prod,
				need_qty_remain:  (needRow.qty_need - needRow.qty_alloc),
				children: ( map_transfercdeneedFilerecordId_arrLigs.hasOwnProperty(transfercdeneedFilerecordId) ? map_transfercdeneedFilerecordId_arrLigs[transfercdeneedFilerecordId] : [] ),
				expanded: true
			}) ;
		}) ;
		this.setRootNode({
			root: true,
			expanded: true,
			children: rootChildren
		});
	},
	
	
	// ******** on item click/context *******
	onListNeedItemClick: function(view,record) {
		/*
		if( record.getDepth() != 2 ) {
			return ;
		}
		this.setFormRecord(record) ;
		*/
	},
	onListNeedContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 ) {
			return ;
		}
		var selRecord = selRecords[0] ;
		if( selRecord.getDepth() != 2 ) {
			return ;
		}

		gridContextMenuItems.push({
			iconCls: 'icon-bible-newfile',
			text: 'Show log',
			handler : function() {
				this.setFormRecord(selRecord) ;
			},
			scope : this
		},'-',{
			iconCls: 'icon-bible-delete',
			text: 'Remove stock allocation',
			handler : function() {
				this.handleRemoveCdeStock( [selRecord.get('transferlig_filerecord_id')] ) ;
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
	onListNeedDropStock: function(node, data, overModel, dropPosition, dropHandlers) {
		if( overModel.getDepth()!=1 ) {
			return false ;
		}
		
		var showError = null ;
		var srcStockFilerecordIds = [] ;
		Ext.Array.each( data.records, function(rec) {
			if( rec.get('inv_prod') != overModel.get('need_prod') ) {
				showError = 'P/N mismatch' ;
				return false ;
			}
			if( rec.get('inv_qty') <= 0 ) {
				return ;
			}
			srcStockFilerecordIds.push( rec.get('inv_id') ) ;
		}) ;
		if( showError ) {
			Ext.MessageBox.alert('Error',showError) ;
			return false ;
		}
		
		
		dropHandlers.wait = true ;
		if( srcStockFilerecordIds.length>0 ) {
			this.handleDropCdeStock(srcStockFilerecordIds,overModel.get('transfercdeneed_filerecord_id')) ;
		}
		return ;
	},
	
	
	
	
	
	// **** Actions ******
	handleBuildPick: function() {
		if( !this._activeTransferRecord ) {
			return ;
		}
		if( !this.getActiveTransferStepRecord() ) {
			return ;
		}
		var whseSrc = this.getActiveTransferStepRecord().get('whse_src') ;
		
		var ddGroup = this.ddGroup ;
		
		this.optimaModule.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.StockPanel',{
				optimaModule: this.optimaModule,
				_popupMode: true,
				_enableDD: ddGroup,
				whseCode: whseSrc
			})]
		}) ;
	},
	handleDropCdeStock: function(srcStockFilerecordIds,transfercdeneedFilerecordId) {
		var stockaddObjs = [] ;
		Ext.Array.each(srcStockFilerecordIds, function(srcStockFilerecordId) {
			stockaddObjs.push({
				target_transfercdeneed_filerecord_id: transfercdeneedFilerecordId,
				stk_filerecord_id: srcStockFilerecordId,
				mvt_qty: null
			});
		}) ;
		this.fireEvent('op5lamstockpickingadd',this,stockaddObjs) ;
	},
	handleRemoveCdeStock: function(transferLigIds) {
		this.fireEvent('op5lamstockpickingremove',this,transferLigIds) ;
	},
}) ;
