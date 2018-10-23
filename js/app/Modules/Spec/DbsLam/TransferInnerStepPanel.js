Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel',{
	extend:'Ext.grid.Panel',
   mixins: {
		inner: 'Optima5.Modules.Spec.DbsLam.TransferInnerMixin'
	},
	
	initComponent: function() {
		var optimaModule = this.optimaModule ;
		
		this.tmpLigsModelName = 'DbsLamTransferLigModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpLigsModelName ) ;
		}) ;
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			
			var fieldEditor ;
			if( attribute.bible_code ) {
				fieldEditor = {
					xtype:'op5crmbasebibletreepicker',
					selectMode: 'single',
					optimaModule: optimaModule,
					bibleId: attribute.bible_code
				} ;
			} else  {
				fieldEditor = {
					xtype:'textfield'
				} ;
			}

			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75,
				editorTplNew: fieldEditor
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
					dataIndex: 'container_type',
					text: 'Cont/Ref',
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
					dataIndex: 'container_ref',
					text: 'Cont/Ref',
					width: 100
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
						return '' ;
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
				text: 'Rollback <b>'+selRecords.length+'</b> rows',
				handler : function() {
					this.fireEvent('op5lamstockrollback',this,transferligFilerecordIds) ;
				},
				scope : this
			});
		}
		if( this.hasBuildPick() && areNotCommitted ) {
			gridContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Remove <b>'+selRecords.length+'</b> rows',
				handler : function() {
					this.fireEvent('op5lamstockremove',this,transferligFilerecordIds) ;
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
		this.rollbackEditorAdr(false) ;
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
		if( !this.optionsHasAdrAlloc() ) {
			return false ;
		}
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
		if( !this.submitEditorAdr(context.record,context.originalValues['dst_adr'],context.newValues['dst_adr']) ) {
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
			"container_is_off":Ext.isEmpty(values.container_type),
			"container_type":values.container_type,
			"container_ref":""
		} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.STOCK_fieldcode ) {
				skuData_obj[attribute.mkey] = values[attribute.mkey] ;
			}
		}) ;
		
		this.submitEditorNew(context.record,skuData_obj,values.dst_adr) ;
	},
	onEditorCancelEdit: function(editor,context) {
		var store = context.store,
			record = context.record ;
		if( record.get('_input_is_on') ) {
			store.remove(record) ;
		}
	},
	submitEditorAdr: function( gridRecord, oldValue, newValue ) {
		if( newValue.trim().toUpperCase() == oldValue.trim().toUpperCase() ) {
			return false ;
		}
		this._rollbackEditAdr_gridRecord = gridRecord ;
		this._rollbackEditAdr_oldValue = oldValue ;
		
		var adrObj = {
			transferlig_filerecord_id: gridRecord.get('transferlig_filerecord_id'),
			adr_id: newValue.trim().toUpperCase()
		} ;
		this.fireEvent('op5lamstocksetadr',this,adrObj) ;
		return true ;
	},
	rollbackEditorAdr: function(torf) {
		if( torf && this._rollbackEditAdr_gridRecord ) {
			this._rollbackEditAdr_gridRecord.set('dst_adr',this._rollbackEditAdr_oldValue) ;
			Ext.MessageBox.alert('Error','Location not accepted') ;
		}
		delete this._rollbackEditAdr_gridRecord ;
		delete this._rollbackEditAdr_oldValue ;
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
