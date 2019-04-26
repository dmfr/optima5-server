Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerCdeLinkPanel',{
	extend:'Ext.grid.Panel',
   mixins: {
		inner: 'Optima5.Modules.Spec.DbsLam.TransferInnerMixin'
	},
	
	title: 'Orders',
	
	initComponent: function() {
		var cdesColumns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: [{
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
				dataIndex: 'cde_nr',
				text: 'Order #',
				width: 150,
				filter: {
					type: 'string'
				}
			},{
				dataIndex: 'lig_id',
				text: 'Lig #',
				width: 60
			},{
				dataIndex: 'stk_prod',
				text: 'P/N',
				width: 200,
				filter: {
					type: 'string'
				}
			},{
				dataIndex: 'stk_batch',
				text: 'BatchCode',
				width: 100
			},{
				dataIndex: 'stk_datelc',
				text: 'DLUO',
				width: 100
			},{
				dataIndex: 'qty_cde',
				text: 'Qty order',
				align: 'right',
				width: 90
			}]
		};
		
		Ext.apply(this,{
			//xtype:'grid',
			//itemId: 'pCdes',
			store: {
				model: 'DbsLamTransferCdeLinkModel',
				data: [],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			selModel: {
				mode: 'MULTI'
			},
			columns: cdesColumns,
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			},{
				ptype: 'uxgridfilters'
			}],
			listeners: {
				//itemclick: this.onCdesItemClick,
				itemcontextmenu: this.onCdesContextMenu,
				scope: this
			},
			viewConfig: {
				enableTextSelection: true,
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
				},
				listeners: {
					beforerefresh: function(view) {
						view.isRefreshing = true ;
					},
					refresh: function(view) {
						view.isRefreshing = false ;
					}
				}
			}
		});
		
		
		this.callParent() ;
		this.initInner() ;
	},
	
	refreshData: function() {
		var activeTransferRecord = this.getActiveTransferRecord() ;
		var ligsData = Ext.clone(activeTransferRecord.getData(true)['cde_links']) ;
		this.getStore().loadRawData( ligsData ) ;
	},
	
	
	// ******** on item click/context *******
	onCdesItemClick: function(view,record) {
		/*
		this.setFormRecord(record) ;
		*/
	},
	onCdesContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		
		var cdesFilerecordIds = [] ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			if( !Ext.Array.contains(cdesFilerecordIds,selRecords[recIdx].get('cde_filerecord_id')) ) {
				cdesFilerecordIds.push( selRecords[recIdx].get('cde_filerecord_id') ) ;
			}
		}
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Remove <b>'+cdesFilerecordIds.length+'</b> orders',
			handler : function() {
				this.fireEvent('op5lamcderemove',this,cdesFilerecordIds) ;
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
	
	
	
	
	
	// **** Actions ******
	handleBuildPick: function() {
		if( !this._activeTransferRecord ) {
			return ;
		}
		
		var ddGroup = 'DbsLamCdesDD-'+this.getId() ;
		
		this.createDD(ddGroup) ;
		this.optimaModule.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.CdePanel',{
				optimaModule: this.optimaModule,
				_popupMode: true,
				_enableDD: ddGroup,
				listeners: {
					destroy: function() {
						this.destroyDD() ;
					},
					scope: this
				}
			})]
		}) ;
	},
	createDD: function(ddGroup) {
		var me = this,
			grid = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		this.gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: ddGroup,
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					var cdesFilerecordIds = [] ;
					Ext.Array.each( ddSource.dragData.records, function(selectedRecord) {
						if( selectedRecord.get('cde_filerecord_id') ) {
							cdesFilerecordIds.push( selectedRecord.get('cde_filerecord_id') ) ; 
						}
					});
					if( cdesFilerecordIds.length > 0 ) {
						me.handleDropCdes(cdesFilerecordIds) ;
					}
			}
		});
	},
	destroyDD: function() {
		if( this.gridPanelDropTarget ) {
			this.gridPanelDropTarget.destroy() ;
			this.gridPanelDropTarget = null ;
		}
	},
	handleDropCdes: function(cdesFilerecordIds) {
		this.fireEvent('op5lamcdeadd',this,cdesFilerecordIds) ;
	}
}) ;
