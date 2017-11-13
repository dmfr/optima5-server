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
		  {name: 'record_dateload', type: 'date'},
		  {name: 'record_amount', type: 'number'},
		  {name: 'record_letter',  type: 'string'},
 		  {name: 'record_type',  type: 'string'},
		  {name: 'record_readonly', type: 'boolean'}
     ]
});
Ext.define('RsiRecouveoAdrbookTreeModel',{
	extend: 'RsiRecouveoAdrbookModel',
	idProperty: 'id',
	fields:[
		{name: 'filterHide', type: 'int'},
		{name: 'adr_entity', type: 'string'},
		{name: 'adr_entity_obs', type: 'string'},
		{name: 'adr_entity_group', type: 'boolean'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamField',
		'Optima5.Modules.Spec.RsiRecouveo.ActionForm',
		'Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateForm',
		'Optima5.Modules.Spec.RsiRecouveo.RecordTempForm'
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
		
		
		var balageFields = [], balageColumns = [] ;
		var balageRenderer = function(value,metaData,record) {
			if( value == 0 ) {
				return '&#160;' ;
			}
			return '<b>'+Ext.util.Format.number(value,'0,000.00')+'</b>' ;
		};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				minWidth:70,
				align: 'center',
				renderer: balageRenderer,
				filter: {
					type: 'number'
				}
			}) ;
			
			balageFields.push({
				name: balageField,
				balageSegmtId: balageSegmt.segmt_id,
				type: 'number',
				allowNull: false
			});
		}) ;
		
		
		var formItems = []
		formItems.push({
			readOnly: true,
			xtype: 'op5crmbasebibletreepicker',
			fieldLabel: '<b>Entité</b>',
			name: 'soc_id',
			allowBlank: false,
			selectMode: 'single',
			optimaModule: this.optimaModule,
			bibleId: 'LIB_ACCOUNT',
			anchor: '',
			width: 260
		},{
			readOnly: true,
			xtype: 'textfield',
			fieldLabel: '<b># Acheteur</b>',
			name: 'acc_id',
			allowBlank: false,
			anchor: '',
			width: 260
		},{
			readOnly: true,
			xtype: 'textfield',
			fieldLabel: 'Nom / Société',
			name: 'acc_txt'
		},{
			readOnly: true,
			xtype: 'textfield',
			fieldLabel: 'SIREN/SIRET',
			name: 'acc_siret',
			anchor: '',
			width: 300
		},{
			readOnly: true,
			hidden: true,
			xtype: 'textarea',
			fieldLabel: 'Adresse Contact',
			name: 'adr_postal'
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type == 'account' ) {
				formItems.push({
					readOnly: !atrRecord.is_editable,
					xtype: 'textfield',
					cfgParam_id: 'ATR:'+atrRecord.atr_id,
					fieldLabel: atrRecord.atr_desc,
					name: atrRecord.atr_field
				});
				
			}
		},this) ;
		
		
		
		
		
		var atrRecColumns = [], atrRecFields=[] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type == 'record' ) {
				atrRecColumns.push({
					cfgParam_id: 'ATR:'+atrRecord.atr_id,
					text: atrRecord.atr_desc,
					dataIndex: atrRecord.atr_field,
					width: 80
				}) ;
				atrRecFields.push({
					name: atrRecord.atr_field,
					type: 'string'
				});
			}
		}) ;
		
		this.tmpTreeModelName = 'RsiRecouveoFileDetailRecordsTreeModel'+'-' + this.getId() ;
		Ext.ux.dams.ModelManager.unregister( this.tmpTreeModelName ) ;
		Ext.define(this.tmpTreeModelName, {
			extend: 'RsiRecouveoFileDetailRecordsTreeModel',
			fields: atrRecFields
		});
		
		var treeColumns = [{
			xtype: 'treecolumn',
			text: 'Dossier/Fact',
			dataIndex: 'id',
			flex: 1,
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
			text: 'Attributs',
			columns: atrRecColumns
		},{
			text: 'Integr.',
			hidden: true,
			dataIndex: 'record_dateload',
			align: 'center',
			width: 90,
			renderer: function(v,m,r) {
				var str = Ext.Date.format(v,'d/m/Y') ;
				if( Ext.isEmpty(str) && !Ext.isEmpty(r.get('record_type')) ) {
					str = r.get('record_type') ;
				}
				return str ;
			}
		},{
			text: 'Date',
			dataIndex: 'record_date',
			align: 'center',
			width: 90,
			renderer: Ext.util.Format.dateRenderer('d/m/Y')
		},{
			text: 'Montant',
			dataIndex: 'record_amount',
			align: 'right',
			width: 90,
			renderer: function( v, meta, r ) {
				if( Ext.isNumber(v) ) {
					v = Ext.util.Format.number(v,'0,000.00') ;
				}
				if( !Ext.isEmpty(r.get('file_id_ref')) ) {
					return '<b>'+v+'</b>' ;
				}
				return v ;
			}
		}] ;
		if( atrRecColumns.length==0 ) {
			Ext.Array.removeAt(treeColumns,1) ;
		}
		
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:['->',{
				itemId: 'tbBump',
				icon: 'images/modules/rsiveo-redflag-16.gif',
				text: '<b>Reprise dossier</b>',
				handler: function() {
					this.handleNewAction('BUMP') ;
				},
				scope: this
			},{
				itemId: 'tbNew',
				icon: 'images/modules/rsiveo-role-16.png',
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
						this.handleNewAction('CALL_OUT',{adrtel_default: true}) ;
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
						this.handleNewAction('MAIL_OUT',{adrpost_default: true}) ;
					},
					scope: this
				}]
			}],
			items:[{
				flex: 1,
				title: 'Contact',
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				border: false,
				items: [{
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
					flex: 1,
					itemId: 'pAdrbookTree',
					xtype: 'treepanel',
					tbar: [{
						itemId: 'tbNew',
						icon: 'images/modules/rsiveo-useradd-16.gif',
						text: 'Ajouter contact',
						handler: function() {
							this.handleNewAdrbook();
						},
						scope: this
					},'->',{
						xtype: 'checkbox',
						boxLabel: 'Afficher contacts invalides',
						itemId: 'chkShowInvalid',
						hideLabel: true,
						margin: '0 10 0 10',
						inputValue: 'true',
						value: 'false',
						listeners: {
							change: function (cb, newValue, oldValue) {
								this.applyAdrbookFilter();
							},
							scope: this
						}
					}],
					store: {
						model: 'RsiRecouveoAdrbookTreeModel',
						root: {children:[]},
						filters: [{
							property: 'filterHide',
							value: 0
						}],
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
					features: [{
						ftype: 'rowbody',
						getAdditionalData: function (data, idx, record, orig) {
							if( record.get('adr_entity_group') ) {
								return {
									rowBody: '<div style="">' + Ext.util.Format.nl2br(record.get("adr_entity_obs")) + '</div>',
									rowBodyCls: "op5-spec-rsiveo-actionstree-rowbody"
								};
							}
							return {
								rowBody: '<div style="">' + '' + '</div>',
								rowBodyCls: ""
							}
						}
					}],
					hideHeaders: true,
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
							tdCls: 'op5-spec-rsiveo-adrbooktree-firstcol',
							text: 'Coordonnées',
							flex: 1,
							dataIndex: 'adr_txt',
							renderer: function(value, metaData, record) {
								if( record.get('adr_entity_group') ) {
									metaData.tdAttr='style="font-weight: bold;"' ;
									value = record.get('adr_entity') ;
									return value ;
								}
								if( record.get('status_is_invalid') ) {
									metaData.tdAttr='style="color: red; font-style: italic"' ;
								}
								return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
							}
						},{
							dataIndex: 'status_is_priority',
							width: 32,
							renderer: function(value, metaData, record) {
								if( record.get('adr_entity_group') ) {
									
									return ;
								}
								if( record.get('status_is_priority') ) {
									metaData.tdCls += ' op5-spec-rsiveo-icon-priority-on' ;
								} else if( record.get('status_is_invalid') || !record.get('status_is_confirm') ) {
									// empty
								} else {
									metaData.tdCls += ' op5-spec-rsiveo-icon-priority-off' ;
								}
								return ;
							}
						},{
							align: 'center',
							xtype: 'actioncolumn',
							width: 90,
							tdCls: 'op5-spec-rsiveo-actioncol-spacer',
							disabledCls: 'x-item-invisible',
							items: [{
								iconCls: ' op5-spec-rsiveo-mail-postal-std',
								tooltip: 'Courrier',
								handler: function(grid, rowIndex, colIndex) {
									var record = grid.getStore().getAt(rowIndex);
									var formParams = {} ;
									if( record.get('adr_entity_group') ) {
										formParams['adrpost_entity'] = record.get('adr_entity') ;
									} else {
										formParams['adrpost_filerecord_id'] = record.get('adrbookentry_filerecord_id') ;
									}
									this.handleNewAction('MAIL_OUT',formParams) ;
								},
								scope: this,
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('expanded') ) {
										return true ;
									}
									if( record.get('status_is_invalid') ) {
										return true ;
									}
									if( record.get('adr_entity_group') || record.get('adr_type')=='POSTAL' ) {
										return false ;
									}
									return true ;
								}
							},{
								iconCls: ' op5-spec-rsiveo-action-callout',
								tooltip: 'Appel',
								handler: function(grid, rowIndex, colIndex) {
									var record = grid.getStore().getAt(rowIndex);
									var formParams = {} ;
									if( record.get('adr_entity_group') ) {
										formParams['adrtel_entity'] = record.get('adr_entity') ;
									} else {
										formParams['adrtel_filerecord_id'] = record.get('adrbookentry_filerecord_id') ;
									}
									this.handleNewAction('CALL_OUT',formParams) ;
								},
								scope: this,
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('expanded') ) {
										return true ;
									}
									if( record.get('status_is_invalid') ) {
										return true ;
									}
									if( record.get('adr_entity_group') || record.get('adr_type')=='TEL' ) {
										return false ;
									}
									return true ;
								}
							},{
								iconCls: ' op5-spec-rsiveo-mail-email',
								tooltip: 'Email',
								handler: function(grid, rowIndex, colIndex) {
									var record = grid.getStore().getAt(rowIndex);
									var formParams = {} ;
									if( record.get('adr_entity_group') ) {
										formParams['adrmail_entity'] = record.get('adr_entity') ;
									} else {
										formParams['adrmail_filerecord_id'] = record.get('adrbookentry_filerecord_id') ;
									}
									this.handleNewAction('MAIL_OUT',formParams) ;
								},
								scope: this,
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('expanded') ) {
										return true ;
									}
									if( record.get('status_is_invalid') ) {
										return true ;
									}
									if( record.get('adr_entity_group') || record.get('adr_type')=='EMAIL' ) {
										return false ;
									}
									return true ;
								}
							},{
								iconCls: ' op5-spec-rsiveo-mail-sms',
								tooltip: 'SMS',
								handler: function(grid, rowIndex, colIndex) {
									var record = grid.getStore().getAt(rowIndex);
									var formParams = {} ;
									if( record.get('adr_entity_group') ) {
										formParams['adrtel_entity'] = record.get('adr_entity') ;
									} else {
										formParams['adrtel_filerecord_id'] = record.get('adrbookentry_filerecord_id') ;
									}
									this.handleNewAction('MAIL_OUT',formParams) ;
								},
								scope: this,
								disabledCls: 'x-item-invisible',
								isDisabled: function(view,rowIndex,colIndex,item,record ) {
									if( record.get('expanded') ) {
										return true ;
									}
									if( record.get('status_is_invalid') ) {
										return true ;
									}
									if( record.get('adr_entity_group') || record.get('adr_type')=='TEL' ) {
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
								icon: 'images/modules/rsiveo-edit-16.gif', 
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
						afteritemexpand: function( treepanel ) {
							this.down('#pAdrbookTree').getView().refresh() ;
						},
						itemclick: function( view, record, itemNode, index, e ) {
							var cellNode = e.getTarget( view.getCellSelector() ),
								cellColumn = view.getHeaderByCell( cellNode ) ;
							switch( cellColumn.dataIndex ) {
								case 'status_is_priority' :
									if( !record.get('status_is_invalid') &&  record.get('status_is_confirm') && !record.get('status_is_priority') ) {
										Ext.MessageBox.confirm('Contact','Définir contact par défaut ?',function(btn){
											if( btn=='yes' ) {
												this.handleAdrbookPriority(record.get('adr_type'),record.get('adrbookentry_filerecord_id'));
											}
										},this) ;
									}
									break ;
							}
						},
						scope: this
					},
					viewConfig: {
						getRowClass: function(record) {
							if( record.getDepth() == 2 ) {
								return 'op5-spec-rsiveo-adrbooktree-depth2' ;
							}
						}
					}
				}]
			},{
				itemId: 'pRecordsPanel',
				tbar:[{
					xtype: 'checkbox',
					boxLabel: 'Afficher dossiers clôturés',
					itemId: 'chkShowClosed',
					hideLabel: true,
					margin: '0 10 0 10',
					inputValue: 'true',
					value: 'false',
					listeners: {
						change: function (cb, newValue, oldValue) {
							this._showClosed = newValue ;
							this.doReload();
						},
						scope: this
					}
				}],
				flex: 1,
				bodyCls: 'ux-noframe-bg',
				title: 'Factures',
				style: 'border-left: 3px solid gray ; border-right: 3px solid gray', //HACK to Neptune / VEO
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				dockedItems: [{
					itemId: 'windowsBar',
					xtype: 'toolbar',
					hidden: true,
					dock: 'bottom',
					items: []
				}],
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
					height: 55,
					itemId: 'pRecordsBalage',
					hidden: true,
					xtype:'grid',
					scrollable: false,
					columns: {
						defaults: {
							menuDisabled: true,
							draggable: false,
							sortable: false,
							hideable: false,
							resizable: false,
							groupable: false,
							lockable: false,
							flex: 1
						},
						items: balageColumns
					},
					store: {
						fields: balageFields,
						data: [],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					}
				},{
					flex: 1,
					itemId: 'pRecordsTree',
					xtype: 'treepanel',
					store: {
						model: this.tmpTreeModelName,
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
					columns: treeColumns,
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
							dragText: 'Glisser factures pour ajouter au dossier',
							appendOnly: true
						},
						listeners: {
							beforedrop: this.onRecordsTreeDrop,
							scope: this
						}
					},
					tbar:[{
						itemId: 'tbNew',
						icon: 'images/modules/rsiveo-bookmark-16.png',
						text: '<b>Action de traitement</b>',
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
					},'->',{
						itemId: 'tbRecordTemp',
						icon: 'images/modules/rsiveo-quickopen-16.png',
						text: '<b>Ajustement comptable temporaire</b>',
						handler: function() {
							this.handleCreateRecord() ;
						},
						scope: this
					}]
				}]
			},{
				flex: 1,
				title: 'Actions',
				itemId: 'tpFileActions',
				xtype: 'tabpanel',
				deferredRender: true,
				dockedItems: [{
					itemId: 'windowsBar',
					xtype: 'toolbar',
					hidden: true,
					dock: 'bottom',
					items: []
				}],
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
			this.loadAccount( this._accId, this._filterAtr, this._focusFileFilerecordId, this._showClosed ) ;
		},this) ;
		this.on('beforeclose',this.onBeforeClose,this) ;
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
	
	
	
	loadAccount: function( accId, filterAtr, focusFileFilerecordId, showClosed ) {
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
					focusFileFilerecordId,
					showClosed
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadApplySoc: function(socId) {
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds([socId]), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		this.down('#pHeaderForm').getForm().getFields().each( function(field) {
			if( field.cfgParam_id ) {
				field.setVisible( Ext.Array.contains(cfgParamIds,field.cfgParam_id) ) ;
			}
		});
		
		Ext.Array.each( this.down('#pRecordsPanel').down('#pRecordsTree').headerCt.query('[cfgParam_id]'), function(col) {
			col.setVisible( Ext.Array.contains(cfgParamIds,col.cfgParam_id) ) ;
		}) ;
	},
	onLoadAccount: function( accountRecord, filterAtr, focusFileFilerecordId, showClosed ) {
		this.onLoadApplySoc( accountRecord.get('soc_id') ) ;
		
		this.loading = true ;
		this._accId = accountRecord.getId() ;
		this._filterAtr = filterAtr ;
		this._showClosed = showClosed ;
		
		this._accountRecord = accountRecord ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().loadRecord(accountRecord) ;
		if( false ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				field.setReadOnly(true) ;
			});
		}
		
		
		this.onLoadAccountBuildAdrbookTree(accountRecord) ;
		
		
		this.down('#tpFileActions').removeAll() ;
		accountRecord.files().each( function(fileRecord) {
			if( fileRecord.get('status_closed_void') ) {
				return ;
			}
			if( fileRecord.get('status_closed_end') && !this._showClosed ) {
				return ;
			}
			this.onLoadAccountAddFileActions( fileRecord, accountRecord ) ;
		},this) ;
		
		
		var inv_nb = 0, inv_amount_total = 0, inv_amount_due = 0 ;
		accountRecord.files().each( function(fileRecord) {
			inv_nb += fileRecord.get('inv_nb') ;
			inv_amount_total += fileRecord.get('inv_amount_total') ;
			inv_amount_due += fileRecord.get('inv_amount_due') ;
		},this) ;
		this.down('#pRecordsHeader').setData({
			inv_nb: inv_nb,
			inv_amount_total: Ext.util.Format.number(inv_amount_total,'0,000.00'),
			inv_amount_due: Ext.util.Format.number(inv_amount_due,'0,000.00')
		});
		this.down('#pRecordsHeader').setVisible(true) ;
		
		
		var balageRecData = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageRecData[balageField] = 0 ;
		}) ;
		accountRecord.files().each( function(fileRecord) {
			fileRecord.records().each( function(fileRecordRecord) {
				var balageField = 'inv_balage_'+fileRecordRecord.get('calc_balage_segmt_id') ;
				balageRecData[balageField] += fileRecordRecord.get('amount') ;
			},this) ;
		},this) ;
		this.down('#pRecordsBalage').getStore().loadData([balageRecData]) ;
		this.down('#pRecordsBalage').setVisible(true) ;
		
		this.onLoadAccountBuildRecordsTree(accountRecord) ;
		
		
		this.loading = false ;
		
		if( focusFileFilerecordId ) {
			this.setActiveFileId(focusFileFilerecordId) ;
		} else {
			this.setActiveFileId() ;
		}
		
		this.down('#pRecordsPanel').down('#chkShowClosed').setValue( showClosed ) ;
		
		return ;
	},
	onLoadAccountBuildAdrbookTree: function( accountRecord ) {
		var adrbookTree = this.down('#pAdrbookTree'),
			chkShowInvalid = adrbookTree.down('#chkShowInvalid'),
			boolShowInvalid = chkShowInvalid.getValue() ;
		
		var adrbookRootMap = {}, adrbookRootMapObs = {} ;
		accountRecord.adrbook().each( function(adrBookRec) {
			Ext.Array.each( ['POSTAL','TEL','EMAIL'], function( adrType ) {
				adrBookRec.adrbookentries().each( function(adrBookEntryRec) {
					if( adrBookEntryRec.get('status_is_invalid') && !boolShowInvalid ) {
						return ;
					}
					if( adrBookEntryRec.get('adr_type') != adrType ) {
						return ;
					}
					if( !adrbookRootMap.hasOwnProperty(adrBookRec.get('adr_entity')) ) {
						adrbookRootMap[adrBookRec.get('adr_entity')] = [] ;
						adrbookRootMapObs[adrBookRec.get('adr_entity')] = adrBookRec.get('adr_entity_obs') ;
					}
					adrbookRootMap[adrBookRec.get('adr_entity')].push( Ext.apply({leaf:true},adrBookEntryRec.getData()) ) ;
				}) ;
			}) ;
		}) ;
		var adrbookRootChildren = [] ;
		Ext.Object.each( adrbookRootMap, function(k,v) {
			adrbookRootChildren.push({
				expanded: true,
				leaf: false,
				adr_entity: k,
				adr_entity_obs: adrbookRootMapObs[k],
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
	applyAdrbookFilter: function() {
		this.onLoadAccountBuildAdrbookTree( this._accountRecord ) ;
	},
	onLoadAccountBuildRecordsTree: function( accountRecord ) {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var atrRecFields=[] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( atrRecord.atr_type == 'record' ) {
				atrRecFields.push(atrRecord.atr_field) ;
			}
		}) ;
		console.dir(atrRecFields) ;
		
		var pRecordsTreeChildren = [] ;
		accountRecord.files().each( function(fileRecord) {
			if( fileRecord.get('status_closed_void') ) {
				return ;
			}
			if( fileRecord.get('status_closed_end') && !this._showClosed ) {
				return ;
			}
			
			var pRecordsTreeChildrenRecords = [] ;
			var totAmountDue = 0 ;
			fileRecord.records().each( function(fileRecordRecord) {
				var record={
					leaf: true,
					icon: ( !Ext.isEmpty(fileRecordRecord.get('type')) ? 'images/modules/rsiveo-quickopen-16.png' : undefined ),
					record_filerecord_id: fileRecordRecord.getId(),
					record_id: fileRecordRecord.get('record_id'),
					record_date: fileRecordRecord.get('date_value'),
					record_dateload: fileRecordRecord.get('date_load'),
					record_amount: fileRecordRecord.get('amount'),
					record_letter: (fileRecordRecord.get('letter_is_on') ? fileRecordRecord.get('letter_code') : ''),
					record_type: fileRecordRecord.get('type'),
					record_readonly: (Ext.isEmpty(fileRecordRecord.get('type')) || fileRecordRecord.get('bank_is_alloc'))
				};
				Ext.Array.each(atrRecFields, function(atrRecField) {
					record[atrRecField] = fileRecordRecord.get(atrRecField) ;
				});
				pRecordsTreeChildrenRecords.push(record) ;
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
		
		var recordsPanel = this.down('#pRecordsPanel'),
			recordsTree = recordsPanel.down('#pRecordsTree') ;
		recordsTree.down('toolbar').down('#tbNew').setDisabled(false) ;
		recordsTree.down('toolbar').down('#tbRecordTemp').setDisabled(false) ;
		
		var activePanel = this.down('#tpFileActions').getActiveTab() ;
		if( activePanel ) {
			this.setActiveFileId( activePanel._fileFilerecordId ) ;
		}
	},
	onLoadAccountAddFileActions: function( fileRecord, accountRecord ) {
		var statusMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			statusMap[status.status_id] = status ;
		}) ;
		
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		var actionEtaMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(actionEta) {
			actionEtaMap[actionEta.eta_range] = actionEta ;
		}) ;
		
		
		
		
		var pFileTitle = fileRecord.get('id_ref'),
			pAccId = fileRecord.get('acc_id') ;
		if( pFileTitle.indexOf(pAccId+'/') === 0 ) {
			pFileTitle = pFileTitle.substring(pAccId.length+1) ;
		}
		var pActionsGridData = [],
			iterateChild = true,
			iterateFileRecord = fileRecord ;
		while(true) {
			iterateFileRecord.actions().each(function(rec) {
				var recData = rec.getData() ;
				recData['leaf'] = true ;
				recData['icon'] = Ext.BLANK_IMAGE_URL ;
				if( iterateChild && rec.get('link_newfile_filerecord_id') ) {
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
					recData['expanded'] = true ;
					recData['expandable'] = false ;
					recData['icon'] = Ext.BLANK_IMAGE_URL ;
				}
				if( !iterateChild && !rec.get('status_is_ok') ) {
					return ;
				}
				pActionsGridData.push(recData) ;
			},this) ;
			if( (iterateFileRecord.get('from_file_filerecord_id') > 0) && accountRecord.files().getById(iterateFileRecord.get('from_file_filerecord_id')) ) {
				iterateFileRecord = accountRecord.files().getById(iterateFileRecord.get('from_file_filerecord_id')) ;
				iterateChild = false ;
				if( iterateFileRecord ) {
					continue ;
				}
			}
			break ;
		}
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
			_actionEtaMap: actionEtaMap,
			plugins: [Ext.create('Ext.grid.plugin.RowExpander',{
				rowBodyTpl: [
					'<div class="op5-spec-rsiveo-actionstree-rowbody">{[Ext.util.Format.nl2br(values.txt)]}</div>'
				]
			})],
			hideHeaders: true,
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: true,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					xtype: 'treecolumn',
					tdCls: 'op5-spec-rsiveo-actionstree-firstcol',
					width: 32,
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						var outValue ;
						var vStatus = record.get('link_status'),
							vAction = record.get('link_action'),
							vTag = record.get('scenstep_tag') ;
						var statusMap = view.up('panel')._statusMap ;
						if( statusMap.hasOwnProperty(vStatus) ) {
							var statusData = statusMap[vStatus] ;
							metaData.style += '; color: white ; background: '+statusData.status_color ;
						}
						/*
						switch( vAction ) {
							case 'CALL_OUT' :
								metaData.tdCls += ' op5-spec-rsiveo-actiontree-callout' ;
								break ;
							case 'CALL_IN' :
								metaData.tdCls += ' op5-spec-rsiveo-actiontree-callin' ;
								break ;
							case 'MAIL_OUT' :
								metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailout' ;
								break ;
							case 'MAIL_IN' :
								metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailin' ;
								break ;
						}
						*/
						outValue = '&#160;' ;
						if( !Ext.isEmpty(vTag) ) {
							//outValue = vTag ;
							metaData.style += '; font-weight: bold' ;
						}
						
						
						// Invite next action
						var fileRecord = view.up('panel')._fileRecord ;
						if( record.getDepth() == 1 
								&& fileRecord.get('next_fileaction_filerecord_id') == record.get('fileaction_filerecord_id') ) {
							metaData.tdCls += ' op5-spec-rsiveo-doaction' ;
						}
						
						
						return outValue ;
					}
				},{
					text: 'Date',
					align: 'center',
					width: 80,
					dataIndex: 'calc_date',
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						if( !record.get('status_is_ok') ) {
							var etaValue = record.get('calc_eta_range') ;
							var actionEtaMap = view.up('panel')._actionEtaMap ;
							if( actionEtaMap.hasOwnProperty(etaValue) ) {
								var actionEtaData = actionEtaMap[etaValue] ;
								metaData.style += 'color: white ; background: '+actionEtaData.eta_color ;
							}
						} else if( record.get('date_sched') 
								&& Ext.util.Format.date(record.get('date_sched'),'Y-m-d') < Ext.util.Format.date(record.get('date_actual'),'Y-m-d') ) {
							metaData.style += 'font-weight: bold ; color: red' ;
						}
						return Ext.Date.format(Ext.Date.parse(value,'Y-m-d'),'d/m/y') ;
					}
				},{
					width: 24,
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						var outValue ;
						var vStatus = record.get('link_status'),
							vAction = record.get('link_action'),
							vTag = record.get('scenstep_tag') ;
						dance:
						while(true) {
							switch( vAction ) {
								case 'CALL_OUT' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-callout' ;
									break dance ;
								case 'CALL_IN' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-callin' ;
									break dance ;
								case 'MAIL_OUT' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailout' ;
									break dance ;
								case 'MAIL_IN' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailin' ;
									break dance ;
								default :
									break ;
							}
							switch( vStatus ) {
								case 'S2L_LITIG' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-litig' ;
									break dance ;
									
								case 'S2P_PAY' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-agree' ;
									break dance ;
									
								case 'SX_CLOSE' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-close' ;
									break dance ;
								
								default :
									break ;
							}
							break ;
						}
						return '' ;
					}
				},{
					dataIndex: 'log_user',
					width: 50,
					renderer: function(value,metaData) {
						metaData.style += 'font-weight: bold ; text-align:center ;' ;
						if( value.split('@').length == 2 ) {
							return value.split('@')[1] ;
						}
						return value ;
					}
				},{
					dataIndex: 'txt_short',
					flex: 1,
					maxWidth: 250,
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						while( true ) {
							var txt ;
							
							if( !Ext.isEmpty(value) ) {
								var arrV = value.split( Ext.util.Format.nl2brRe ) ;
								arrV[0] = '<b>'+arrV[0]+'</b>' ;
								txt = arrV.join('<br/>') ;
								break ;
							}
						
							var vAction = record.get('link_action'),
								actionMap = view.up('panel')._actionMap ;
							if( actionMap.hasOwnProperty(vAction) ) {
								txt = '' ;
								if( !Ext.isEmpty(record.get('scenstep_tag')) ) {
									txt+= '<b>'+record.get('scenstep_tag')+'</b>'+'&#160;'+':'+'&#160;' ;
								}
								var actionData = actionMap[vAction] ;
								txt+= '<b>'+actionData.action_txt+'</b>' ;
								
								break ;
							}
							
							txt = '?' ;
							break ;
						}
						if( !record.get('status_is_ok') ) {
							return '<i>'+Ext.util.Format.stripTags(txt)+'</i>' ;
						}
						return txt ;
					}
				},{
					align: 'center',
					xtype:'actioncolumn',
					width:32,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/op5img/ico_pdf_16.png',
						tooltip: 'Visualiser',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.openEnvelope(rec.get('link_env_filerecord_id')) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							if( !record.get('link_env_filerecord_id') ) {
								return true ;
							}
							return false ;
						}
					}]
				}]
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.getDepth() == 2 ) {
						return 'op5-spec-rsiveo-actionstree-depth2' ;
					}
				}
			},
			store: {
				model: 'RsiRecouveoFileActionCalcModel',
				root: {root: true, fileaction_filerecord_id:0, expanded: true, children:pActionsGridData},
				sorters: [{
						property: 'status_is_ok',
						direction: 'ASC'
				},{
						property: 'date_actual',
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
					if( cellColumn instanceof Ext.tree.Column
						&& fileRecord.get('next_fileaction_filerecord_id') == record.get('fileaction_filerecord_id') ) {
							
						this.doNextAction( fileRecord, record.get('fileaction_filerecord_id'), record.get('link_action') ) ;
					}
				},
				scope: this
			}
		});
		
	},
	doReload: function(focusFileFilerecordId) {
		if( !focusFileFilerecordId ) {
			focusFileFilerecordId = this.getActiveFileId() ;
			//console.log(focusFileFilerecordId) ;
		}
		this.loadAccount( this._accId, this._filterAtr, focusFileFilerecordId, this._showClosed ) ;
	},
	
	
	onFilterChange: function() { // TODO : record-level filters
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
		
		this.loadAccount( this._accId, filterAtr, null, this._showClosed ) ;
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
		
		recordsTree.down('toolbar').down('#tbNew').setDisabled( fileRec.statusIsSchedNone() )  ;
	},
	getActiveFileId: function() {
		var recordsTree = this.down('#pRecordsTree'),
			 activeFileId = null ;
		recordsTree.getRootNode().cascadeBy( function(r) {
			if( r.get('file_filerecord_id') > 0 && r.get('file_focus') ) {
				activeFileId = r.get('file_filerecord_id') ;
			}
		}) ;
		return activeFileId ;
	},
	
	
	handleNewAction: function(actionCode, formValues) {
		var activePanel = this.down('#tpFileActions').getActiveTab(),
			fileRecord = this._accountRecord.files().getById(activePanel._fileFilerecordId) ;
		this.doNewAction( fileRecord, actionCode, false, formValues) ;
	},
	doNewAction: function(fileRecord, actionCode,force, formValues) {
		if( !force
			&& fileRecord.get('next_fileaction_filerecord_id') > 0
			&& fileRecord.get('next_action') == actionCode ) {
			
			var msg = 'Prochaine action planifiée du même type.<br>Effectuer quand même une action spontanée ?' ;
			Ext.MessageBox.confirm('Attention',msg, function(btn) {
				if( btn =='yes' ) {
					this.doNewAction(fileRecord, actionCode,true, formValues) ;
				}
			},this) ;
			return ;
		}
		this.openActionPanel(fileRecord, null,actionCode, formValues) ;
	},
	doNextAction: function(fileRecord, fileActionFilerecordId, actionCode) {
		if( fileActionFilerecordId != fileRecord.get('next_fileaction_filerecord_id') ) {
			Ext.MessageBox.alert('Error','Erreur, action non valide ?') ;
			return ;
		}
		var formValues = null ;
		switch( actionCode ) {
			case 'CALL_OUT' :
				formValues = {adrtel_default: true} ;
				break ;
			case 'MAIL_OUT' :
				formValues = {adrpost_default: true} ;
				break ;
		}
		this.openActionPanel(fileRecord, fileActionFilerecordId, null, formValues) ;
	},
	openActionPanel: function( fileRecord, fileActionFilerecordId, newActionCode, formValues ) {
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
			_formValues: formValues,
			
			minWidth:350, 
			minHeight:350,
			/*
			floating: true,
			draggable: true,
			resizable: true,
			*/
			//renderTo: this.getEl(),
			title: 'Action de communication'
		});
		
		this.addFloatingPanel(actionPanel) ;
	},
	
	handleCreateRecord: function() {
		var activePanel = this.down('#tpFileActions').getActiveTab(),
			fileRecord = this._accountRecord.files().getById(activePanel._fileFilerecordId) ;
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.RecordTempForm',{
			optimaModule: this.optimaModule,
			
			_accId: this._accountRecord.get('acc_id'),
			_fileFilerecordId: fileRecord.get('file_filerecord_id'),
			
			minWidth:350, 
			minHeight:350,
			/*
			floating: true,
			draggable: true,
			resizable: true,
			*/
			//renderTo: this.getEl(),
			title: 'Pièce comptable temporaire'
		});
		
		this.addFloatingPanel(actionPanel) ;
	},
	
	doCreateFile: function( actionCode ) {
		var actionRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(actionCode) ;
		
		var recordsPanel = this.down('#pRecordsPanel'),
			recordsTree = this.down('#pRecordsTree') ;
		recordsTree.down('toolbar').down('#tbNew').setDisabled(true) ;
		recordsTree.down('toolbar').down('#tbRecordTemp').setDisabled(true) ;
		
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
		// assocation directe TEMPREC
		var tempRec = true, tempRecIds=[] ;
		Ext.Array.each( data.records, function( dragRecord ) {
			tempRecIds.push(dragRecord.get('record_filerecord_id')) ;
			return ;
			// HACK : drag/drop all records 31/07
			
			if( Ext.isEmpty(dragRecord.get('record_type')) ) {
				tempRec = false ;
			} else {
				tempRecIds.push(dragRecord.get('record_filerecord_id')) ;
			}
		},this) ;
		if( tempRec && tempRecIds.length>0 && !overModel.get('new_is_on') && dropPosition == 'append' ) {
			this.associateTempRecords(tempRecIds,overModel.get('file_filerecord_id')) ;
			return ;
		}
		// ***************************
		
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
					this.doCancelCreate() ;
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
		if( !Ext.isEmpty(record.get('record_type')) ) {
			if( record.parentNode.get('file_filerecord_id')==0 ) {
				if( !record.get('record_readonly') ) {
					treeContextMenuItems.push({
						iconCls: 'icon-bible-delete',
						text: 'Suppr. pièce temporaire',
						handler : function() {
							this.associateTempRecords([record.get('record_filerecord_id')],null) ;
						},
						scope : this
					});
				}
			} else {
				treeContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Annuler l\'association dossier',
					handler : function() {
						this.associateTempRecords([record.get('record_filerecord_id')],0) ;
					},
					scope : this
				});
			}
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
	doCancelCreate: function() {
		this.down('#pRecordsPanel').down('#windowsBar').items.each( function(btn) {
			btn.win.close() ;
		});
		this.onLoadAccountBuildRecordsTree(this._accountRecord) ;
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
			minHeight:400,
			
			title: 'Action de traitement'
		});
		
		this.addFloatingPanel(actionPanel) ;
	},
	
	handleNewAdrbook: function( adrbookEntity ) {
		this.openAdrbookPanel( this._accountRecord.get('acc_id'), null ) ;
	},
	handleEditAdrbook: function( adrbookEntity ) {
		this.openAdrbookPanel( this._accountRecord.get('acc_id'), adrbookEntity ) ;
	},
	handleAdrbookPriority: function( adrType, adrbookFilerecordId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_setAdrbookPriority',
				acc_id: this._accountRecord.get('acc_id'),
				adr_type: adrType,
				adrbook_filerecord_id: adrbookFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','error') ;
					return ;
				}
				this.doReload() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
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
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		actionPanel.on('mylayout', function(actionPanel) {
			actionPanel.updateLayout() ;
			actionPanel.setSize( actionPanel.getWidth() , actionPanel.getHeight() ) ;
			actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		actionPanel.show();
	},
	
	onBeforeDestroy: function() {
		this.down('#pRecordsPanel').down('#windowsBar').items.each( function(btn) {
			if( btn.win && !btn.win.isClosed ) {
				btn.win.close() ;
			}
		}) ;
		this.down('#tpFileActions').down('#windowsBar').items.each( function(btn) {
			if( btn.win && !btn.win.isClosed ) {
				btn.win.close() ;
			}
		}) ;
		if( this._isDirty ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	},
	onBeforeClose: function() {
		// Check pending windows
		var hasFloatingWindows = false ;
		if( this.down('#pRecordsPanel').down('#windowsBar').items.getCount() > 0 ) {
			hasFloatingWindows = true ;
		}
		if( this.down('#tpFileActions').down('#windowsBar').items.getCount() > 0 ) {
			hasFloatingWindows = true ;
		}
		if( hasFloatingWindows ) {
			Ext.MessageBox.alert('Fermeture dossier','Transaction(s) en cours.<br>Veuillez clore les actions avant de fermer le dossier') ;
			return false ;
		}
		
		if( this.forceClose ) {
			return true ;
		}
		// Pending actions ?
		
		
		return true ;
	},
	
	
	getFloatingPanelDock: function(p) {
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.FileCreateForm ) {
			return this.down('#pRecordsPanel') ;
		}
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.RecordTempForm ) {
			return this.down('#pRecordsPanel') ;
		}
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.ActionForm ) {
			return this.down('#tpFileActions') ;
		}
		return null ;
	},
	getFloatingPanelIconCls: function(p) {
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.FileCreateForm ) {
			return 'op5-spec-rsiveo-actionclass-file' ;
		}
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.RecordTempForm ) {
			return 'op5-spec-rsiveo-actionclass-recordtemp' ;
		}
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.ActionForm ) {
			return 'op5-spec-rsiveo-actionclass-comm' ;
		}
		return '' ;
	},
	addFloatingPanel: function(p) {
		var dockPanel = this.getFloatingPanelDock(p),
			  dockBar ;
		if( !dockPanel ) {
			return ;
		}
		dockBar = dockPanel.down('#windowsBar') ;
		
		// Attach des events
		p.on('saved',function(fileFilerecordId) {
			this.doReload(fileFilerecordId) ;
		},this) ;
		p.on('created',function(newFileFilerecordId) {
			this.doReload(newFileFilerecordId) ;
		},this) ;
		
		p.on('destroy',this.onFloatingPanelDestroy,this) ;
		
		//this.getEl().mask() ;
		var title ;
		if( title = p.getTitle() ) {
			p.setTitle(null) ;
		}
		
		Ext.apply(p,{
			header: false,
			border: false
		});
		var win = Ext.create('Ext.window.Window',{
			layout: 'fit',
			title: title,
			items: p,
			
			iconCls: this.getFloatingPanelIconCls(p),
			
			renderTo: this.getEl(),
			constrain: true,
			
			minimizable: true,
			resizable: false,
			
			listeners: {
				destroy: this.onFloatingWindowDestroy,
				minimize: this.onFloatingWindowMinimize,
				scope: this
			}
		}) ;
		p.win = win ;
		p.on('titlechange',function(p) {
			var w = p.up('window'),
				title = p.getTitle() ;
			p.setTitle(null);
			w.setTitle(title) ;
		});
		
		/*
		actionPanel.on('mylayout', function(actionPanel) {
			actionPanel.updateLayout() ;
			actionPanel.setSize( actionPanel.getWidth() , actionPanel.getHeight() ) ;
			actionPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		*/
		win.on('boxready', function(w) {
			w.getEl().alignTo(dockPanel.getEl(), 'br-br?');
		},this) ;
		win.show();
		
		// replace normal window close w/fadeOut animation:
		win.doClose = function ()  {
			win.doClose = Ext.emptyFn; // dblclick can call again...
			win.destroy();
		};
		
		dockBar.setVisible(true) ;
		var btn = dockBar.add({
			cls: 'op5-spec-rsiveo-action-btn',
			iconCls: win.iconCls,
			enableToggle: true,
			toggleGroup: 'panels',
			width: 140,
			margin: '0 2 0 3',
			text: Ext.util.Format.ellipsis(title, 20),
			listeners: {
				click: this.onFloatingBtnClick,
				scope: this
			},
			win: win
		}) ;
		win.btn = btn ;
		win.animateTarget = win.btn.el;
		win.on('titlechange', function(win) {
			win.btn.setText( Ext.util.Format.ellipsis(win.getTitle(), 20) ) ;
		}) ;
		btn.toggle(true) ;
	},
	onFloatingPanelDestroy: function(p) {
		if( p.win && !p.win.isClosed ) {
			p.win.close() ;
		}
	},
	onFloatingWindowMinimize: function(win) {
		win.hide() ;
	},
	onFloatingWindowDestroy: function(win) {
		if( !win ) {
			return ;
		}
		win.isClosed = true ;
		var dockPanel ;
		if( win.btn ) {
			dockPanel = win.btn.ownerCt ;
			win.btn.destroy() ;
			if( dockPanel && dockPanel.items.getCount() == 0 ) {
				dockPanel.hide() ;
			}
		}
	},
	onFloatingBtnClick: function(btn) {
		// minimize all
		var dockPanel = btn.ownerCt ;
		dockPanel.items.each( function(btnIter) {
			btnIter.win.hide() ;
		}) ;
		
		// maximize 
		btn.win.getEl().alignTo(dockPanel.getEl(), 'br-br?');
		btn.win.show() ;
		btn.toggle(true) ;
	},
	
	
	openEnvelope: function(envFilerecordId) {
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: 'Visualisation enveloppe',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',{
				optimaModule: this.optimaModule,
				_envFilerecordId: envFilerecordId
			})]
		}) ;
	},
	
	associateTempRecords: function( arrRecordFilerecordIds, fileFilerecordId, doAssociate ) {
		if( !doAssociate ) {
			var msg ;
			if( fileFilerecordId == null ) {
				msg = 'Supprimer enregistrement ?' ;
			} else if( fileFilerecordId > 0 ) {
				msg = 'Associer paiements au fichier sélectionné ?' ;
			} else {
				msg = 'Annuler l\'association ?' ;
			}
			Ext.MessageBox.confirm('Attention',msg, function(btn) {
				if( btn =='yes' ) {
					this.associateTempRecords(arrRecordFilerecordIds, fileFilerecordId, true) ;
				} else {
					this.doReload() ;
				}
			},this) ;
			return ;
		}
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_allocateRecordTemp',
				file_filerecord_id: (fileFilerecordId==null ? '' : fileFilerecordId),
				arr_recordFilerecordIds: Ext.JSON.encode(arrRecordFilerecordIds)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.doReload(ajaxResponse.file_filerecord_id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	}
}) ; 
