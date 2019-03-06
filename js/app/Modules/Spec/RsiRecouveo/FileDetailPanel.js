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
		  {name: 'record_ref', type: 'string'},
		  {name: 'record_txt', type: 'string'},
		  {name: 'record_date', type: 'date'},
		  {name: 'record_dateload', type: 'date'},
		  {name: 'record_datevalue', type: 'date'},
		  {name: 'record_amount', type: 'number'},
		  {name: 'record_xe_currency_amount', type: 'number'},
		  {name: 'record_xe_currency_sign', type: 'string'},
		  {name: 'record_xe_currency_code', type: 'string'},
		  {name: 'record_letter_code',  type: 'string'},
 		  {name: 'record_letter_is_confirm',  type: 'boolean'},
 		  {name: 'record_type',  type: 'string'},
		  {name: 'record_readonly', type: 'boolean'},
		  
		  {name: 'letter_node', type: 'boolean'},
		  {name: 'letter_code', type: 'string'},
		  {name: 'letter_is_confirm', type: 'boolean'}
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


Ext.define("Optima5.Modules.Spec.RsiRecouveo.FileDetailRowExpander", {
	extend: "Ext.grid.plugin.RowExpander",
	alias: "plugin.op5specrsiveofiledetailrowexpander",

	isCollapsed: function (rowIdx) {
		var me = this,
				rowNode = me.view.getNode(rowIdx),
				row = Ext.fly(rowNode, '_rowExpander');

		return row.hasCls(me.rowCollapsedCls)
	},


	collapse: function (rowIdx) {
		if (this.isCollapsed(rowIdx) == false) {
				this.toggleRow(rowIdx, this.grid.getStore().getAt(rowIdx));
		}
	},


	collapseAll: function () {
		for (i = 0; i < this.grid.getStore().getTotalCount(); i++) {
				this.collapse(i);
		}
	},


	expand: function (rowIdx) {
		if (this.isCollapsed(rowIdx) == true) {
				this.toggleRow(rowIdx, this.grid.getStore().getAt(rowIdx));
		}
	},


	expandAll: function () {
		for (i = 0; i < this.grid.getStore().getTotalCount(); i++) {
				this.expand(i);
		}
	}
});


Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamField',
		'Optima5.Modules.Spec.RsiRecouveo.ActionForm',
		'Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateForm',
		'Optima5.Modules.Spec.RsiRecouveo.RecordTempForm',
		'Optima5.Modules.Spec.RsiRecouveo.AgreeComparePanel'
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
		
		var disabledActions = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			var nextStatusId = action.status_next ;
			if( Ext.isEmpty(nextStatusId) ) {
				return ;
			}
			var nextStatus = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(nextStatusId) ;
			if( nextStatus && nextStatus.is_disabled ) {
				disabledActions.push( action.action_id ) ;
			}
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
		formItems.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
			fieldLabel: '<b>Affectation</b>',
			cfgParam_id: 'USER',
			cfgParam_emptyDisplayText: '-Non affecté-',
			optimaModule: this.optimaModule,
			name: 'link_user'
		}),{
			readOnly: true,
			xtype: 'op5crmbasebibletreepicker',
			fieldLabel: '<b>Entité</b>',
			name: 'soc_id',
			allowBlank: false,
			selectMode: 'single',
			optimaModule: this.optimaModule,
			bibleId: 'LIB_ACCOUNT',
			anchor: '75%'
		},{
			readOnly: true,
			xtype: 'textfield',
			fieldLabel: '<b># Acheteur</b>',
			name: 'acc_id',
			allowBlank: false
		},{
			xtype: 'fieldcontainer',
			itemId: 'btnSimilar',
			fieldLabel: '&#160;',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [{
				xtype: 'button',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Comptes associés',
				handler: function() {
					this.doOpenAccSimilar() ;
				},
				scope: this
			}]
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
				if( atrRecord.is_filter ) {
					formItems.push({
						cfgParam_id: 'ATR:'+atrRecord.atr_id,
						readOnly: !atrRecord.is_editable,
						xtype: 'combobox',
						fieldLabel: atrRecord.atr_desc,
						name: atrRecord.atr_field,
						forceSelection:false,
						allowBlank:true,
						editable:true,
						typeAhead:false,
						queryMode: 'remote',
						displayField: 'atr_value',
						valueField: 'atr_value',
						queryParam: 'search_txt',
						minChars: 1,
						checkValueOnChange: function() {}, //HACK
						store: {
							fields: [
								{name: 'atr_value', type:'string'}
							],
							proxy: this.optimaModule.getConfiguredAjaxProxy({
								extraParams : {
									_moduleId: 'spec_rsi_recouveo',
									_action: 'account_getAllAtrs',
									atr_field: atrRecord.atr_field
								},
								reader: {
									type: 'json',
									rootProperty: 'data'
								}
							})
						}
					});
				} else {
					formItems.push({
						cfgParam_id: 'ATR:'+atrRecord.atr_id,
						readOnly: !atrRecord.is_editable,
						xtype: 'textfield',
						fieldLabel: atrRecord.atr_desc,
						name: atrRecord.atr_field,
					})
				}
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
					width: 100
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
			width: 250,
			renderer: function( v, meta, r ) {
				if( r.get('new_is_on') ) {
					return '<b>'+r.get('new_text')+'</b>' ;
				}
				if( !Ext.isEmpty(r.get('file_id_ref')) ) {
					return '<b>'+r.get('file_id_ref')+'</b>' ;
				}
				if( r.get('letter_node') ) {
					return '<b>'+r.get('letter_code')+'</b>' ;
				}
				return r.get('record_ref') ;
			}
		},{
			hidden: true,
			text: 'ID',
			dataIndex: 'record_id',
			width: 120
		},{
			hidden: true,
			text: 'Libellé',
			dataIndex: 'record_txt',
			width: 120
		},{
			text: 'Date',
			dataIndex: 'record_date',
			align: 'center',
			width: 90,
			renderer: Ext.util.Format.dateRenderer('d/m/Y')
		},{
			hidden: true,
			text: 'Echeance',
			dataIndex: 'record_datevalue',
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
				if( r.get('letter_node') ) {
					if( r.get('letter_is_confirm') ) {
						if( v==0 ) {
							return '' ;
						} else {
							return '<i>'+v+'</i>' ;
						}
					} else {
						return '<b>'+v+'</b>' ;
					}
				}
				return v ;
			}
		},{
			text: 'EnDevise',
			dataIndex: 'record_xe_currency_amount',
			align: 'right',
			width: 90,
			renderer: function( v, meta, r ) {
				if( !Ext.isEmpty(r.get('file_id_ref')) ) {
					return '' ;
				}
				if( Ext.isNumber(v) && !Ext.isEmpty(r.get('record_xe_currency_sign')) ) {
					v = Ext.util.Format.number(v,'0,000.00') ;
					v += '&#160;' ;
					v += r.get('record_xe_currency_sign') ;
					return v ;
				}
				return '' ;
			}
		},{
			hidden: true,
			text: 'Integr.',
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
			text: 'Lettrage',
			dataIndex: 'record_letter_code',
			align: 'left',
			width: 100,
			renderer: function(v,m,r) {
				if( Ext.isEmpty(r.get('record_letter_code')) ) {
					return '' ;
				}
				if( r.get('record_letter_is_confirm') ) {
					m.tdCls += ' op5-spec-rsiveo-recordstree-letter-green ' ;
				} else {
					m.tdCls += ' op5-spec-rsiveo-recordstree-letter-orange ' ;
				}
				return v ;
			}
		}] ;
		Ext.Array.each( atrRecColumns, function(atrRecColumn) {
			treeColumns.push(atrRecColumn) ;
		}) ;


		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				hidden: true,
				itemId: 'tbNotifications',
				icon: 'images/op5img/ico_warning_16.gif',
				cls: 'op5-spec-rsiveo-button-red',
				text: 'Notifications',
				menu: [],
				handler: function(){
					this.openNotifications() ;
				},
				scope: this
			},'->',{
				itemId: 'detailExport',
				icon: 'images/modules/rsiveo-fetch-16.gif',
				text: 'Exporter',
				handler: function(){
					this.handleDownload() ;
				},
				scope: this
			},{
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
				},'-',{
					iconCls: 'op5-spec-rsiveo-action-mailout',
					text: 'Courrier postal',
					handler: function() {
						this.handleNewAction('MAIL_OUT',{adrpost_default: true}) ;
					},
					scope: this
				},{
					iconCls: 'op5-spec-rsiveo-action-mailout',
					text: 'SMS',
					handler: function() {
						this.handleNewAction('SMS_OUT',{adrpost_default: true}) ;
					},
					scope: this
				},{
					iconCls: 'op5-spec-rsiveo-action-mailout',
					text: 'E-mail',
					handler: function() {
						this.handleNewAction('EMAIL_OUT',{adrpost_default: true}) ;
					},
					scope: this
				},'-',{
					iconCls: 'op5-spec-rsiveo-action-mailout',
					text: 'Envoi hors scénario',
					handler: function() {
						this.handleNewAction('MAIL_AUTO') ;
					},
					scope: this
				}]
			}],
			items:[{
				flex: 1,
				title: 'Contact',
				tools: [{
					type: 'save',
					handler: function() {
						this.handleSaveHeader() ;
					},
					scope: this
				}],
				collapsible: true,
				titleCollapse: false,
				collapseDirection: 'left',
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				border: false,
				items: [{
					flex: 1,
					scrollable: 'vertical',
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
									this.handleNewAction('SMS_OUT',formParams) ;
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
			},{xtype: 'splitter', cls: 'op5-spec-rsiveo-splitter'},{
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
				},'-',{
					xtype: 'checkbox',
					boxLabel: 'Grouper lettrages',
					itemId: 'chkShowLetterGroup',
					hideLabel: true,
					margin: '0 10 0 10',
					inputValue: 'true',
					value: 'false',
					listeners: {
						change: function (cb, newValue, oldValue) {
							this._showLetterGroup = newValue ;
							this.doReload();
						},
						scope: this
					}
				}],
				flex: 1,
				bodyCls: 'ux-noframe-bg',
				title: 'Factures',
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
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_nb_open}</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Encours total:</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_due}&#160;€</td>',
									'</tr>',
									'<tr>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Encours overdue :</td>',
										'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{inv_amount_due_over}&#160;€</td>',
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
							var parentNode = r ;
							while( parentNode.parentNode && !parentNode.parentNode.isRoot() ) {
								parentNode = parentNode.parentNode ;
							}
							if( parentNode.get('new_is_on') ) {
								return 'op5-spec-rsiveo-pom' ;
							}
							if( parentNode.get('file_focus') ) {
								return 'op5-spec-rsiveo-pis' ;
							}
						},
						plugins: {
							ptype: 'treeviewdragdrop',
							ddGroup: 'RsiRecouveoFileDetailRecordsTreeDD',
							dragText: 'Glisser factures pour ajouter au dossier',
							appendOnly: true,
							containerScroll: true
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
							hidden: Ext.Array.contains(disabledActions,'AGREE_START'),
							iconCls: 'op5-spec-rsiveo-action-agree',
							text: 'Promesse règlement',
							handler: function() {
								this.doCreateFile('AGREE_START') ;
							},
							scope: this
						},{
							hidden: Ext.Array.contains(disabledActions,'LITIG_START'),
							iconCls: 'op5-spec-rsiveo-action-litig',
							text: 'Demande d\'action externe',
							handler: function() {
								this.doCreateFile('LITIG_START') ;
							},
							scope: this
						},{
							hidden: Ext.Array.contains(disabledActions,'JUDIC_START'),
							iconCls: 'op5-spec-rsiveo-action-litig',
							text: 'Action judiciaire',
							handler: function() {
								this.doCreateFile('JUDIC_START') ;
							},
							scope: this
						},{
							hidden: Ext.Array.contains(disabledActions,'TRSFR_START'),
							iconCls: 'op5-spec-rsiveo-action-litig',
							text: 'Transmission Recouveo',
							handler: function() {
								this.doCreateFile('TRSFR_START') ;
							},
							scope: this
						},{
							hidden: Ext.Array.contains(disabledActions,'CLOSE_ASK'),
							iconCls: 'op5-spec-rsiveo-action-close',
							text: 'Demande de clôture',
							handler: function() {
								this.doCreateFile('CLOSE_ASK') ;
							},
							scope: this
						}]
					},'->',{
						hidden: !Ext.isEmpty(Optima5.Modules.Spec.RsiRecouveo.HelperCache.getMetagenValue('gen_uimode_saas')),
						itemId: 'tbRecordTemp',
						icon: 'images/modules/rsiveo-quickopen-16.png',
						text: '<b>Ajustement comptable temporaire</b>',
						handler: function() {
							this.handleCreateRecord() ;
						},
						scope: this
					}]
				}]
			},{xtype: 'splitter', cls: 'op5-spec-rsiveo-splitter'},{
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
				tools: [{
					type: 'plus',
					handler: function() {
						var activePanel = this.down('#tpFileActions').getActiveTab() ;
						if( activePanel ) {
							activePanel.getPlugin('rowexpander').expandAll() ;
						}
					},
					scope: this
				},{
					type: 'minus',
					handler: function() {
						var activePanel = this.down('#tpFileActions').getActiveTab() ;
						if( activePanel ) {
							activePanel.getPlugin('rowexpander').collapseAll() ;
						}
					},
					scope: this
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
			msg: RsiRecouveoLoadMsg.loadMsg
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
				filter_atr: Ext.JSON.encode(filterAtr),
				filter_archiveIsOff: (this._showClosed ? 0 : 1),
				_similar: 1
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
		var socRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getSocRowId(socId),
			xeCurrencyCol = this.down('#pRecordsPanel').down('#pRecordsTree').headerCt.down('[dataIndex="record_xe_currency_amount"]') ;
		xeCurrencyCol.setVisible( socRow.soc_xe_currency ) ;
		
		
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds([socId]), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		this.down('#pHeaderForm').getForm().getFields().each( function(field) {
			if( field.cfgParam_id && field.cfgParam_id.indexOf('ATR:')===0 ) {
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
		
		
		//btnSimilar
		var btnSimilar = this.down('#pHeaderForm').down('#btnSimilar'),
			btnSimilarBtn = btnSimilar.down('button') ;
		btnSimilar.setVisible( accountRecord.similar().getCount()>0 ) ;
		
		
		this.down('#tpFileActions').removeAll() ;
		accountRecord.files().each( function(fileRecord) {
			if( fileRecord.statusIsSchedLock() ) {
				// DONE 18/02 on ne masque que les schedlock
				if( fileRecord.get('status_closed_void') ) {
					return ;
				}
				if( fileRecord.get('status_closed_end') && !this._showClosed ) {
					return ;
				}
			}
			if( fileRecord.statusIsSchedNone() ) {
				this.onLoadAccountAddFilePreActions( fileRecord, accountRecord ) ;
				return ;
			}
			this.onLoadAccountAddFileActions( fileRecord, accountRecord ) ;
		},this) ;
		
		
		var inv_nb_open = 0, inv_amount_open = 0, inv_amount_due = 0, inv_amount_due_over = 0 ;
		accountRecord.files().each( function(fileRecord) {
			inv_nb_open += fileRecord.get('inv_nb_open') ;
			inv_amount_open += fileRecord.get('inv_amount_open') ;
			inv_amount_due += fileRecord.get('inv_amount_due') ;
			inv_amount_due_over += fileRecord.get('inv_amount_due_over') ;
		},this) ;
		this.down('#pRecordsHeader').setData({
			inv_nb_open: inv_nb_open,
			inv_amount_open: Ext.util.Format.number(inv_amount_open,'0,000.00'),
			inv_amount_due: Ext.util.Format.number(inv_amount_due,'0,000.00'),
			inv_amount_due_over: Ext.util.Format.number(inv_amount_due_over,'0,000.00')
		});
		this.down('#pRecordsHeader').setVisible(true) ;
		
		
		var balageRecData = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageRecData[balageField] = 0 ;
		}) ;
		accountRecord.files().each( function(fileRecord) {
			fileRecord.records().each( function(fileRecordRecord) {
				if( fileRecordRecord.get('letter_is_confirm') ) {
					return ;
				}
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
		
		this.down('toolbar').down('#tbNotifications').setVisible(false) ;
		if( accountRecord.notifications().getCount() > 0 ) {
			this.down('toolbar').down('#tbNotifications').setVisible(true) ;
			this.openNotifications() ;
		}
		
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
		
		adrbookTree.setRootNode({root:true, children:[]}) ;
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
			var map_letterCode_records = {} ;
			fileRecord.records().each( function(fileRecordRecord) {
				var recordIcon = undefined ;
				if( fileRecordRecord.get('notification_is_on') ) {
					recordIcon = 'images/op5img/ico_warning_16.gif' ;
				} else if( !Ext.isEmpty(fileRecordRecord.get('type')) ) {
					recordIcon = 'images/modules/rsiveo-quickopen-16.png' ;
				} else {
					recordIcon = undefined ;
				}
				var record={
					leaf: true,
					icon: recordIcon,
					record_filerecord_id: fileRecordRecord.getId(),
					record_id: fileRecordRecord.get('record_id'),
					record_ref: fileRecordRecord.get('record_ref'),
					record_txt: fileRecordRecord.get('record_txt'),
					record_date: fileRecordRecord.get('date_record'),
					record_datevalue: fileRecordRecord.get('date_value'),
					record_dateload: fileRecordRecord.get('date_load'),
					record_amount: fileRecordRecord.get('amount'),
					record_xe_currency_amount: fileRecordRecord.get('xe_currency_amount'),
					record_xe_currency_sign: fileRecordRecord.get('xe_currency_sign'),
					record_letter_code: fileRecordRecord.get('letter_code'),
					record_letter_is_confirm: fileRecordRecord.get('letter_is_confirm'),
					record_type: fileRecordRecord.get('type'),
					record_readonly: (Ext.isEmpty(fileRecordRecord.get('type_temprec')) || fileRecordRecord.get('bank_is_alloc'))
				};
				Ext.Array.each(atrRecFields, function(atrRecField) {
					record[atrRecField] = fileRecordRecord.get(atrRecField) ;
				});
				
				var letterCode = fileRecordRecord.get('letter_code'),
					letterIsConfirm = fileRecordRecord.get('letter_is_confirm');
				if( !letterIsConfirm ) {
					totAmountDue += fileRecordRecord.get('amount') ;
				}
				if( letterIsConfirm && !this._showClosed ) {
					return ;
				}
				if( Ext.isEmpty(letterCode) || !this._showLetterGroup ) {
					pRecordsTreeChildrenRecords.push(record) ;
					return ;
				}
				
				if( this._showLetterGroup ) {
					if( !map_letterCode_records.hasOwnProperty(letterCode) ) {
						map_letterCode_records[letterCode] = [] ;
					}
					map_letterCode_records[letterCode].push( record ) ;
					return ;
				}
				
				
			},this) ;
			
			Ext.Object.each( map_letterCode_records, function(letterCode, records) {
				var letterSum = 0,
					letterIsConfirm = records[0].record_letter_is_confirm ;
				Ext.Array.each(records, function(rec) {
					letterSum += rec.record_amount ;
				}) ;
				pRecordsTreeChildrenRecords.push({
					icon: (letterIsConfirm ? 'images/op5img/ico_greendot.gif' : 'images/op5img/ico_orangedot.gif'),
					letter_node: true,
					letter_code: letterCode,
					letter_is_confirm: letterIsConfirm,
					record_amount: letterSum,
					
					expanded: true,
					children: records,
					leaf: false
				}) ;
			}) ;
			
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
	onLoadAccountAddFilePreActions: function( fileRecord, accountRecord ) {
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
			arr_filesubFilerecordId = [],
			map_filesubFilerecordId_datevalue = {},
			map_filesubFilerecordId_actions = {},
			map_filesubFilerecordId_records = {},
			map_filesubFilerecordId_recordsCount = {},
			map_filesubFilerecordId_recordsSum = {} ;
		fileRecord.filesubs().sort({
			property: 'filesub_datevalue',
			direction: 'ASC'
		}) ;
		fileRecord.filesubs().each( function(filesubRecord) {
			var filesubFilerecordId = filesubRecord.get('filesub_filerecord_id') ;
			map_filesubFilerecordId_datevalue[filesubFilerecordId] = filesubRecord.get('filesub_datevalue') ;
			
			arr_filesubFilerecordId.push(filesubFilerecordId) ;
		},this) ;
		fileRecord.actions().each( function(fileactionRecord) {
			var filesubFilerecordId = fileactionRecord.get('link_filesub_filerecord_id') ;
			if( !map_filesubFilerecordId_actions.hasOwnProperty(filesubFilerecordId) ) {
				map_filesubFilerecordId_actions[filesubFilerecordId] = [] ;
			}
			map_filesubFilerecordId_actions[filesubFilerecordId].push(fileactionRecord.getData()) ;
		},this) ;
		fileRecord.records().each( function(recordRecord) {
			var filesubFilerecordId = recordRecord.get('link_filesub_filerecord_id') ;
			if( !map_filesubFilerecordId_records.hasOwnProperty(filesubFilerecordId) ) {
				map_filesubFilerecordId_records[filesubFilerecordId] = [] ;
				map_filesubFilerecordId_recordsCount[filesubFilerecordId] = 0 ;
				map_filesubFilerecordId_recordsSum[filesubFilerecordId] = 0 ;
			}
			map_filesubFilerecordId_records[filesubFilerecordId].push(recordRecord.getData()) ;
			map_filesubFilerecordId_recordsCount[filesubFilerecordId]++ ;
			map_filesubFilerecordId_recordsSum[filesubFilerecordId] += recordRecord.get('amount') ;
		},this) ;
		
		
		
		console.dir(arr_filesubFilerecordId) ;
		console.dir(map_filesubFilerecordId_datevalue) ;
		console.dir(map_filesubFilerecordId_actions) ;
		console.dir(map_filesubFilerecordId_records) ;
		console.dir(map_filesubFilerecordId_recordsCount) ;
		console.dir(map_filesubFilerecordId_recordsSum) ;
		
		
		Ext.Array.each( arr_filesubFilerecordId, function(filesubFilerecordId) {
			if( !map_filesubFilerecordId_actions.hasOwnProperty(filesubFilerecordId) ) {
				return ;
			}
			if( !map_filesubFilerecordId_records.hasOwnProperty(filesubFilerecordId) ) {
				return ;
			}
			var actions = map_filesubFilerecordId_actions[filesubFilerecordId] ;
			
			Ext.Array.sort( actions, function(o1,o2) {
				var d1 = o1.status_is_ok ? o1.date_actual : o1.date_sched ;
				var d2 = o2.status_is_ok ? o2.date_actual : o2.date_sched ;
				return (d1<d2) ;
			}) ;
			Ext.Array.each( actions, function(o) {
				if( !o.status_is_ok ) {
					o.is_next = true ;
					return false ;
				}
			}) ;
			
			var pSubfileActions = [] ;
			Ext.Array.each( actions, function(actionRow) {
				Ext.apply( actionRow, {
					leaf: true,
					icon: Ext.BLANK_IMAGE_URL
				}) ;
				pSubfileActions.push(actionRow) ;
			},this) ;
			
			pActionsGridData.push({
				link_status: 'S0_PRE',
				link_action: 'BUMP',
				
				date_actual: map_filesubFilerecordId_datevalue[filesubFilerecordId],
				status_is_ok: true,
				
				txt_short: 'Mnt:&nbsp;'+Math.round(map_filesubFilerecordId_recordsSum[filesubFilerecordId])+'&nbsp;€&nbsp;/&nbsp;Nb:&nbsp;'+map_filesubFilerecordId_recordsCount[filesubFilerecordId],
				
				leaf: false,
				icon: Ext.BLANK_IMAGE_URL,
				expanded: true,
				expandable: false,
				children: pSubfileActions
			}) ;
			
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
			_actionEtaMap: actionEtaMap,
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
					width: 48,
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						var outValue ;
						var vStatus = record.get('link_status'),
							vAction = record.get('link_action'),
							vTag = record.get('scenstep_tag') ;
						var statusMap = view.up('panel')._statusMap ;
						if( statusMap.hasOwnProperty(vStatus) ) {
							var statusData = statusMap[vStatus] ;
							metaData.style += '; background: '+statusData.status_color ;
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
						if( record.getDepth() == 2 ) {
							if( record.get('status_is_ok') ) {
								metaData.tdCls += ' op5-spec-rsiveo-doaction-ok' ;
							} else if( record.get('is_next') ) {
								metaData.tdCls += ' op5-spec-rsiveo-doaction' ;
							} else {
								metaData.tdCls += ' op5-spec-rsiveo-doaction-wait' ;
							}
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
								metaData.style += '; background: '+actionEtaData.eta_color ;
							}
						}
						var str = Ext.Date.format(Ext.Date.parse(value,'Y-m-d'),'d/m/y') ;
						if( record.getDepth() == 1 ) {
							metaData.style += 'font-weight: bold ; color: blue' ;
						}
						return str ;
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
								case 'MAIL_OUT' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailout' ;
									break dance ;
								default :
									break ;
							}
							break ;
						}
						return '' ;
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
						tooltip: 'Vue PDF',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('link_env_filerecord_id') ) {
								this.openEnvelope(rec.get('link_env_filerecord_id')) ;
							}
							switch( rec.get('link_media_file_code') ) {
								case 'IN_POSTAL' :
									this.openMedia(rec.get('link_media_file_code'),rec.get('link_media_filerecord_id')) ;
									break ;
								default :
									break ;
							}
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							var passed = false ;
							if( record.get('link_env_filerecord_id') ) {
								passed = true ;
							}
							switch( record.get('link_media_file_code') ) {
								case 'IN_POSTAL' :
									passed = true ;
									break ;
								default :
									break ;
							}
							return !passed ;
						}
					},{
						icon: 'images/modules/rsiveo-mail-email-16.png',
						tooltip: 'Email',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('link_media_file_code') == 'EMAIL' ) {
								var emailFilerecordId = rec.get('link_media_filerecord_id') ;
								this.openEmail(emailFilerecordId) ;
							}
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							var passed = false ;
							switch( record.get('link_media_file_code') ) {
								case 'EMAIL' :
									passed = true ;
									break ;
								default :
									break ;
							}
							return !passed ;
						}
					}]
				}]
			},
			viewConfig: {
				enableTextSelection: true,
				getRowClass: function(record) {
					if( record.getDepth() == 2 ) {
						return 'op5-spec-rsiveo-actionstree-depth2' ;
					}
				}
			},
			store: {
				model: 'RsiRecouveoFileActionPreModel',
				root: {root: true, fileaction_filerecord_id:0, expanded: true, children:pActionsGridData},
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
			iteratedFilerecordIds = [],
			iterateFileRecord = fileRecord ;
		while(true) {
			var isMainFile = (fileRecord.getId() == iterateFileRecord.getId()) ;
			iteratedFilerecordIds.push( iterateFileRecord.getId() ) ;
			iterateFileRecord.actions().each(function(rec) {
				var recData = rec.getData() ;
				recData['file_filerecord_id'] = iterateFileRecord.getId() ;
				recData['file_id_ref'] = iterateFileRecord.get('id_ref') ;
				
				recData['leaf'] = true ;
				recData['icon'] = Ext.BLANK_IMAGE_URL ;
				if( rec.get('link_newfile_filerecord_id') ) {
					if( Ext.Array.contains(iteratedFilerecordIds,rec.get('link_newfile_filerecord_id')) ) {
						// Fichier déjà examiné en itération chaine => pas de parcours parent<>child, éviter "loop"
						return ;
					}
					var childFileRecord = this._accountRecord.files().getById(rec.get('link_newfile_filerecord_id')),
						childrenActions = [],
						childrenFirst = true ;
					if( !childFileRecord.get('status_closed_void') && !childFileRecord.get('status_closed_end') ) {
						// on ne parcourt en parent<>child que les fichiers fermés
						return ;
					}
					childFileRecord.actions().each(function(cRec) {
						if( childrenFirst ) {
							Ext.apply( recData, cRec.getData() ) ;
							childrenFirst = false ;
							return ;
						}
						var cRecData = cRec.getData() ;
						if( cRecData.link_agree && cRecData.link_agree.milestone_cancel ) {
							return ;
						}
						cRecData['leaf'] = true ;
						cRecData['icon'] = Ext.BLANK_IMAGE_URL ;
						childrenActions.push(cRecData) ;
					}) ;
					recData['leaf'] = false ;
						recData['file_filerecord_id'] = childFileRecord.getId() ;
						recData['file_id_ref'] = childFileRecord.get('id_ref') ;
					recData['children'] = childrenActions ;
					recData['expanded'] = true ;
					recData['expandable'] = false ;
					recData['icon'] = Ext.BLANK_IMAGE_URL ;
				}
				if( !isMainFile && !rec.get('status_is_ok') ) {
					return ;
				}
				if( isMainFile && !rec.get('status_is_ok')
						&& rec.get('fileaction_filerecord_id') != iterateFileRecord.get('next_fileaction_filerecord_id') ) {
					return ;
				}
				pActionsGridData.push(recData) ;
			},this) ;
			if( (iterateFileRecord.get('from_file_filerecord_id') > 0) && accountRecord.files().getById(iterateFileRecord.get('from_file_filerecord_id')) ) {
				iterateFileRecord = accountRecord.files().getById(iterateFileRecord.get('from_file_filerecord_id')) ;
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
			plugins: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailRowExpander',{
				pluginId: 'rowexpander',
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
							metaData.style += '; background: '+statusData.status_color ;
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
						} else if( record.get('notification_is_on') ) {
							metaData.tdCls += ' op5-spec-rsiveo-notification' ;
						}
						
						return outValue ;
					}
				},{
					text: 'Date',
					align: 'center',
					width: 80,
					dataIndex: 'calc_date',
					renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
						var lateStr = null ;
						if( !record.get('status_is_ok') ) {
							var etaValue = record.get('calc_eta_range') ;
							var actionEtaMap = view.up('panel')._actionEtaMap ;
							if( actionEtaMap.hasOwnProperty(etaValue) ) {
								var actionEtaData = actionEtaMap[etaValue] ;
								metaData.style += '; background: '+actionEtaData.eta_color ;
							}
						} else if( record.get('date_sched') 
								&& Ext.util.Format.date(record.get('date_sched'),'Y-m-d') < Ext.util.Format.date(record.get('date_actual'),'Y-m-d') ) {
							//metaData.style += 'font-weight: bold ; color: red' ;
							lateStr = Math.abs( Ext.Date.diff( record.get('date_sched'), record.get('date_actual'), Ext.Date.DAY ) );
						}
						var str = Ext.Date.format(Ext.Date.parse(value,'Y-m-d'),'d/m/y') ;
						if( lateStr > 1 ) {
							metaData.style += 'font-weight: bold ; color: red' ;
							str += '<br>'+'J+'+lateStr
						}
						return str ;
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
								case 'EMAIL_OUT' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailout' ;
									break dance ;
								case 'EMAIL_IN' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-mailin' ;
									break dance ;
								case 'SMS_OUT' :
									metaData.tdCls += ' op5-spec-rsiveo-mail-sms' ;
									break dance ;
								default :
									break ;
							}
							switch( vStatus ) {
								case 'S2L_JUDIC' :
									metaData.tdCls += ' op5-spec-rsiveo-actiontree-judic' ;
									break dance ;
									
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
						tooltip: 'Vue PDF',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('link_env_filerecord_id') ) {
								this.openEnvelope(rec.get('link_env_filerecord_id')) ;
							}
							switch( rec.get('link_media_file_code') ) {
								case 'IN_POSTAL' :
									this.openMedia(rec.get('link_media_file_code'),rec.get('link_media_filerecord_id')) ;
									break ;
								default :
									break ;
							}
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							var passed = false ;
							if( record.get('link_env_filerecord_id') ) {
								passed = true ;
							}
							switch( record.get('link_media_file_code') ) {
								case 'IN_POSTAL' :
									passed = true ;
									break ;
								default :
									break ;
							}
							return !passed ;
						}
					},{
						icon: 'images/modules/rsiveo-mail-email-16.png',
						tooltip: 'Email',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('link_media_file_code') == 'EMAIL' ) {
								var emailFilerecordId = rec.get('link_media_filerecord_id') ;
								this.openEmail(emailFilerecordId) ;
							}
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							var passed = false ;
							switch( record.get('link_media_file_code') ) {
								case 'EMAIL' :
									passed = true ;
									break ;
								default :
									break ;
							}
							return !passed ;
						}
					},{
						icon: 'images/modules/rsiveo-bookmark-16.png',
						tooltip: 'Echéancier',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							if( rec.get('link_action') == 'AGREE_START' ) {
								this.openAgreeCompare(rec.get('file_filerecord_id'),rec.get('file_id_ref')) ;
							}
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							var passed = false ;
							switch( record.get('link_action') ) {
								case 'AGREE_START' :
									passed = true ;
									break ;
								default :
									break ;
							}
							return !passed ;
						}
					}]
				}]
			},
			viewConfig: {
				enableTextSelection: true,
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
  handleDownload: function() {
    var fileID = this._accountRecord.get('acc_id');

    var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'xls_createDetailPanel',
      _fileID: Ext.JSON.encode(fileID),
			exportXls: true
		}) ;
    Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;


  },
	doReload: function(focusFileFilerecordId) {
		if( !focusFileFilerecordId ) {
			focusFileFilerecordId = this.getActiveFileId() ;
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
		this.down('toolbar').down('#tbBump').setDisabled( fileRec.statusIsSchedNone() )  ;
		this.down('toolbar').down('#tbNew').setDisabled( fileRec.statusIsSchedNone() )  ;
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
			case 'EMAIL_OUT' :
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
		if( tempRec && tempRecIds.length>0 && !overModel.get('new_is_on') && (overModel.get('file_filerecord_id')>0) && dropPosition == 'append' ) {
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
		var adrbookPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',{
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
		
		adrbookPanel.on('saved',function() {
			this.doReload() ;
		},this) ;
		adrbookPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.adrbookPanel = null ;
		},this,{single:true}) ;
		
		this.getEl().mask() ;
		
		adrbookPanel.on('mylayout', function(adrbookPanel) {
			adrbookPanel.updateLayout() ;
			adrbookPanel.setSize( adrbookPanel.getWidth() , adrbookPanel.getHeight() ) ;
			adrbookPanel.getEl().alignTo(this.getEl(), 'c-c?');
		},this) ;
		adrbookPanel.getEl().alignTo(this.getEl(), 'c-c?');
		adrbookPanel.show();
		this.adrbookPanel = adrbookPanel ;
	},
	
	onBeforeDestroy: function() {
		if( this.adrbookPanel ) {
			this.adrbookPanel.destroy() ;
		}
		if( this.emailWindow ) {
			this.emailWindow.destroy() ;
		}
		if( this.notificationsPanel ) {
			this.notificationsPanel.destroy() ;
		}
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
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.AgreeComparePanel ) {
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
		if( p instanceof Optima5.Modules.Spec.RsiRecouveo.AgreeComparePanel ) {
			return 'op5-spec-rsiveo-actionclass-file' ;
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
			title: title,
			items: p,
			
			iconCls: this.getFloatingPanelIconCls(p),
			
			renderTo: this.getEl(),
			constrain: true,
			
			//layout: 'fit',
			overflowY: 'scroll',
			bodyPadding: '0 16px 0 0',
			
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
		
		p.on('resize', function(p) {
			if( p.win.getHeight() > this.getHeight() ) {
				p.win.setHeight(this.getHeight()) ;
			}
		},this) ;
		
		win.on('boxready', function(w) {
			w.getEl().alignTo(dockPanel.getEl(), 'br-br?', [-6, -6]);
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
		btn.win.getEl().alignTo(dockPanel.getEl(), 'br-br?', [-6, -6]);
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
	openMedia: function(mediaFileCode, mediaFilerecordId) {
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: 'Visualisation',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',{
				optimaModule: this.optimaModule,
				_mediaFileCode: mediaFileCode,
				_mediaFilerecordId: mediaFilerecordId
			})]
		}) ;
	},
	
	openEmail: function(emailFilerecordId) {
		this.emailWindow = this.optimaModule.createWindow({
			width:600,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: 'Email',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailMessagePanel',{
				optimaModule: this.optimaModule,
				_emailFilerecordId: emailFilerecordId,
				_modeReuse: true,
				listeners: {
					emailaction: this.onEmailAction,
					destroy: function() {
						this.emailWindow = null ;
					},
					scope: this
				}
			})]
		}) ;
	},
	onEmailAction: function(emailMessagePanel,emailRecord,emailAction) {
		if( !emailRecord ) {
			return ;
		}
		var activePanel = this.down('#tpFileActions').getActiveTab(),
			fileRecord = this._accountRecord.files().getById(activePanel._fileFilerecordId) ;
		if( this.emailWindow ) {
			this.emailWindow.destroy() ;
		}
		
		switch( emailAction ) {
			case 'reply' :
			case 'reply_all' :
			case 'transfer' :
				this.doNewAction(fileRecord, 'EMAIL_OUT', true, {
					reuse_emailFilerecordId: emailRecord.get('email_filerecord_id'),
					reuse_action: emailAction
				}) ;
				break ;
		}
	},
	
	openAgreeCompare: function(fileFilerecordId,fileRef) {
		if( this._readonlyMode ) {
			return ;
		}
		var postParams = {} ;
		var actionPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.AgreeComparePanel',{
			optimaModule: this.optimaModule,
			
			_accId: this._accountRecord.get('acc_id'),
			_fileFilerecordId: fileFilerecordId,
			
			width:900, 
			height:400,
			/*
			floating: true,
			draggable: true,
			resizable: true,
			*/
			//renderTo: this.getEl(),
			title: 'Echéancier '+fileRef
		});
		
		this.addFloatingPanel(actionPanel) ;
	},
	
	handleSaveHeader: function() {
		var values = this.down('#pHeaderForm').getForm().getFieldValues() ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_saveHeader',
				acc_id: this._accountRecord.get('acc_id'),
				data: Ext.JSON.encode(values)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
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
	},
	
	openNotifications: function() {
		if( !this._accountRecord ) {
			return ;
		}
		if( this.notificationsPanel ) {
			this.notificationsPanel.destroy() ;
		}
		
		var notificationsData = [] ;
		this._accountRecord.notifications().each( function(rec) {
			notificationsData.push(rec.getData()) ;
		}) ;
		
		var notificationsPanel = Ext.create('Ext.grid.Panel',{
			optimaModule: this.optimaModule,
			
			title: 'Notifications',
			
			store: {
				model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getNotificationModel(),
				data: notificationsData,
				proxy: {
					type: 'memory'
				}
			},
			columns: [{
				width: 36,
				renderer: function(v,m,r) {
					m.tdCls += ' op5-spec-rsiveo-notification' ;
				}
			},{
				width: 110,
				xtype: 'datecolumn',
				format: 'd/m/Y',
				dataIndex: 'date_notification'
			},{
				flex:1,
				dataIndex: 'txt_notification'
			}],
			hideHeaders: true,
			
			bbar: [{
				text: 'Effacer notifications',
				icon: 'images/op5img/ico_delete_16.gif',
				handler: function() {
					this.clearNotifications() ;
				},
				scope: this
			}],
			
			frame: true,
			
			width:400, 
			height:250,
			floating: true,
			draggable: false,
			resizable: false,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy() ;
				},
				scope: this
			}]
		});
		
		notificationsPanel.on('destroy',function(p) {
			this.notificationsPanel = null ;
		},this,{single:true}) ;
		
		notificationsPanel.getEl().alignTo(this.getEl(), 'tl-tl?');
		notificationsPanel.show();
		this.notificationsPanel = notificationsPanel ;
	},
	clearNotifications: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_clearNotifications',
				acc_id: this._accId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					this.hideLoadmask() ;
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				if( this.notificationsPanel ) {
					this.notificationsPanel.destroy() ;
				}
				this.doReload() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	
	doOpenAccSimilar: function(confirmed=false) {
		if( !this._accountRecord || this._accountRecord.similar().getCount()==0 ) {
			return ;
		}
		if( !confirmed ) {
			Ext.MessageBox.confirm('Comptes associés','Ouvrir les comptes associés ?<br>(Ouverture dans nouveaux onglets)',function(btn) {
				if( btn=='yes' ) {
					this.doOpenAccSimilar(true) ;
				}
			},this) ;
			return ;
		}
		this._accountRecord.similar().each( function(altAccRecord) {
			var accId = altAccRecord.get('acc_id') ;
			this.optimaModule.postCrmEvent('openaccount',{
				accId:accId,
				showClosed: false
			}) ;
		},this) ;
	}
}) ; 
