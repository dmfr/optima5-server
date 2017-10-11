Ext.define('RsiRecouveoConfigSocMetafieldEditModel',{
	extend: 'RsiRecouveoConfigSocMetafieldModel',
	fields: [
		{name:'_phantom', type:'boolean'}
	]
});



Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigSocsPanel', {
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
					hidden: true,
					itemId: 'tbNew',
					icon: 'images/modules/rsiveo-useradd-16.gif',
					text: 'Nouveau...',
					handler: function() {
						this.handleSocNew();
					},
					scope: this
				}],
				xtype: 'grid',
				width: 190,
				itemId: 'gridSocs',
				columns: [{
					flex: 1,
					text: 'Soc/Description',
					dataIndex: 'soc_id',
					renderer: function(v,metaData,r) {
						var txt = '' ;
						txt += '<b>' + r.get('soc_id') + '</b><br>' ;
						txt += '&nbsp;&nbsp;' + r.get('soc_name') + '<br>' ;
						return txt ;
					}
				}],
				store: {
					autoLoad: true,
					model: 'RsiRecouveoConfigSocModel',
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'config_getSocs'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				listeners: {
					selectionchange: function(grid,record) {
						this.setupSoc() ;
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
						name: 'soc_id',
						allowBlank: false,
						fieldLabel: 'Code Entité',
						anchor: '50%'
					},{
						xtype: 'textfield',
						name: 'soc_name',
						fieldLabel: 'Entité / Société'
					}]
				},{
					title: 'Métadonnées',
					xtype: 'grid',
					itemId: 'gridEditorMetafields',
					flex: 1,
					store: {
						model: 'RsiRecouveoConfigSocMetafieldEditModel',
						data: [],
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
						text: 'Définir métadonnée',
						handler: function() {
							this.handleNewMetafield();
						},
						scope: this
					},'-',{
						disabled: true,
						itemId: 'tbDelete',
						icon: 'images/delete.png',
						text: 'Supprimer',
						handler: function() {
							this.handleDeleteMetafield();
						},
						scope: this
					}],
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						listeners: {
							beforeedit: this.onBeforeEditMetafield,
							edit: this.onAfterEditMetafield,
							canceledit: this.onCancelEditMetafield,
							scope: this
						}
					}],
					columns: [{
						text: 'Code',
						width: 150,
						dataIndex: 'metafield_code',
						editor: {
							xtype: 'textfield',
							allowBlank: false,
							maxLength: 10,
							enforceMaxLength: true
						}
					},{
						text: 'Description',
						width: 250,
						dataIndex: 'metafield_desc',
						editor: {
							xtype: 'textfield',
							allowBlank: false,
						}
					},{
						text: 'Type',
						width: 125,
						dataIndex: 'metafield_assoc',
						renderer: function(v) {
							switch(v) {
								case 'account' :
									return 'Compte' ;
								case 'record' :
									return 'Facture' ;
								default :
									return v;
							}
						},
						editor: {
							xtype: 'combobox',
							allowBlank: false,
							forceSelection: true,
							editable: false,
							store: {
								fields: ['id','txt'],
								data : [
									{id:'account', txt:'Compte'},
									{id:'record', txt:'Facture'}
								]
							},
							queryMode: 'local',
							displayField: 'txt',
							valueField: 'id'
						}
					},{
						text: 'Filtrable<br>par liste ?',
						width: 80,
						align: 'center',
						dataIndex: 'is_filter',
						editor: {
							xtype: 'checkboxfield',
							listeners: {
								change: function(chk) {
									var formValues = chk.up('form').getForm().getFieldValues() ;
									this.onEditorChange(formValues) ;
								},
								scope: this
							}
						},
						renderer: function(v) {
							if(v) {
								return '<b>'+'X'+'</b>' ;
							}
						}
					},{
						text: 'Attribut<br>global ?',
						width: 80,
						align: 'center',
						dataIndex: 'is_globalfilter',
						editorTpl: {
							xtype: 'checkboxfield'
						},
						renderer: function(v) {
							if(v) {
								return '<b>'+'X'+'</b>' ;
							}
						}
					}],
					listeners: {
						selectionchange: function(selModel,records) {
							this.down('#gridEditorMetafields').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0) ) ;
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
						icon: 'images/modules/rsiveo-edit-16.gif',
						handler: function( btn ) {
							this.handleSocEdit() ;
						},
						scope: this
					},{
						hidden: true,
						itemId: 'btnDelete',
						xtype: 'button',
						text: 'Supprimer',
						icon: 'images/op5img/ico_delete_16.gif',
						handler: function( btn ) {
							var doDelete = true ;
							this.handleSocDelete() ;
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
							this.handleSocSave() ;
						},
						scope: this
					},{
						itemId: 'btnCancel',
						xtype: 'button',
						text: 'Annuler',
						icon: 'images/modules/rsiveo-cancel-16.gif',
						handler: function( btn ) {
							this.handleSocAbort() ;
						},
						scope: this
					}]
				}]
			}]
		});
		
		this.callParent() ;
		
		this.down('#pEmpty').setVisible(true) ;
		this.down('#pEditor').setVisible(false) ;
		this.setupSoc() ;
	},
	doLoad: function(focusId) {
		this.setEditMode(false) ;
		
		var gridSocs = this.down('#gridSocs') ;
		gridSocs.getStore().load() ;
		gridSocs.getStore().on('load',function(store) {
			if( !focusId ) {
				gridSocs.getSelectionModel().deselectAll(true) ;
			} else {
				var focusRecord = store.getById(focusId) ;
				gridSocs.getSelectionModel().select([focusRecord]) ;
			}
			this.setupSoc() ;
		},this,{single: true}) ;
	},
	getSelectedSoc: function() {
		var gridSocs = this.down('#gridSocs') ;
		return gridSocs.getSelectionModel().getSelection()[0] ;
	},
	setupSoc: function() {
		var selectedSoc = this.getSelectedSoc() ;
		if( !selectedSoc ) {
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
		editorForm.loadRecord(selectedSoc) ;
		
		var gridData = [] ;
		selectedSoc.metafields().each( function(metafieldRecord) {
			gridData.push( metafieldRecord.getData() ) ;
		}) ;
		editorGrid.getStore().loadData( gridData ) ;
		
		this.setEditMode(false) ;
	},
	handleSodNew: function() {
		return ;
		var gridSocs = this.down('#gridSocs') ;
		gridSocs.getSelectionModel().deselectAll(true) ;
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		this.down('#pEmpty').setVisible(false) ;
		pEditor.setVisible(true) ;
		editorForm.reset() ;
		editorGrid.getStore().loadData([]) ;
		
		this.setEditMode(true) ;
	},
	handleSocEdit: function(doCopy) {
		var setAsNew = doCopy ;
		this.setEditMode(true,setAsNew) ;
	},
	handleSocSave: function(doDelete) {
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		if( !editorForm.isValid() ) {
			return ;
		}
		
		var data = editorForm.getValues(false,false,false,true) ;
		data['metafields'] = [] ;
		editorGrid.getStore().each( function(metafieldRecord) {
			data['metafields'].push(metafieldRecord.getData()) ;
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'config_setSoc',
				data: Ext.JSON.encode(data),
				do_delete: (doDelete ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.doLoad(doDelete?null:data['soc_code']) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleSocDelete: function() {
		return ;
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		
		var data = editorForm.getValues(false,false,false,true) ;
		
		Ext.MessageBox.confirm('Suppression','Suppression société '+data.soc_id, function(btn) {
			if( btn =='yes' ) {
				var doDelete = true ;
				this.handleSocSave(doDelete) ;
			}
		},this) ;
	},
	handleSocAbort: function() {
		var gridSocs = this.down('#gridSocs') ;
		this.setupSoc() ;
	},
	setEditMode: function(torf,setAsNew) {
		var gridSocs = this.down('#gridSocs') ;
		gridSocs.getSelectionModel().setLocked(torf) ;
		
		var pEditor = this.down('#pEditor'),
			editorForm = pEditor.down('form'),
			editorGrid = pEditor.down('grid') ;
		editorForm.getForm().getFields().each( function(field) {
			field.setReadOnly(!torf) ;
			if( setAsNew ) {
				if( field.getName()=='soc_id' ) {
					field.reset() ;
					field.setReadOnly(false) ;
				}
			} else {
				if( field.getName()=='soc_id' && !Ext.isEmpty(field.getValue()) ) {
					field.setReadOnly(true) ;
				}
			}
		}) ;
		editorGrid.getPlugin('rowediting')._disabled = !torf ;
		
		pEditor.down('#btnEdit').setVisible(!torf) ;
		pEditor.down('#btnDelete').setVisible(!torf) ;
		pEditor.down('#btnOk').setVisible(torf) ;
		pEditor.down('#btnCancel').setVisible(torf) ;
		editorGrid.down('toolbar').setVisible(torf) ;
	},
	onBeforeEditMetafield: function(editor,context) {
		if(editor._disabled){
			return false ;
		}
		this.onEditorChange(context.record.getData()) ;
	},
	onAfterEditMetafield: function(editor,context) {
		context.record.set('_phantom',false) ;
		context.record.commit() ;
	},
	onCancelEditMetafield: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	onEditorChange: function(formValues) {
		var isFilterColumn = this.down('#gridEditorMetafields').headerCt.down('[dataIndex="is_filter"]'),
			isGlobalFilterColumn = this.down('#gridEditorMetafields').headerCt.down('[dataIndex="is_globalfilter"]') ;
		isGlobalFilterColumn.setEditor( ((formValues['is_filter']==true) ? isGlobalFilterColumn.editorTpl : null) ) ;
		if( isGlobalFilterColumn.getEditor().el ) {
			this.down('#gridEditorMetafields').getPlugin('rowediting').getEditor().syncFieldWidth(isGlobalFilterColumn) ; // HACK
		}
	},
	handleNewMetafield: function() {
		var metafieldsGrid = this.down('#gridEditorMetafields') ;
		if( metafieldsGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var newRecords = metafieldsGrid.getStore().add( Ext.create('RsiRecouveoConfigSocMetafieldEditModel',{
			_phantom: true
		}) ) ;
		metafieldsGrid.getPlugin('rowediting').startEdit(newRecords[0]) ;
	},
	handleDeleteMetafield: function() {
		var metafieldsGrid = this.down('#gridEditorMetafields') ;
		if( metafieldsGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var toDeleteRecords = metafieldsGrid.getSelectionModel().getSelection() ;
		if( toDeleteRecords && toDeleteRecords.length>0 ) {
			metafieldsGrid.getStore().remove(toDeleteRecords) ;
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
