Ext.define('RsiRecouveoConfigScenarioStepEditModel',{
	extend: 'RsiRecouveoConfigScenarioStepModel',
	fields: [
		{name:'_phantom', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigScenariosPanel', {
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		
		var atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrFields.push({
				xtype: 'op5crmbasebibletreepicker',
				optimaModule: this.optimaModule,
				bibleId: atrRecord.bible_code,
				name: 'link_'+atrRecord.bible_code,
				fieldLabel: atrRecord.atr_txt
			}) ;
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
					icon: 'images/op5img/ico_new_16.gif',
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
							displayField: 'tpl_name'
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
						icon: 'images/op5img/ico_edit_small.gif',
						handler: function( btn ) {
							this.handleScenEdit() ;
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
						icon: 'images/op5img/ico_save_16.gif',
						handler: function( btn ) {
							this.handleScenSave() ;
						},
						scope: this
					},{
						itemId: 'btnCancel',
						xtype: 'button',
						text: 'Annuler',
						icon: 'images/op5img/ico_cancel_small.gif',
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
	handleScenEdit: function(scenCode) {
		this.setEditMode(true) ;
	},
	handleScenSave: function(doDelete) {
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		
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
	setEditMode: function(torf) {
		var gridScenarios = this.down('#gridScenarios') ;
		gridScenarios.getSelectionModel().setLocked(torf) ;
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		editorForm.getForm().getFields().each( function(field) {
			field.setReadOnly(!torf) ;
			if( field.getName()=='scen_code' && !Ext.isEmpty(field.getValue()) ) {
				field.setReadOnly(true) ;
			}
		}) ;
		editorGrid.getPlugin('rowediting')._disabled = !torf ;
		
		pEditor.down('#btnEdit').setVisible(!torf) ;
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
	},
	onEditorActionChange: function(selectedAction) {
		// Load appropriate templates
		var templatesData = [],
			templateColumn = this.down('#gridEditorSteps').headerCt.down('[dataIndex="link_tpl"]'),
			templateEditor = Ext.clone( templateColumn.editorTpl ) ;
			
		//var editorComponent = this.down('#gridEditorSteps').getPlugin('rowediting').getEditor() ;
		
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getTemplateAll(), function(templateRow) {
			if( templateRow.tpl_group == selectedAction ) {
				templatesData.push(templateRow) ;
			}
		}) ;
		if( templatesData.length==0 ) {
			templateColumn.setEditor(null);
		} else {
			templateEditor.store.data = templatesData ;
			templateColumn.setEditor(templateEditor) ;
		}
		if( templateColumn.getEditor().el ) {
			this.down('#gridEditorSteps').getPlugin('rowediting').getEditor().syncFieldWidth(templateColumn) ; // HACK
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
