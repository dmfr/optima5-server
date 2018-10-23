Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerCdePackingPanel',{
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
				text: '<b>Source Location</b>',
				dataIndex: 'src_adr',
				width: 200,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'container_ref_display',
					text: 'Container',
					width: 150
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
				dataIndex: 'dst_adr',
				width: 200,
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
						
					}
				}) ;
				return ;
			}
			switch( col.dataIndex ) {
				case 'status' :
					Ext.apply(col,{
						renderer: function(v,metaData,record) {
							if( record.getDepth()==1 ) {
								if( record.get('transfercdepack_filerecord_id')==0 ) {
									metaData.tdCls = 'op5-spec-dbslam-pack-none' ;
								} else if( !record.get('pack_status_is_ready') ) {
									metaData.tdCls = 'op5-spec-dbslam-pack-init'
								} else if( !record.get('pack_status_is_shipped') ) {
									metaData.tdCls = 'op5-spec-dbslam-pack-ready'
								} else {
									metaData.tdCls = 'op5-spec-dbslam-pack-shipped'
								}
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
					
				case 'src_adr' :
					Ext.apply(col,{
						xtype: 'treecolumn',
						iconCls: 'no-icon',
						renderer: function(v,metaData,record) {
							if( record.getDepth()==1 ) {
								metaData.tdCls+= ' '+'x-grid-cell-overflowvisible' ; // colspan=2
								if( record.get('transfercdepack_filerecord_id')==0 ) {
									return '<i>'+'Todo Packing'+'</i>' ;
								} else {
									return '<b>'+record.get('pack_id_sscc')+'</b>' ;
								}
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
					enableTextSelection: true,
					preserveScrollOnRefresh: true,
					getRowClass: function(record) {
					},
					listeners: {
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
		var cdePackData = Ext.clone(activeTransferRecord.getData(true)['cde_packs']),
			ligsData = Ext.clone(activeTransferStepRecord.getData(true)['ligs']) ;
		
		var map_transfercdepackFilerecordId_arrLigs = {} ;
		Ext.Array.each( ligsData, function(ligRow) {
			var transfercdepackFilerecordId = ligRow.cdepack_transfercdepack_filerecord_id ;
			if( transfercdepackFilerecordId==0 ) {
				// return ; // No Pack !
			}
			if( !map_transfercdepackFilerecordId_arrLigs.hasOwnProperty(transfercdepackFilerecordId) ) {
				map_transfercdepackFilerecordId_arrLigs[transfercdepackFilerecordId] = [] ;
			}
			map_transfercdepackFilerecordId_arrLigs[transfercdepackFilerecordId].push( Ext.apply({
				leaf: true
			}, ligRow ) ) ;
		},this) ;
		
		
		
		var rootChildren = [] ;
		if( map_transfercdepackFilerecordId_arrLigs[0] ) {
			rootChildren.push({
				transfercdepack_filerecord_id: 0,
				children: map_transfercdepackFilerecordId_arrLigs[0],
				expanded: true
			}) ;
		}
		Ext.Array.each( cdePackData, function(packRow) {
			var transfercdepackFilerecordId = packRow.transfercdepack_filerecord_id ;
			rootChildren.push({
				transfercdepack_filerecord_id: transfercdepackFilerecordId,
				pack_id_sscc:  packRow.id_sscc,
				pack_id_trspt_code:  packRow.id_trspt_code,
				pack_id_trspt_id:  packRow.id_trspt_id,
				pack_status_is_ready: packRow.status_is_ready,
				pack_status_is_shipped: packRow.status_is_shipped,
				children: ( map_transfercdepackFilerecordId_arrLigs.hasOwnProperty(transfercdepackFilerecordId) ? map_transfercdepackFilerecordId_arrLigs[transfercdepackFilerecordId] : [] ),
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

		var transferligFilerecordIds = [] ;
		var areNotCommitted = true ;
		var areCommitted = true ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			transferligFilerecordIds.push( selRecords[recIdx].get('transferlig_filerecord_id') ) ;
			if( selRecords[recIdx].get('status_is_ok') ) {
				areNotCommitted = false ;
			} else {
				areCommitted = false ;
			}
		}
		if( transferligFilerecordIds.length==1 ) {
			/*
			gridContextMenuItems.push({
				iconCls: 'icon-bible-newfile',
				text: 'Show log',
				handler : function() {
					//this.setFormRecord(selRecords[0]) ;
				},
				scope : this
			},'-') ;
			*/
		}
		if( areCommitted ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Rollback',
				handler : function() {
					this.fireEvent('op5lamstockpackingrollback',this,transferligFilerecordIds) ;
				},
				scope : this
			});
		}
		
		if( Ext.isEmpty(gridContextMenuItems) ) {
			return ;
		}
		
		var gridContextMenu = Ext.create('Ext.menu.Menu',{
			items : gridContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		gridContextMenu.showAt(event.getXY());
	}
}) ;
