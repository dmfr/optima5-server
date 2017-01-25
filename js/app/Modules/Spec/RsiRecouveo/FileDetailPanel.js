Ext.define('RsiRecouveoFileDetailRecordsTreeModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'new_is_on',  type: 'boolean'},
		  {name: 'new_action', type: 'string'},
 		  {name: 'new_text', type: 'string'},
		  {name: 'file_filerecord_id', type: 'int'},
		  {name: 'file_focus', type: 'boolean'},
        {name: 'file_id_ref',  type: 'string'},
        {name: 'file_status',  type: 'string'},
        {name: 'file_status_color',  type: 'string'},
		  {name: 'record_filerecord_id', type: 'int'},
		  {name: 'record_id', type: 'string'},
		  {name: 'record_date', type: 'date'},
		  {name: 'record_amount', type: 'number'},
		  {name: 'record_letter',  type: 'string'}
     ]
});
Ext.define('RsiRecouveoAdrbookTreeModel',{
	extend: 'RsiRecouveoAdrbookModel',
	idProperty: 'id',
	fields:[
		{name: 'adr_entity_group', type: 'boolean'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamField',
		'Optima5.Modules.Spec.RsiRecouveo.ActionForm',
		'Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateForm'
	],
	
	_readonlyMode: false,
	
	initComponent: function() {
		
		
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		
		
		
		var formItems = []
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			formItems.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: atrId,
				cfgParam_emptyDisplayText: 'Toutes valeurs',
				optimaModule: this.optimaModule,
				name: 'filter_'+atrId,
				allowBlank: false,
				fieldLabel: atrRecord.atr_txt,
				
				listeners: {
					change: this.onFilterChange,
					scope: this
				}
			})) ;
		},this) ;
		formItems.push({
			xtype: 'textfield',
			fieldLabel: '<b># Acheteur</b>',
			name: 'acc_id',
			allowBlank: false,
			anchor: '',
			width: 260
		},{
			xtype: 'textfield',
			fieldLabel: 'Nom / Société',
			name: 'acc_txt'
		},{
			xtype: 'textfield',
			fieldLabel: 'SIREN/SIRET',
			name: 'acc_siret',
			anchor: '',
			width: 300
		},{
			xtype: 'textarea',
			fieldLabel: 'Adresse Contact',
			name: 'adr_postal'
		}) ;
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				itemId: 'tbSave',
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.handleSaveHeader() ;
				},
				scope:this
			},'->',{
				itemId: 'tbNew',
				icon: 'images/modules/dbspeople-role-16.png',
				text: '<b>Actions de communication</b>',
				menu:[{
					iconCls: 'op5-spec-rsiveo-action-callin',
					text: 'Appel entrant',
					handler: function() {
						this.handleNewAction('CALL_IN') ;
					},
					scope: this
				},{
					iconCls: 'op5-spec-rsiveo-action-callout',
					text: 'Appel sortant',
					handler: function() {
						this.handleNewAction('CALL_OUT') ;
					},
					scope: this
				},{
					iconCls: 'op5-spec-rsiveo-action-mailin',
					text: 'Courrier entrant',
					handler: function() {
						this.handleNewAction('MAIL_IN') ;
					},
					scope: this
				},{
					iconCls: 'op5-spec-rsiveo-action-mailout',
					text: 'Courrier sortant',
					handler: function() {
						this.handleNewAction('MAIL_OUT') ;
					},
					scope: this
				}]
			}],
			items:[{
				flex: 1,
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				border: false,
				items: [{
					flex:2,
					xtype: 'form',
					itemId: 'pHeaderForm',
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 15,
					layout:'anchor',
					fieldDefaults: {
						labelWidth: 125,
						anchor: '100%'
					},
					items: formItems
				},{
					flex: 3,
					title: 'Contacts',
					itemId: 'pAdrbookTree',
					xtype: 'treepanel',
					store: {
						model: 'RsiRecouveoAdrbookTreeModel',
						root: {children:[]},
						proxy: {
							type: 'memory' ,
							reader: {
								type: 'json'
							}
						}
					},
					displayField: 'nodeText',
					rootVisible: false,
					useArrows: true,
					columns: {
						defaults: {
							menuDisabled: true,
							draggable: false,
							sortable: false,
							hideable: false,
							resizable: false,
							groupable: false,
							lockable: false /*,
							renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
								var column = view.ownerCt.columns[colIndex] ;
								if( column instanceof Ext.tree.Column ) {
									metaData.tdAttr='style="width:300px;"' ;
								} else {
									metaData.tdAttr='style="width:0px; display:none ;"' ;
								}
								return value ;
							}*/
						},
						items: [{
							hidden: true,
							text: 'adrtel_filerecord_id',
							dataIndex: 'adrtel_filerecord_id'
						},{
							xtype: 'treecolumn',
							text: 'Description',
							width: 100,
							dataIndex: 'adr_type',
							renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
								if( record.get('adr_entity_group') ) {
									metaData.tdAttr='style="width:340px; font-weight: bold;"' ;
									value = record.get('adr_entity') ;
									return value ;
								}
								switch( value ) {
									case 'TEL' :
										value = 'Téléphone' ;
										break ;
									case 'POSTAL' :
										value = 'Adresse' ;
										break ;
									case 'EMAIL' :
										value = 'Email' ;
									metaData.tdAttr='style="font-style: italic;"' ;
								}
								return value ;
							}
						},{
							text: 'Coordonnées',
							width: 180,
							dataIndex: 'adr_txt',
							renderer: function(value, metaData, record) {
								if( record.get('adr_entity_group') ) {
									metaData.tdAttr='style="width:0px; display:none ;"' ;
									return ;
								}
								return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
							}
						},{
							text: 'Status',
							width: 60,
							renderer: function(value, metaData, record) {
								if( record.get('adr_entity_group') ) {
									metaData.tdAttr='style="width:0px; display:none ;"' ;
									return ;
								}
								if( record.get('status_is_invalid') ) {
									metaData.tdCls += ' op5-spec-dbstracy-kpi-nok' ;
								} else if( record.get('status_is_confirm') ) {
									metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
								} else {
									metaData.tdCls += ' op5-spec-dbstracy-kpi-unknown' ;
								}
							}
						},{
							align: 'center',
							xtype:'actioncolumn',
							width:50,
							disabledCls: 'x-item-invisible',
							items: [{
								iconCls: ' op5-spec-rsiveo-action-callout',
								tooltip: 'Appel',
								handler: function(grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									
								},
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('adr_entity_group') || record.get('adr_type')=='TEL' ) {
										return false ;
									}
									return true ;
								}
							},{
								//icon: Ext.BLANK_IMAGE_URL,
								iconCls: ' op5-spec-rsiveo-action-spacer',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									return true ;
								}
							},{
								iconCls: ' op5-spec-rsiveo-action-mailout',
								tooltip: 'Courrier',
								handler: function(grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									
								},
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('adr_entity_group') || record.get('adr_type')=='POSTAL' ) {
										return false ;
									}
									return true ;
								}
							}]
						},{
							align: 'center',
							xtype:'actioncolumn',
							width:35,
							disabledCls: 'x-item-invisible',
							items: [{
								icon: 'images/op5img/ico_edit_small.gif', 
								tooltip: 'Modifier',
								handler: function(grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									this.handleEditAdrbook( rec.get('adr_entity') ) ;
								},
								scope: this,
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('adr_entity_group') ) {
										return false ;
									}
									return true ;
								}
							}]
						}]
					},
					listeners: {
						edited: function() {
							this.handleSaveHeader();
						},
						scope: this
					}
				}]
			},{
				flex: 1,
				bodyCls: 'ux-noframe-bg',
				title: 'Factures',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					height: 65,
					itemId: 'pRecordsHeader',
					xtype:'component',
					hidden: true,
					tpl: [
						'<div class="op5-spec-dbspeople-realvalidhdr">',
							'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
								'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-rsiveo-factureheader-icon">',
								'</div>',
								'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
									'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb Factures :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_nb}</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Total encours :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_total}&#160;€</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Reste dû :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_due}&#160;€</td>',
									'</tr>',
									'</table>',
								'</div>',
							'</div>',
						'</div>',
						{
							disableFormats: true
						}
					]
				},{
					flex: 1,
					itemId: 'pRecordsTree',
					xtype: 'treepanel',
					store: {
						model: 'RsiRecouveoFileDetailRecordsTreeModel',
						root: {children:[]},
						proxy: {
							type: 'memory' ,
							reader: {
								type: 'json'
							}
						}
					},
					displayField: 'nodeText',
					rootVisible: false,
					useArrows: true,
					columns: [{
						xtype: 'treecolumn',
						text: 'Dossier/Fact',
						dataIndex: 'id',
						width: 170,
						renderer: function( v, meta, r ) {
							if( r.get('new_is_on') ) {
								return '<b>'+r.get('new_text')+'</b>' ;
							}
							if( !Ext.isEmpty(r.get('file_id_ref')) ) {
								return '<b>'+r.get('file_id_ref')+'</b>' ;
							}
							return r.get('record_id') ;
						}
					},{
						text: 'Lettrage',
						dataIndex: 'record_letter',
						width: 80
					},{
						text: 'Date',
						dataIndex: 'record_date',
						align: 'center',
						width: 80,
						renderer: Ext.util.Format.dateRenderer('d/m/Y')
					},{
						text: 'Montant',
						dataIndex: 'record_amount',
						align: 'right',
						width: 80,
						renderer: function( v, meta, r ) {
							if( !Ext.isEmpty(r.get('file_id_ref')) ) {
								return '<b>'+v+'</b>' ;
							}
							return v ;
						}
					}],
					selModel: {
						mode: 'MULTI'
					},
					listeners: {
						itemclick: this.onRecordsTreeItemClick,
						itemcontextmenu: this.onRecordsTreeContextMenu,
						scope: this
					},
					viewConfig: {
						getRowClass: function(r) {
							if( r.isRoot() ) {
								return '' ;
							}
							if( r.get('new_is_on') || r.parentNode.get('new_is_on') ) {
								return 'op5-spec-rsiveo-pom' ;
							}
							if( r.get('file_focus') || r.parentNode.get('file_focus') ) {
								return 'op5-spec-rsiveo-pis' ;
							}
						},
						plugins: {
							ptype: 'treeviewdragdrop',
							ddGroup: 'RsiRecouveoFileDetailRecordsTreeDD',
							dragText: 'Glisser factures pour ajouter au dossier'
						},
						listeners: {
							beforedrop: this.onRecordsTreeDrop,
							scope: this
						}
					},
					tbar:[{
						itemId: 'tbNew',
						icon: 'images/modules/crmbase-bookmark-16.png',
						text: '<b>Nouvelle action</b>',
						menu:[{
							iconCls: 'icon-bible-new',
							text: 'Ouverture dossier',
							handler: function() {
								this.doCreateFile('BUMP') ;
							},
							scope: this
						},{
							iconCls: 'op5-spec-rsiveo-action-agree',
							text: 'Promesse règlement',
							handler: function() {
								this.doCreateFile('AGREE_START') ;
							},
							scope: this
						},{
							iconCls: 'op5-spec-rsiveo-action-litig',
							text: 'Demande d\'action externe',
							handler: function() {
								this.doCreateFile('LITIG_START') ;
							},
							scope: this
						},{
							iconCls: 'op5-spec-rsiveo-action-close',
							text: 'Demande de clôture',
							handler: function() {
								this.doCreateFile('CLOSE_ASK') ;
							},
							scope: this
						}]
					}]
				}]
			},{
				flex: 1,
				itemId: 'tpFileActions',
				xtype: 'tabpanel',
				deferredRender: true,
				items: [],
				listeners: {
					tabchange: this.onTabChange,
					scope: this
				}
			}]
		}) ;
		
		this.callParent() ;
		
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			this.loadAccount( this._accId, this._filterAtr, this._focusFileFilerecordId ) ;
		},this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			default: break ;
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
	
	
	
	loadAccount: function( accId, filterAtr, focusFileFilerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_open',
				acc_id: accId,
				filter_atr: Ext.JSON.encode(filterAtr)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadAccount(
					Ext.ux.dams.ModelManager.create( 
						Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAccountModel(),
						ajaxResponse.data
					),
					filterAtr,
					focusFileFilerecordId
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadAccount: function( accountRecord, filterAtr, focusFileFilerecordId ) {
		this.loading = true ;
		this._accId = accountRecord.getId() ;
		this._filterAtr = filterAtr ;
		
		this._accountRecord = accountRecord ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().loadRecord(accountRecord) ;
		if( true ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				field.setReadOnly(true) ;
			});
		}
		
		// filters
		var headerForm = this.down('#pHeaderForm').getForm(),
			field, values ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			field = headerForm.findField('filter_'+atrId) ;
			field.suspendEvents(false) ;
			values = accountRecord.get(atrId) ;
			if( Ext.isEmpty(values) ) {
				field.setVisible(false) ;
				return ;
			}
			field.setVisible(true) ;
			field.doManualCleanup(values) ;
			
			// reapply filter ?
			if( filterAtr && filterAtr.hasOwnProperty(atrId) ) {
				field.setValue(filterAtr[atrId]) ;
			}
			field.resumeEvents() ;
		}) ;
		
		
		this.onLoadAccountBuildAdrbookTree(accountRecord) ;
		
		
		this.down('#tpFileActions').removeAll() ;
		accountRecord.files().each( function(fileRecord) {
			if( fileRecord.get('status_closed') ) {
				return ;
			}
			this.onLoadAccountAddFileActions( fileRecord ) ;
		},this) ;
		
		
		var inv_nb = 0, inv_amount_total = 0, inv_amount_due = 0 ;
		accountRecord.files().each( function(fileRecord) {
			inv_nb += fileRecord.get('inv_nb') ;
			inv_amount_total += fileRecord.get('inv_amount_total') ;
			inv_amount_due += fileRecord.get('inv_amount_due') ;
		},this) ;
		this.down('#pRecordsHeader').setData({
			inv_nb: inv_nb,
			inv_amount_total: inv_amount_total,
			inv_amount_due: inv_amount_due
		});
		this.down('#pRecordsHeader').setVisible(true) ;
		
		this.onLoadAccountBuildRecordsTree(accountRecord) ;
		
		
		this.loading = false ;
		
		if( focusFileFilerecordId ) {
			this.setActiveFileId(focusFileFilerecordId) ;
		} else {
			this.setActiveFileId() ;
		}
		
		return ;
	},
	onLoadAccountBuildAdrbookTree: function( accountRecord ) {
		var adrbookTree = this.down('#pAdrbookTree') ;
		
		var adrbookRootMap = {} ;
		accountRecord.adrbook().each( function(adrBookRec) {
			if( adrBookRec.get('status_is_invalid') ) {
				return ;
			}
			if( !adrbookRootMap.hasOwnProperty(adrBookRec.get('adr_entity')) ) {
				adrbookRootMap[adrBookRec.get('adr_entity')] = [] ;
			}
			adrbookRootMap[adrBookRec.get('adr_entity')].push( Ext.apply({leaf:true},adrBookRec.getData()) ) ;
		}) ;
		var adrbookRootChildren = [] ;
		Ext.Object.each( adrbookRootMap, function(k,v) {
			adrbookRootChildren.push({
				expanded: false,
				leaf: false,
				adr_entity: k,
				adr_entity_group: true,
				children: v
			})
		}) ;
		
		adrbookTree.setRootNode({
			root: true,
			expanded: true,
			children: adrbookRootChildren
		}); 
	},
	onLoadAccountBuildRecordsTree: function( accountRecord ) {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var pRecordsTreeChildren = [] ;
		accountRecord.files().each( function(fileRecord) {
			if( fileRecord.get('status_closed') ) {
				return ;
			}
			
			var pRecordsTreeChildrenRecords = [] ;
			var totAmountDue = 0 ;
			fileRecord.records().each( function(fileRecordRecord) {
				pRecordsTreeChildrenRecords.push({
					leaf: true,
					record_filerecord_id: fileRecordRecord.getId(),
					record_id: fileRecordRecord.get('record_id'),
					record_date: fileRecordRecord.get('date_value'),
					record_amount: fileRecordRecord.get('amount'),
					record_letter: (fileRecordRecord.get('letter_is_on') ? fileRecordRecord.get('letter_code') : '')
				});
				totAmountDue += fileRecordRecord.get('amount') ;
			},this) ;
			
			var statusCode = fileRecord.get('status'),
				statusColor, statusColorNodash ;
			if( statusMap.hasOwnProperty(statusCode) ) {
				statusColor = statusMap[statusCode]['status_color'] ;
				statusColorNodash = statusColor.substring(1) ;
			}
			pRecordsTreeChildren.push({
				iconCls: 'bgcolor-'+statusColorNodash,
				icon: Ext.BLANK_IMAGE_URL,
				
				file_filerecord_id: fileRecord.getId(),
				file_id_ref: fileRecord.get('id_ref'),
				file_status: statusCode,
				file_status_color: statusColor,
				record_amount: totAmountDue,
				
				expanded: true,
				children: pRecordsTreeChildrenRecords,
				leaf: false
			}) ;
		},this) ;
		this.down('#pRecordsTree').getStore().setRootNode({root:true, expanded:true, children:pRecordsTreeChildren}) ;
		
		var activePanel = this.down('#tpFileActions').getActiveTab() ;
		if( activePanel ) {
			this.setActiveFileId( activePanel._fileFilerecordId ) ;
		}
	},
	onLoadAccountAddFileActions: function( fileRecord ) {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		
		
		
		var pFileTitle = fileRecord.get('id_ref'),
			pAccId = fileRecord.get('acc_id') ;
		if( pFileTitle.indexOf(pAccId+'/') === 0 ) {
			pFileTitle = pFileTitle.substring(pAccId.length+1) ;
		}
		var pActionsGridData = [] ;
		fileRecord.actions().each(function(rec) {
			var recData = rec.getData() ;
			recData['leaf'] = true ;
			recData['icon'] = Ext.BLANK_IMAGE_URL ;
			if( rec.get('link_newfile_filerecord_id') ) {
				var childFileRecord = this._accountRecord.files().getById(rec.get('link_newfile_filerecord_id')) ;
					childrenActions = [] ;
				childFileRecord.actions().each(function(cRec) {
					var cRecData = cRec.getData() ;
					cRecData['leaf'] = true ;
					cRecData['icon'] = Ext.BLANK_IMAGE_URL ;
					childrenActions.push(cRecData) ;
				}) ;
				recData['leaf'] = false ;
				recData['children'] = childrenActions ;
				recData['expanded'] = false ;
				recData['icon'] = Ext.BLANK_IMAGE_URL ;
			}
			pActionsGridData.push(recData) ;
		},this) ;
		var statusCode = fileRecord.get('status'),
			  statusIconCls = '' ;
		if( statusMap.hasOwnProperty(statusCode) ) {
			var statusData = statusMap[statusCode],
				statusColor = statusData.status_color,
				statusColorNodash = statusColor.substring(1) ;
			statusIconCls = 'bgcolor-'+statusColorNodash ;
		}
		
		
		var tabPanel = this.down('#tpFileActions') ;
		tabPanel.add({
			_fileFilerecordId: fileRecord.getId(),
			title: pFileTitle,
			iconCls: statusIconCls,
			xtype: 'treepanel',
			useArrows: true,
			rootVisible: false,
			_fileRecord: fileRecord,
			_statusMap: statusMap,
			_actionMap: actionMap,
			features: [{
				ftype: 'rowbody',
				getAdditionalData: function (data, idx, record, orig) {
					return {
						rowBody: '<div style="">' + Ext.util.Format.nl2br(record.get("txt")) + '</div>',
						rowBodyCls: "op5-spec-rsiveo-actionstree-rowbody"
					};
				}
			}],
			columns: [{
				xtype: 'treecolumn',
				tdCls: 'op5-spec-rsiveo-actionstree-firstcol',
				dataIndex: 'link_status',
				width: 40,
				renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
					var statusMap = view.up('panel')._statusMap ;
					if( statusMap.hasOwnProperty(value) ) {
						var statusData = statusMap[value] ;
						metaData.style += 'color: white ; background: '+statusData.status_color ;
						return '' ;
					}
					return '' ;
				}
			},{
				dataIndex: 'link_action',
				width: 100,
				renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
					var actionMap = view.up('panel')._actionMap ;
					if( actionMap.hasOwnProperty(value) ) {
						var actionData = actionMap[value] ;
						return '<b>'+actionData.action_txt+'</b>' ;
					}
					return '?' ;
				}
			},{
				text: 'Planning',
				width: 100,
				dataIndex: 'date_sched',
				renderer: Ext.util.Format.dateRenderer('d/m/Y')
			},{
				text: 'Status',
				width: 48,
				dataIndex: 'status_is_ok',
				renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
					var fileRecord = view.up('panel')._fileRecord ;
					if( record.getDepth() == 1 
							&& fileRecord.get('next_fileaction_filerecord_id') == record.get('fileaction_filerecord_id') ) {
						metaData.tdCls += ' op5-spec-rsiveo-doaction' ;
						return ;
					}
					if( !value ) {
						metaData.tdCls += ' op5-spec-dbstracy-files-nowarning' ;
					} else {
						metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
					}
					return '' ;
				}
			},{
				text: 'Réalisé',
				width: 100,
				dataIndex: 'date_actual',
				renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
					if( record.get('status_is_ok') ) {
						return Ext.util.Format.date(value,'d/m/Y') ;
					}
					return '' ;
				}
			}],
			viewConfig: {
				getRowClass: function(record) {
					if( record.getDepth() == 2 ) {
						return 'op5-spec-rsiveo-actionstree-depth2' ;
					}
				}
			},
			store: {
				model: 'RsiRecouveoFileActionModel',
				root: {root: true, fileaction_filerecord_id:0, expanded: true, children:pActionsGridData},
				sorters: [{
						property: 'calc_date',
						direction: 'DESC'
				},{
						property: 'fileaction_filerecord_id',
						direction: 'DESC'
				}],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			listeners: {
				itemclick: function( view, record, itemNode, index, e ) {
					var cellNode = e.getTarget( view.getCellSelector() ),
						cellColumn = view.getHeaderByCell( cellNode ),
						fileRecord = view.up('panel')._fileRecord ;
					if( cellColumn.dataIndex == 'status_is_ok'
						&& fileRecord.get('next_fileaction_filerecord_id') == record.get('fileaction_filerecord_id') ) {
							
						this.doNextAction( fileRecord, record.get('fileaction_filerecord_id') ) ;
					}
				},
				scope: this
			}
		});
		
	},
	doReload: function(focusFileFilerecordId) {
		this.loadAccount( this._accId, this._filterAtr, focusFileFilerecordId ) ;
	},
	
	
	onFilterChange: function() {
		if( this.loading ) {
			return ;
		}
		// filters
		var headerForm = this.down('#pHeaderForm').getForm(),
			field, filterAtr = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			field = headerForm.findField('filter_'+atrId) ;
			if( !Ext.isEmpty(field.getValue()) ) {
				filterAtr[atrId] = field.getValue() ;
			}
		}) ;
		
		this.loadAccount( this._accId, filterAtr ) ;
	},
	
	
	onRecordsTreeItemClick: function(view, record, item, index, event) {
		if( record.get('file_filerecord_id') > 0 ) {
			this.setActiveFileId(record.get('file_filerecord_id')) ;
		}
	},
	onTabChange: function(tabPanel , newCard , oldCard) {
		this.setActiveFileId(newCard._fileFilerecordId) ;
	},
	setActiveFileId: function( fileFilerecordId ) {
		var tabPanel = this.down('#tpFileActions'),
			recordsTree = this.down('#pRecordsTree') ;
			  
		if( !fileFilerecordId ) {
			// 1er fichier ?
			var isFirst = true ;
			recordsTree.getRootNode().cascadeBy( function(r) {
				if( !Ext.isEmpty(r.get('file_id_ref')) ) {
					r.set('file_focus',isFirst) ;
					isFirst = false ;
					return false ;
				}
			}) ;
			recordsTree.getView().refresh() ;
			tabPanel.setActiveTab(0) ;
			return ;
		}
		
		var fileRec = this._accountRecord.files().getById(fileFilerecordId) ;
		if( !fileRec ) {
			this.setActiveFileId() ;
		}
		
		recordsTree.getRootNode().cascadeBy( function(r) {
			if( r.get('file_filerecord_id') > 0 ) {
				r.set('file_focus',r.get('file_filerecord_id')==fileFilerecordId) ;
				isFirst = false ;
				return false ;
			}
		}) ;
		recordsTree.getView().refresh() ;
		tabPanel.items.each( function(panel) {
			if( panel._fileFilerecordId == fileFilerecordId ) {
				tabPanel.setActiveTab(panel) ;
			}
		});
		
		this.down('toolbar').down('#tbNew').setDisabled( fileRec.statusIsSchedNone() )  ;
	},
	
	
	handleSaveHeader: function(doReload) {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
			  
		var recordData = form.getValues(false,false,false,true) ;
		recordData['adr_postal'] = this.down('#gridAdrPostal').getTabData() ;
		recordData['adr_tel'] = this.down('#gridAdrTel').getTabData() ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_setHeader',
				_is_new: ( this._fileNew ? 1 : 0 ),
				file_filerecord_id: ( this._fileNew ? null : this._fileFilerecordId ),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSaveHeader(ajaxResponse.id, doReload) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId, doReload) {
		this.optimaModule.postCrmEvent('datachange',{}) ;
		
		if( doReload ) {
			this.loadFile(savedId) ;
		}
	},
	
	
	handleNewAction: function(actionCode) {
		var activePanel = this.down('#tpFileActions').getActiveTab(),
			fileRecord = this._accountRecord.files().getById(activePanel._fileFilerecordId) ;
		this.doNewAction( fileRecord, actionCode, false) ;
	},
	doNewAction: function(fileRecord, actionCode,force) {
		if( !force
			&& fileRecord.get('next_fileaction_filerecord_id') > 0
			&& fileRecord.get('next_action') == actionCode ) {
			
			var msg = 'Prochaine action planifiée du même type.<br>Effectuer quand même une action spontanée ?' ;
			Ext.MessageBox.confirm('Attention',msg, function(btn) {
				if( btn =='yes' ) {
					this.doNewAction(fileRecord, actionCode,true) ;
				}
			},this) ;
			return ;
		}
		this.openActionPanel(fileRecord, null,actionCode) ;
	},
	doNextAction: function(fileRecord, fileActionFilerecordId) {
		if( fileActionFilerecordId != fileRecord.get('next_fileaction_filerecord_id') ) {
			Ext.MessageBox.alert('Error','Erreur, action non valide ?') ;
			return ;
		}
		this.openActionPanel(fileRecord, fileActionFilerecordId) ;
	},
	openActionPanel: function( fileRecord, fileActionFilerecordId, newActionCode ) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionForm',{
			optimaModule: this.optimaModule,
			
			_accId: this._accountRecord.get('acc_id'),
			_fileFilerecordId: fileRecord.get('file_filerecord_id'),
			_fileActionFilerecordId: fileActionFilerecordId,
			_newActionCode: newActionCode,
			
			minWidth:350, 
			minHeight:350,
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			
			title: 'Action sur dossier'
		});
		
		actionPanel.on('saved',function(fileFilerecordId) {
			this.doReload(fileFilerecordId) ;
		},this) ;
		actionPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		actionPanel.on('mylayout', function(actionPanel) {
			actionPanel.updateLayout() ;
			actionPanel.setSize( actionPanel.getWidth() , actionPanel.getHeight() ) ;
			actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		actionPanel.show();
		
		
		this.floatingPanel = actionPanel ;
	},
	
	
	doCreateFile: function( actionCode ) {
		var actionRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(actionCode) ;
		
		var recordsTree = this.down('#pRecordsTree'),
			recordsTreeRoot = this.down('#pRecordsTree').getRootNode() ;
		recordsTreeRoot.insertChild(0,{
			new_is_on: true,
			new_text: actionRow.action_txt,
			new_action: actionCode,
			expanded: true,
			children: []
		});
		recordsTree.scrollTo(0) ;
	},
	onRecordsTreeDrop: function(node, data, overModel, dropPosition, dropHandlers) {
		if( !(overModel.get('new_is_on') && dropPosition == 'append') ) {
			return false ;
		}
		var valid = true ;
		Ext.Array.each( data.records, function( dragRecord ) {
			if( Ext.isEmpty(dragRecord.get('record_id')) ) {
				valid = false ;
			}
		},this) ;
		return valid ;
	},
	onRecordsTreeContextMenu: function(view, record, item, index, event) {
		var treeContextMenuItems = new Array() ;
		if( record.get('new_is_on') ) {
			treeContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Abandonner nouvelle action',
				handler : function() {
					this.onLoadAccountBuildRecordsTree(this._accountRecord) ;
				},
				scope : this
			});
			treeContextMenuItems.push({
				iconCls: 'icon-bible-new',
				text: 'Confimer sélection & Paramétrer',
				handler : function() {
					this.doCreateFileSelection(record) ;
				},
				scope : this
			});
		}
		
		if( treeContextMenuItems.length == 0 ) {
			return ;
		};
		
		var treeContextMenu = Ext.create('Ext.menu.Menu',{
			items : treeContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		treeContextMenu.showAt(event.getXY());
		
	},
	doCreateFileSelection: function(treeRecordNew) {
		var accId = this._accountRecord.get('acc_id'),
			arr_recordIds = [],
			newActionCode = treeRecordNew.get('new_action') ;
		treeRecordNew.cascadeBy(function(treeRecord) {
			if( !Ext.isEmpty(treeRecord.get('record_filerecord_id')) ) {
				arr_recordIds.push(treeRecord.get('record_filerecord_id')) ;
			}
		}) ;
		this.openCreatePanel(accId,arr_recordIds,newActionCode) ;
	},
	openCreatePanel: function( accId, arr_recordIds, newActionCode ) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileCreateForm',{
			optimaModule: this.optimaModule,
			
			_accId: accId,
			_arr_recordIds: arr_recordIds,
			_newActionCode: newActionCode,
			
			minWidth:350, 
			minHeight:350,
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			
			title: 'Nouveau dossier'
		});
		
		actionPanel.on('created',function(newFileFilerecordId) {
			this.doReload(newFileFilerecordId) ;
		},this) ;
		actionPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		actionPanel.on('mylayout', function(actionPanel) {
			actionPanel.updateLayout() ;
			actionPanel.setSize( actionPanel.getWidth() , actionPanel.getHeight() ) ;
			actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		actionPanel.show();
		
		
		this.floatingPanel = actionPanel ;
	},
	
	handleEditAdrbook: function( adrbookEntity ) {
		this.openAdrbookPanel( this._accountRecord.get('acc_id'), adrbookEntity ) ;
	},
	openAdrbookPanel: function( accId, adrbookEntity ) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',{
			optimaModule: this.optimaModule,
			
			_accId: accId,
			_adrbookEntity: adrbookEntity,
			_adrbookEntityNew: !adrbookEntity,
			
			minWidth:350, 
			minHeight:350,
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'save',
				handler: function(e, t, p) {
					p.ownerCt.askSave();
				},
				scope: this
			},{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.askDestroy() ;
				},
				scope: this
			}],
			
			title: 'Gestion contacts'
		});
		
		actionPanel.on('saved',function() {
			this.doReload() ;
		},this) ;
		actionPanel.on('destroy',function(validConfirmPanel) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		actionPanel.on('mylayout', function(actionPanel) {
			actionPanel.updateLayout() ;
			actionPanel.setSize( actionPanel.getWidth() , actionPanel.getHeight() ) ;
			actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		actionPanel.show();
		
		
		this.floatingPanel = actionPanel ;
	},
	
	onBeforeDestroy: function() {
		if( this._isDirty ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
}) ; 
