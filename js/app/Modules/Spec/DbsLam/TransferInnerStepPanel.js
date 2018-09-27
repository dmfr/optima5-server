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
		console.dir(pushModelfields) ;
		
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
				},
				editorTplNew: {
					xtype: 'combobox',
					allowBlank:false,
					name: 'dest_adr',
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
								var treepanel = this.down('#pCenter').down('#pTree'),
									selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
									isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer'),
									whseSrc = selectedNodes[0].get('whse_src') ;
								
								var params = options.getParams() ;
								Ext.apply(params,{
									filter: Ext.JSON.encode([{property:'treenode_key',value:whseSrc}])
								}) ;
								options.setParams(params) ;
							},
							scope: this
						}
					}
				}
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
				dataIndex: 'next_adr',
				renderer: function(v,metaData,record) {
					if( record.get('status_is_ok') ) {
						return '<b>'+v+'</b>' ;
					} else {
						return '<i>'+v+'</i>' ;
					}
				},
				editorTplAdr: {
					xtype: 'textfield'
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
						//beforeedit: this.onListBeforeEdit,
						//validateedit: this.onListEdit,
						//canceledit: this.onListCancelEdit,
						scope: this
					}
				}],
				listeners: {
					//render: this.doConfigureOnListRender,
					//itemclick: this.onListItemClick,
					//itemcontextmenu: this.onListContextMenu,
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
	

}) ;
