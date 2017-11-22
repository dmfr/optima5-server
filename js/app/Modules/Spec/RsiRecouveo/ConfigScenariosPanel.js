Ext.define('RsiRecouveoConfigScenarioStepEditModel',{
	extend: 'RsiRecouveoConfigScenarioStepModel',
	fields: [
		{name:'_phantom', type:'boolean'}
	]
});


Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigScenarioMailField',{
	extend: 'Ext.view.View',
	mixins: ['Ext.form.field.Field'],
	
	alias: 'widget.op5specrsiveomailfield',
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			cls: 'op5-spec-rsiveo-mailfield',
			style: {
				whiteSpace: 'nowrap'
			},
			tpl:[
				'<tpl for=".">',
					'<div class="op5-spec-rsiveo-mailthumb op5-spec-rsiveo-mailthumb-icon {sel_class} {thumb_class}">',
					'</div>',
				'</tpl>'
			],
			trackOver: true,
			overItemCls: 'x-item-over',
			selectedItemCls: '',
			itemSelector: 'div.op5-spec-rsiveo-mailthumb',
			store: {
				fields: ['mail_mode','mail_cls','is_selected'],
				data: [
					{mail_mode:'postal_std',mail_cls:'op5-spec-rsiveo-mail-postal-std'},
					{mail_mode:'postal_rar',mail_cls:'op5-spec-rsiveo-mail-postal-rar'},
					{mail_mode:'tel',mail_cls:'op5-spec-rsiveo-mail-sms'},
					{mail_mode:'email',mail_cls:'op5-spec-rsiveo-mail-email'}
				],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			listeners: {
			},
			selModel: {
				mode: 'MULTI'
			},
			prepareData: function(data) {
				Ext.apply(data, {
					sel_class: ( data.is_selected ? 'op5-spec-rsiveo-actionthumb-select' : '' ),
					thumb_class: data.mail_cls
				});
				return data;
			},
			listeners: {
				itemclick: this.onMyItemClick,
				selectionchange: this.onSelectionChange,
				scope: this
			}
		}) ;
		me.callParent() ;
		me.mixins.field.constructor.call(me);
	},
	doLoad: function(scenCode) {
	},
	onLoadScenarioLine: function( scenarioData ) {
		this.getStore().loadData(scenarioData) ;
		this.setScrollable('horizontal') ;
	},
	setFirstSelection: function() {
		
	},
	onMyItemClick: function(view,record) {
		record.set('is_selected',!record.get('is_selected')) ;
		if( record.get('mail_mode')=='postal_std' && record.get('is_selected') ) {
			view.getStore().findRecord('mail_mode','postal_rar').set('is_selected',false) ;
		}
		if( record.get('mail_mode')=='postal_rar' && record.get('is_selected') ) {
			view.getStore().findRecord('mail_mode','postal_std').set('is_selected',false) ;
		}
		this.value = this.getJsonValue() ;
	},
	onSelectionChange: function(selModel, records) {
		
	},
	isEqual: function(value1, value2) {
		return ( value1 === value2 );
	},
	setReadOnly: function(readOnly) {
		this.getSelectionModel().setLocked(readOnly) ;
	},
	getJsonValue: function() {
		var data = [] ;
		this.getStore().each( function(rec) {
			if( rec.get('is_selected') ) {
				data.push(rec.get('mail_mode')) ;
			}
		}) ;
		return Ext.JSON.encode(data) ;
	},
	getValue: function() {
		return this.getJsonValue() ;
	},
	getRawValue: function() {
		return this.getJsonValue() ;
	},
	setRawValue: function(val) {
		this.setJsonValue(val) ;
	},
	setValue: function(val) {
		this.setJsonValue(val) ;
	},
	setJsonValue: function(val) {
		val = Ext.JSON.decode(val,true) || [] ;
		this.getStore().each( function(rec) {
			if( Ext.Array.contains(val,rec.get('mail_mode')) ) {
				rec.set('is_selected',true) ;
			} else {
				rec.set('is_selected',false) ;
			}
		}) ;
	}
});


Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigScenariosPanel', {
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		
		var atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
		},this) ;
		
		var directActions = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(actionRow) {
			if( actionRow.is_next && actionRow.is_next_sched ) {
				directActions.push(actionRow) ;
			}
		}) ;
		var actionMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
			actionMap[action.action_id] = action ;
		}) ;
		
		var templateMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getTemplateAll(), function(template) {
			templateMap[template.tpl_id] = template ;
		}) ;
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				tbar: [{
					itemId: 'tbNew',
					icon: 'images/modules/rsiveo-useradd-16.gif',
					text: 'Nouveau...',
					handler: function() {
						this.handleScenNew();
					},
					scope: this
				}],
				xtype: 'grid',
				width: 190,
				itemId: 'gridScenarios',
				columns: [{
					flex: 1,
					text: 'Scen/Description',
					dataIndex: 'scen_code',
					renderer: function(v,metaData,r) {
						var txt = '' ;
						txt += '<b>' + r.get('scen_code') + '</b><br>' ;
						txt += '&nbsp;&nbsp;' + r.get('scen_txt') + '<br>' ;
						return txt ;
					}
				}],
				store: {
					autoLoad: true,
					model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigScenarioModel(),
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'config_getScenarios'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				listeners: {
					selectionchange: function(grid,record) {
						this.setupScenario() ;
					},
					scope: this
				}
			},{
				itemId: 'pEmpty',
				hidden: true,
				xtype: 'box',
				cls: 'ux-noframe-bg',
				flex: 1
			},{
				flex: 1,
				itemId: 'pEditor',
				cls: 'ux-noframe-bg',
				border: false,
				hidden: true,
				xtype: 'panel',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					border: false,
					xtype: 'form',
					bodyPadding: 10,
					bodyCls: 'ux-noframe-bg',
					width: 250,
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'top',
						labelWidth: 75,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'scen_code',
						allowBlank: false,
						fieldLabel: 'Code Scénario',
						anchor: '50%'
					},{
						xtype: 'textfield',
						name: 'scen_txt',
						fieldLabel: 'Description'
					},{
						xtype: 'fieldset',
						title: 'Critères',
						items: Ext.Array.merge([{
							labelAlign: 'left',
							name: 'balance_min',
							xtype: 'numberfield',
							fieldLabel: 'Min'
						},{
							labelAlign: 'left',
							name: 'balance_max',
							xtype: 'numberfield',
							fieldLabel: 'Max'
						}],atrFields)
					}]
				},{
					xtype: 'tabpanel',
					flex: 1,
					tabPosition: 'left',
					activeItem: 0,
					items: [{
						title: 'En-cours',
						_actionMap: actionMap,
						_templateMap: templateMap,
						xtype: 'grid',
						itemId: 'gridEditorSteps',
						flex: 1,
						store: {
							model: 'RsiRecouveoConfigScenarioStepEditModel',
							data: [],
							proxy: {
								type: 'memory',
								reader: {
									type: 'json'
								}
							}
						},
						viewConfig: {
							plugins: {
								ptype: 'gridviewdragdrop',
								pluginId: 'reorder'
									//dragText: 'Drag and drop to reorganize'
							}
						},
						tbar: [{
							itemId: 'tbNew',
							icon: 'images/add.png',
							text: 'Créer étape...',
							handler: function() {
								this.handleNewStep();
							},
							scope: this
						},'-',{
							disabled: true,
							itemId: 'tbDelete',
							icon: 'images/delete.png',
							text: 'Supprimer',
							handler: function() {
								this.handleDeleteStep();
							},
							scope: this
						}],
						plugins: [{
							ptype: 'rowediting',
							pluginId: 'rowediting',
							listeners: {
								edit: this.onAfterEditStep,
								canceledit: this.onCancelEditStep,
								beforeedit: this.onBeforeEditStep,
								scope: this
							}
						}],
						columns: [{
							text: 'J + x',
							width: 60,
							dataIndex: 'schedule_daystep',
							editor: {
								xtype: 'numberfield',
								hideTrigger:true
							}
						},{
							text: 'Code',
							width: 90,
							dataIndex: 'scenstep_tag',
							editor: {
								xtype: 'textfield',
								allowBlank: false,
								maxLength: 10,
								enforceMaxLength: true
							}
						},{
							text: 'Action',
							width: 150,
							dataIndex: 'link_action',
							editor: {
								xtype: 'combobox',
								queryMode: 'local',
								forceSelection: true,
								allowBlank: false,
								editable: false,
								store: {
									model: 'RsiRecouveoCfgActionModel',
									data: directActions
								},
								valueField: 'action_id',
								displayField: 'action_txt',
								listeners: {
									select: function(cmb) {
										this.onEditorActionChange(cmb.getValue()) ;
									},
									scope: this
								}
							},
							renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
								//var columnHeader = this.grid.getColumnManager().getHeaderAtIndex(curColIdx) ;
								//var header = this.headerCt.getHeaderAtIndex(colIndex) ;
								var actionMap = view.up('panel')._actionMap ;
								if( actionMap.hasOwnProperty(value) ) {
									var actionData = actionMap[value] ;
									return '<b>'+actionData.action_txt+'</b>' ;
								}
								return '?' ;
							}
						},{
							text: 'Template',
							width: 150,
							dataIndex: 'link_tpl',
							editorTpl: {
								xtype: 'combobox',
								//hidden: true,
								queryMode: 'local',
								forceSelection: true,
								allowBlank: false,
								editable: false,
								store: {
									model: 'RsiRecouveoCfgTemplateModel',
									data: []
								},
								valueField: 'tpl_id',
								displayField: 'tpl_name',
								listeners: {
									select: function(cmb) {
										this.onEditorTemplateChange(cmb.getValue()) ;
									},
									scope: this
								}
							},
							renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
								//var columnHeader = this.grid.getColumnManager().getHeaderAtIndex(curColIdx) ;
								//var header = this.headerCt.getHeaderAtIndex(colIndex) ;
								var templateMap = view.up('panel')._templateMap ;
								if( templateMap.hasOwnProperty(value) ) {
									var templateData = templateMap[value] ;
									return '<b>'+templateData.tpl_name+'</b>' ;
								}
								return '&#160;' ;
							}
						},{
							text: 'Mode d\'envoi',
							width: 150,
							dataIndex: 'mail_modes_json',
							editorTpl: {
								xtype: 'op5specrsiveomailfield'
							},
							renderer: function(value,metaData,record,rowIndex,colIndex,store,view) {
								if( !record.get('link_tpl') ) {
									return ;
								}
								
								var templateMap = view.up('panel')._templateMap ;
								if( !templateMap.hasOwnProperty(record.get('link_tpl')) ) {
									return ;
								}
								
								var templateData = templateMap[record.get('link_tpl')] ;
								if( templateData._empty ) {
									return ;
								}
								
								value = Ext.JSON.decode(value,true) || [] ;
								var str = '' ;
								if( Ext.Array.contains(value,'postal_std') ) {
									str += '<span class="op5-spec-rsiveo-mailthumb-display op5-spec-rsiveo-mail-postal-std">&#160;</span>' ;
								}
								if( Ext.Array.contains(value,'postal_rar') ) {
									str += '<span class="op5-spec-rsiveo-mailthumb-display op5-spec-rsiveo-mail-postal-rar">&#160;</span>' ;
								}
								if( Ext.Array.contains(value,'tel') ) {
									str += '<span class="op5-spec-rsiveo-mailthumb-display op5-spec-rsiveo-mail-sms">&#160;</span>' ;
								}
								if( Ext.Array.contains(value,'email') ) {
									str += '<span class="op5-spec-rsiveo-mailthumb-display op5-spec-rsiveo-mail-email">&#160;</span>' ;
								}
								return str ;
							}
						},{
							text: 'Auto?',
							width: 48,
							dataIndex: 'exec_is_auto',
							editor: {
								xtype: 'checkboxfield'
							},
							renderer: function(v) {
								if( v ) {
									return '<b>'+'X'+'</b>' ;
								}
								return '&#160;' ;
							}
						}],
						listeners: {
							selectionchange: function(selModel,records) {
								this.down('#gridEditorSteps').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0) ) ;
							},
							scope: this
						}
					},{
						title: 'Non échu',
						_actionMap: actionMap,
						_templateMap: templateMap,
						flex: 1,
						xtype: 'form',
						cls: 'ux-noframe-bg',
						bodyPadding: 8,
						bodyCls: 'ux-noframe-bg',
						layout: 'anchor',
						fieldDefaults: {
							labelWidth: 90,
							anchor: '50%'
						},
						items: [{
							xtype: 'box',
							html: '<b>Actions automatiques lors de l\'intégration factures sur dossier existant</b>',
							padding: 16
						},{
							xtype: 'fieldset',
							bodyPadding: 10,
							collapsed: true,
							checkboxToggle: true,
							title: 'Ré-édition courrier sur intégration nouvelles factures',
							items: [{
								xtype: 'combobox',
								fieldLabel: 'Template',
								//hidden: true,
								queryMode: 'local',
								forceSelection: true,
								allowBlank: false,
								editable: false,
								store: {
									model: 'RsiRecouveoCfgTemplateModel',
									data: []
								},
								valueField: 'tpl_id',
								displayField: 'tpl_name',
								listeners: {
									select: function(cmb) {
										this.onEditorTemplateChange(cmb.getValue()) ;
									},
									scope: this
								}
							}]
						}]
					},{
						title: 'Promesses',
						_actionMap: actionMap,
						_templateMap: templateMap,
						flex: 1,
						xtype: 'form',
						cls: 'ux-noframe-bg',
						bodyPadding: 8,
						bodyCls: 'ux-noframe-bg',
						layout: 'anchor',
						fieldDefaults: {
							labelWidth: 150,
							anchor: '75%'
						},
						items: [{
							xtype: 'box',
							html: '<b>Actions automatiques sur échéances promesses</b>',
							padding: 16
						},{
							xtype: 'fieldset',
							bodyPadding: 10,
							collapsed: true,
							checkboxToggle: true,
							title: 'Envoi rappel échéance',
							layout: 'anchor',
							fieldDefaults: {
								labelWidth: 150,
								anchor: '75%'
							},
							items: [{
								xtype: 'numberfield',
								fieldLabel: 'Nb jours avant échéance',
								hideTrigger: true,
								anchor: '',
								width: 200
							},{
								xtype: 'fieldcontainer',
								fieldLabel: 'Template',
								layout: {
									type: 'hbox',
									align: 'middle'
								},
								items: [{
									width:175,
									xtype: 'combobox',
									//hidden: true,
									queryMode: 'local',
									forceSelection: true,
									allowBlank: false,
									editable: false,
									store: {
										model: 'RsiRecouveoCfgTemplateModel',
										data: []
									},
									valueField: 'tpl_id',
									displayField: 'tpl_name',
									listeners: {
										select: function(cmb) {
											this.onEditorTemplateChange(cmb.getValue()) ;
										},
										scope: this
									}
								},{
									xtype: 'op5specrsiveomailfield'
								}]
							}]
						},{
							xtype: 'fieldset',
							bodyPadding: 10,
							collapsed: true,
							checkboxToggle: true,
							title: 'Relance sur retard',
							layout: 'anchor',
							fieldDefaults: {
								labelWidth: 150,
								anchor: '75%'
							},
							items: [{
								xtype: 'numberfield',
								fieldLabel: 'Nb jours après échéance',
								hideTrigger: true,
								anchor: '',
								width: 200
							},{
								xtype: 'fieldcontainer',
								fieldLabel: 'Template',
								layout: {
									type: 'hbox',
									align: 'middle'
								},
								items: [{
									width:175,
									xtype: 'combobox',
									//hidden: true,
									queryMode: 'local',
									forceSelection: true,
									allowBlank: false,
									editable: false,
									store: {
										model: 'RsiRecouveoCfgTemplateModel',
										data: []
									},
									valueField: 'tpl_id',
									displayField: 'tpl_name',
									listeners: {
										select: function(cmb) {
											this.onEditorTemplateChange(cmb.getValue()) ;
										},
										scope: this
									}
								},{
									xtype: 'op5specrsiveomailfield'
								}]
							}]
						}]
					},{
						title: 'Litiges',
						_actionMap: actionMap,
						_templateMap: templateMap,
						flex: 1,
						xtype: 'form',
						cls: 'ux-noframe-bg',
						bodyPadding: 8,
						bodyCls: 'ux-noframe-bg',
						layout: 'anchor',
						fieldDefaults: {
							labelWidth: 150,
							anchor: '50%'
						},
						items: [{
							xtype: 'box',
							html: '<b>Actions de suivi litige</b>',
							padding: 16
						},{
							xtype: 'fieldset',
							bodyPadding: 10,
							title: 'Prochaine action de suivi',
							items: [{
								xtype: 'numberfield',
								fieldLabel: 'Nb jours par défaut',
								hideTrigger: true,
								anchor: '',
								width: 225
							}]
						}]
					}]
				}],
				dockedItems: [{
					xtype: 'toolbar',
					dock: 'bottom',
					ui: 'footer',
					//defaults: {minWidth: minButtonWidth</a>},
					items: [{
						itemId: 'btnEdit',
						xtype: 'button',
						text: 'Modifier',
						icon: 'images/modules/rsiveo-edit-16.gif',
						handler: function( btn ) {
							this.handleScenEdit() ;
						},
						scope: this
					},{
						itemId: 'btnCopy',
						xtype: 'button',
						text: 'Dupliquer',
						icon: 'images/op5img/ico_saveas_16.gif',
						handler: function( btn ) {
							var doCopy = true ;
							this.handleScenEdit(doCopy) ;
						},
						scope: this
					},{
						itemId: 'btnDelete',
						xtype: 'button',
						text: 'Supprimer',
						icon: 'images/op5img/ico_delete_16.gif',
						handler: function( btn ) {
							var doDelete = true ;
							this.handleScenDelete() ;
						},
						scope: this
					},{
						xtype: 'component',
						flex: 1
					},{
						itemId: 'btnOk',
						xtype: 'button',
						text: 'Enregistrer',
						icon: 'images/modules/rsiveo-save-16.gif',
						handler: function( btn ) {
							this.handleScenSave() ;
						},
						scope: this
					},{
						itemId: 'btnCancel',
						xtype: 'button',
						text: 'Annuler',
						icon: 'images/modules/rsiveo-cancel-16.gif',
						handler: function( btn ) {
							this.handleScenAbort() ;
						},
						scope: this
					}]
				}]
			}]
		});
		
		this.callParent() ;
		
		this.down('#pEmpty').setVisible(true) ;
		this.down('#pEditor').setVisible(false) ;
		this.setupScenario() ;
	},
	doLoad: function(focusId) {
		this.setEditMode(false) ;
		
		var gridScenarios = this.down('#gridScenarios') ;
		gridScenarios.getStore().load() ;
		gridScenarios.getStore().on('load',function(store) {
			if( !focusId ) {
				gridScenarios.getSelectionModel().deselectAll(true) ;
			} else {
				var focusRecord = store.getById(focusId) ;
				gridScenarios.getSelectionModel().select([focusRecord]) ;
			}
			this.setupScenario() ;
		},this,{single: true}) ;
	},
	getSelectedScenario: function() {
		var gridScenarios = this.down('#gridScenarios') ;
		return gridScenarios.getSelectionModel().getSelection()[0] ;
	},
	setupScenario: function() {
		var selectedScenario = this.getSelectedScenario() ;
		if( !selectedScenario ) {
			this.down('#pEmpty').setVisible(true) ;
			this.down('#pEditor').setVisible(false) ;
			this.setEditMode(false) ;
			return ;
		}
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		this.down('#pEmpty').setVisible(false) ;
		pEditor.setVisible(true) ;
		editorForm.loadRecord(selectedScenario) ;
		
		var gridData = [] ;
		selectedScenario.steps().each( function(stepRecord) {
			gridData.push( stepRecord.getData() ) ;
		}) ;
		editorGrid.getStore().loadData( gridData ) ;
		
		this.setEditMode(false) ;
	},
	handleScenNew: function() {
		var gridScenarios = this.down('#gridScenarios') ;
		gridScenarios.getSelectionModel().deselectAll(true) ;
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		this.down('#pEmpty').setVisible(false) ;
		pEditor.setVisible(true) ;
		editorForm.reset() ;
		editorGrid.getStore().loadData([]) ;
		
		this.setEditMode(true) ;
	},
	handleScenEdit: function(doCopy) {
		var setAsNew = doCopy ;
		this.setEditMode(true,setAsNew) ;
	},
	handleScenSave: function(doDelete) {
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		if( !editorForm.isValid() ) {
			return ;
		}
		
		var data = editorForm.getValues(false,false,false,true) ;
		data['steps'] = [] ;
		var cnt = 0 ;
		editorGrid.getStore().each( function(stepRecord) {
			cnt++ ;
			stepRecord.set('schedule_idx',cnt) ;
			data['steps'].push(stepRecord.getData()) ;
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'config_setScenario',
				data: Ext.JSON.encode(data),
				do_delete: (doDelete ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.doLoad(doDelete?null:data['scen_code']) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleScenDelete: function() {
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		
		var data = editorForm.getValues(false,false,false,true) ;
		
		Ext.MessageBox.confirm('Suppression','Suppression scénario '+data.scen_code, function(btn) {
			if( btn =='yes' ) {
				var doDelete = true ;
				this.handleScenSave(doDelete) ;
			}
		},this) ;
	},
	handleScenAbort: function() {
		var gridScenarios = this.down('#gridScenarios') ;
		this.setupScenario() ;
	},
	setEditMode: function(torf,setAsNew) {
		var gridScenarios = this.down('#gridScenarios') ;
		gridScenarios.getSelectionModel().setLocked(torf) ;
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		editorForm.getForm().getFields().each( function(field) {
			field.setReadOnly(!torf) ;
			if( setAsNew ) {
				if( field.getName()=='scen_code' ) {
					field.reset() ;
					field.setReadOnly(false) ;
				}
			} else {
				if( field.getName()=='scen_code' && !Ext.isEmpty(field.getValue()) ) {
					field.setReadOnly(true) ;
				}
			}
		}) ;
		editorGrid.getPlugin('rowediting')._disabled = !torf ;
		
		pEditor.down('#btnEdit').setVisible(!torf) ;
		pEditor.down('#btnCopy').setVisible(!torf) ;
		pEditor.down('#btnDelete').setVisible(!torf) ;
		pEditor.down('#btnOk').setVisible(torf) ;
		pEditor.down('#btnCancel').setVisible(torf) ;
		editorGrid.down('toolbar').setVisible(torf) ;
		
		if( torf ) {
			editorGrid.getView().getPlugin('reorder').enable();
		} else {
			editorGrid.getView().getPlugin('reorder').disable();
		}
	},
	onAfterEditStep: function(editor,context) {
		context.record.set('_phantom',false) ;
		context.record.commit() ;
	},
	onCancelEditStep: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	onBeforeEditStep: function(editor,context) {
		if(editor._disabled){
			return false ;
		}
		var actionColumn = this.down('#gridEditorSteps').headerCt.down('[dataIndex="link_action"]') ;
		this.onEditorActionChange(context.record.get('link_action')) ;
		this.onEditorTemplateChange(context.record.get('link_tpl')) ;
	},
	onEditorActionChange: function(selectedAction) {
		// Load appropriate templates
		var templatesData = [],
			templateColumn = this.down('#gridEditorSteps').headerCt.down('[dataIndex="link_tpl"]'),
			templateEditor = Ext.clone( templateColumn.editorTpl ) ;
			
		//var editorComponent = this.down('#gridEditorSteps').getPlugin('rowediting').getEditor() ;
		if( selectedAction == 'CALL_OUT' ) {
			templatesData.push({_empty:true,tpl_id:'_',tpl_name:'- Pas de courrier -'});
		}
		
		var length = 0 ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getTemplateAll(), function(templateRow) {
			if( templateRow.tpl_group == selectedAction ) {
				templatesData.push(templateRow) ;
				length++ ;
			}
		}) ;
		if( length<1 ) {
			templateColumn.setEditor(null);
		} else {
			templateEditor.store.data = templatesData ;
			templateColumn.setEditor(templateEditor) ;
		}
		if( templateColumn.getEditor().el ) {
			this.down('#gridEditorSteps').getPlugin('rowediting').getEditor().syncFieldWidth(templateColumn) ; // HACK
		}
	},
	onEditorTemplateChange: function(selectedTemplate) {
		var mailmodesColumn = this.down('#gridEditorSteps').headerCt.down('[dataIndex="mail_modes_json"]'),
			mailmodesEditor = Ext.clone( mailmodesColumn.editorTpl ) ;
		if( Ext.isEmpty(selectedTemplate) || selectedTemplate=='_' ) {
			mailmodesColumn.setEditor(null);
		} else {
			mailmodesColumn.setEditor(mailmodesEditor) ;
		}
		if( mailmodesColumn.getEditor().el ) {
			this.down('#gridEditorSteps').getPlugin('rowediting').getEditor().syncFieldWidth(mailmodesColumn) ; // HACK
		}
	},
	handleNewStep: function() {
		var stepGrid = this.down('#gridEditorSteps') ;
		if( stepGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var newRecords = stepGrid.getStore().add( Ext.create('RsiRecouveoConfigScenarioStepEditModel',{
			_phantom: true
		}) ) ;
		stepGrid.getPlugin('rowediting').startEdit(newRecords[0]) ;
	},
	handleDeleteStep: function() {
		var stepGrid = this.down('#gridEditorSteps') ;
		if( stepGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var toDeleteRecords = stepGrid.getSelectionModel().getSelection() ;
		if( toDeleteRecords && toDeleteRecords.length>0 ) {
			stepGrid.getStore().remove(toDeleteRecords) ;
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
	}
});
