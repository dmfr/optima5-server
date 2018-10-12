Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel',{
	extend:'Ext.grid.Panel',
   mixins: {
		inner: 'Optima5.Modules.Spec.DbsLam.TransferInnerMixin'
	},
	
	initComponent: function() {
		this.tmpLigsModelName = 'DbsLamTransferLigModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpLigsModelName ) ;
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
		
		Ext.ux.dams.ModelManager.unregister( this.tmpLigsModelName ) ;
		Ext.define(this.tmpLigsModelName, {
			extend: 'DbsLamTransferLigModel',
			fields: pushModelfields
		});
		
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
				renderer: function(v,metaData,record) {
					if( Ext.isEmpty(record.get('src_whse')) ) {
						return '' ;
					}
					if( Ext.isEmpty(v) ) {
						return '('+record.get('src_whse')+')' ;
					}
					return '<b>'+v+'</b>' ;
				},
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'container_ref',
					text: 'Container',
					width: 100,
					editorTplNew: {
								xtype: 'combobox',
								anchor: '100%',
								forceSelection:true,
								allowBlank:false,
								editable:false,
								queryMode: 'local',
								displayField: 'container_type_txt',
								valueField: 'container_type',
								fieldStyle: 'text-transform:uppercase',
								store: {
									model: 'DbsLamCfgContainerTypeModel',
									data: Ext.Array.merge([{
										container_type:'',
										container_type_txt: '- Aucun -'
									}],Optima5.Modules.Spec.DbsLam.HelperCache.getContainerTypeAll()),
									proxy: {
										type: 'memory'
									},
									listeners: {
										scope: this
									}
								},
								listeners: {
									scope: this
								}
					}
				},{
					dataIndex: 'stk_prod',
					text: 'P/N',
					width: 100,
					editorTplNew: {
								xtype: 'combobox',
								forceSelection:true,
								allowBlank:false,
								editable:true,
								typeAhead:false,
								selectOnFocus: true,
								selectOnTab: false,
								queryMode: 'remote',
								displayField: 'prod_id',
								valueField: 'id',
								queryParam: 'filter',
								minChars: 2,
								fieldStyle: 'text-transform:uppercase',
								store: {
									model: 'DbsLamProdComboboxModel',
									proxy: this.optimaModule.getConfiguredAjaxProxy({
										extraParams : {
											_moduleId: 'spec_dbs_lam',
											_action: 'prods_getGrid',
											limit: 20
										},
										reader: {
											type: 'json',
											rootProperty: 'data'
										}
									}),
									listeners: {
										scope: this
									}
								},
								listeners: {
									scope: this
								}
					}
				},{
					dataIndex: 'stk_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75,
					editorTplNew: {
								xtype: 'numberfield',
								allowBlank: false,
								minValue: 1
					}
				},{
					dataIndex: 'stk_sn',
					text: 'Serial',
					width: 100
				}]
			},{
				text: '<b>Dest Location</b>',
				dataIndex: 'dst_adr',
				renderer: function(v,metaData,record) {
					if( record.get('status_is_ok') ) {
						return '<b>'+v+'</b>' ;
					}
					if( Ext.isEmpty(v) ) {
						v = '('+record.get('dst_whse')+')' ;
					}
					return '<i>'+v+'</i>' ;
				},
				editorTplAdr: {
					xtype: 'textfield'
				},
				editorTplNew: {
					xtype: 'combobox',
					allowBlank:false,
					fieldStyle: 'text-transform:uppercase',
					forceSelection:false,
					editable:true,
					typeAhead:false,
					selectOnFocus: true,
					selectOnTab: false,
					queryMode: 'remote',
					displayField: 'entry_key',
					valueField: 'entry_key',
					queryParam: 'filter',
					minChars: 2,
					fieldStyle: 'text-transform:uppercase',
					store: {
						fields: ['entry_key'],
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_action: 'data_getBibleGrid',
								bible_code: 'ADR',
								limit: 20
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						listeners: {
							beforeload: function(store,options) {
								var activeTransferStepRecord = this.getActiveTransferStepRecord(),
									whseDst = activeTransferStepRecord.get('whse_dst') ;
								
								var params = options.getParams() ;
								Ext.apply(params,{
									filter: Ext.JSON.encode([{property:'treenode_key',value:whseDst}])
								}) ;
								options.setParams(params) ;
							},
							scope: this
						}
					}
				}
			}]
		};
		
		Ext.apply(this,{
				//xtype:'gridpanel',
				//itemId: 'pLigs',
				store: {
					model: this.tmpLigsModelName,
					data: [],
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
				selModel: {
					mode: 'MULTI'
				},
				columns: listColumns,
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRenderer',
					synchronousRender: true
				},{
					ptype: 'rowediting',
					pluginId: 'pEditor',
					clicksToEdit: 1,
					listeners: {
						beforeedit: this.onEditorBeforeEdit,
						validateedit: this.onEditorEdit,
						canceledit: this.onEditorCancelEdit,
						scope: this
					}
				}],
				listeners: {
					itemclick: this.onListItemClick,
					itemcontextmenu: this.onListContextMenu,
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
		}) ;
		
		this.callParent() ;
		this.initInner() ;
		this.setTitle( this.getInnerTitle() ) ;
	},
	
	refreshData: function() {
		var activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		var ligsData = Ext.clone(activeTransferStepRecord.getData(true)['ligs']) ;
		this.getStore().loadRawData( ligsData ) ;
	},
	
	
	// ******** on item click/context *******
	onListItemClick: function(view,record) {
		/*
		this.setFormRecord(record) ;
		*/
	},
	onListContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		
		var entryKeys = [] ;
		var areNotCommitted = true ;
		var areCommitted = true ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			entryKeys.push( selRecords[recIdx].get('transferlig_filerecord_id') ) ;
			if( selRecords[recIdx].get('status_is_ok') ) {
				areNotCommitted = false ;
			} else {
				areCommitted = false ;
			}
		}
		if( entryKeys.length==1 ) {
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
				text: 'Rollback <b>'+selRecords.length+'</b> rows',
				handler : function() {
					this.fireEvent('op5lamstockrollback',this,entryKeys) ;
				},
				scope : this
			});
		}
		if( this.hasBuildPick() && areNotCommitted ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Remove <b>'+selRecords.length+'</b> rows',
				handler : function() {
					this.fireEvent('op5lamstockremove',this,entryKeys) ;
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
	},
	
	
	
	// ********* Editor functions *********
	onEditorBeforeEdit: function(editor, context) {
		if( context.record.get('_input_is_on') ) {
			return this.onEditorBeforeNewEdit(editor,context) ;
		}
		return this.onEditorBeforeAdrEdit(editor,context) ;
	},
	onEditorBeforeNewEdit: function( editor, context ) {
		var pLigs = context.grid ;
		Ext.Array.each( pLigs.getColumns(), function(col) {
			if( col.editorTplNew ) {
				col.setEditor(col.editorTplNew) ;
			} else {
				col.setEditor(null) ;
			}
		}) ;
		
		if( !context.record.get('_input_is_on') ) {
			return false ;
		}
		
	},
	onEditorBeforeAdrEdit: function( editor, context ) {
		var pLigs = context.grid ;
		Ext.Array.each( pLigs.getColumns(), function(col) {
			if( col.editorTplAdr ) {
				col.setEditor(col.editorTplAdr) ;
			} else {
				col.setEditor(null) ;
			}
		}) ;
		if( context.record.get('status_is_ok') ) {
			return false ;
		}
	},
	onEditorEdit: function( editor, context ) {
		if( context.record.get('_input_is_on') ) {
			return this.onEditorNewEdit(editor,context) ;
		}
		return this.onEditorAdrEdit(editor,context) ;
	},
	onEditorAdrEdit: function( editor, context ) {
		if( !this.onEditorEditAdr(context.record,context.originalValues['next_adr'],context.newValues['next_adr']) ) {
			context.cancel = true ;
			return false ;
		}
		return true ;
	},
	onEditorNewEdit: function( editor, context ) {
		var editorForm = editor.editor,
			prodCombo = editorForm.getForm().findField('stk_prod'),
			prodRecord = prodCombo.getSelection(),
			values = context.newValues ;
		
		var skuData_obj = {
			"soc_code":prodRecord.get('prod_soc'),
			"stk_prod":prodRecord.get('id'),
			"stk_batch":'',
			"stk_sn":'',
			"mvt_qty":values.mvt_qty,
			"container_is_off":Ext.isEmpty(values.container_ref),
			"container_type":values.container_ref,
			"container_ref":""
		} ;
		this.submitEditorNew(context.record,skuData_obj,values.dst_adr) ;
	},
	onEditorCancelEdit: function(editor,context) {
		var store = context.store,
			record = context.record ;
		if( record.get('_input_is_on') ) {
			store.remove(record) ;
		}
	},
	onEditorEditAdr: function( gridRecord, oldValue, newValue ) {
		if( newValue.trim().toUpperCase() == oldValue.trim().toUpperCase() ) {
			return false ;
		}
		var curStepCode = gridRecord.get('step_code'),
			transferLig_filerecordId = gridRecord.get('transferlig_filerecord_id'),
			empty = Ext.isEmpty(newValue.trim().toUpperCase()) ;
		
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: (empty ? 'transfer_unallocAdrFinal':'transfer_allocAdrFinal'),
			transfer_filerecordId: this.getActiveTransferFilerecordId(),
			transferLigFilerecordId_arr: Ext.JSON.encode([transferLig_filerecordId]),
			transferStepCode: curStepCode,
			manAdr_isOn: true,
			manAdr_adrId: newValue.trim().toUpperCase()
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Location not accepted') ;
					gridRecord.set('next_adr',oldValue) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		return true ;
	},
	
	submitEditorNew: function( gridRecordTmp, stkData_obj, location ) {
		var stockaddObj = {
			stkData_obj: stkData_obj,
			mvt_qty: null,
			commit: true,
			dst_whse: this.getActiveTransferStepRecord().get('whse_dst'),
			dst_adr: location
		};
		this.fireEvent('op5lamstockadd',this,[stockaddObj]) ;
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
		
		var ddGroup = 'DbsLamStockDD-'+this.getId() ;
		
		this.createDD(ddGroup) ;
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
				_enablePartialTake: true,
				whseCode: whseSrc,
				listeners: {
					stkalloc: function(p, allocObj) {
						var stockaddObj = {
							stk_filerecord_id: allocObj['stk_filerecord_id'],
							mvt_qty: allocObj['mvt_qty']
						};
						this.fireEvent('op5lamstockadd',this,[stockaddObj]) ;
					},
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
					var srcStockFilerecordIds = [] ;
					Ext.Array.each( ddSource.dragData.records, function(selectedRecord) {
						if( selectedRecord.get('inv_id') ) {
							srcStockFilerecordIds.push( selectedRecord.get('inv_id') ) ; 
						}
					});
					if( srcStockFilerecordIds.length > 0 ) {
						me.handleDropStock(srcStockFilerecordIds) ;
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
	handleDropStock: function(srcStockFilerecordIds) {
		var stockaddObjs = [] ;
		Ext.Array.each(srcStockFilerecordIds, function(srcStockFilerecordId) {
			stockaddObjs.push({
				stk_filerecord_id: srcStockFilerecordId,
				mvt_qty: null
			});
		}) ;
		this.fireEvent('op5lamstockadd',this,stockaddObjs) ;
	},
	
	
	handleInputNew: function(doClose) {
		if( doClose ) {
			Ext.MessageBox.alert('Error','Item not accepted', function() {
				var toDel = [] ;
				this.getStore().each( function(rec) {
					if( rec.get('_input_is_on') ) {
						toDel.push(rec) ;
					}
				}) ;
				this.getStore().remove(toDel) ;
			}, this) ;
			return ;
		}
		
		
		var news = this.getStore().insert(0,{
			_input_is_on: true
		}) ;
		var newRecord = news[0] ;
		this.getPlugin('pEditor').startEdit(newRecord) ;
	}
	
	

}) ;
