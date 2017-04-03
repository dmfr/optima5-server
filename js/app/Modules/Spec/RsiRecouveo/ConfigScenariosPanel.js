Ext.define('RsiRecouveoConfigScenarioStepEditModel',{
	extend: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigScenarioStepModel(),
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
			if( actionRow.is_direct ) {
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
						this.handleNewScenario();
					},
					scope: this
				}],
				xtype: 'grid',
				width: 190,
				itemId: 'gridScenarios',
				columns: [{
					flex: 1,
					text: 'Scen/Description',
					dataIndex: 'scen_id',
					renderer: function(v) {
						return v ;
					}
				}],
				store: {
					model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigScenarioModel(),
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
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
						sorters: [{
							property: 'schedule_idx',
							direction: 'ASC'
						}],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
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
						dataIndex: 'scenstep_code',
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
					}]
				}],
				buttons: [{
					itemId: 'btnOk',
					xtype: 'button',
					text: 'Enregistrer',
					icon: 'images/op5img/ico_save_16.gif',
					handler: function( btn ) {
						this.scenSave() ;
					},
					scope: this
				},{
					itemId: 'btnCancel',
					xtype: 'button',
					text: 'Annuler',
					icon: 'images/op5img/ico_cancel_small.gif',
					handler: function( btn ) {
						this.scenAbort() ;
					},
					scope: this
				}]
			}]
		});
		
		this.callParent() ;
		
		this.down('#pEmpty').setVisible(false) ;
		this.down('#pEditor').setVisible(true) ;
	},
	scenSave: function() {
		
	},
	scenAbort: function() {
		
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
		var newRecords = stepGrid.getStore().add( Ext.create('RsiRecouveoConfigScenarioStepEditModel',{
			_phantom: true
		}) ) ;
		console.dir(newRecords) ;
		stepGrid.getPlugin('rowediting').startEdit(newRecords[0]) ;
	}
});
