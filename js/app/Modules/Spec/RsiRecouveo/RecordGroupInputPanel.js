Ext.define('Optima5.Modules.Spec.RsiRecouveo.RecordGroupInputPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [],
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'box',
					width: 96,
					cls: 'ux-noframe-bg op5-spec-rsiveo-factureheader-icon'
				},{
					flex: 1,
					bodyPadding: 10,
					bodyCls: 'ux-noframe-bg',
					border: false,
					xtype: 'form',
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						anchor: '100%',
						labelWidth: 150
					},
					items: [{
						xtype: 'checkbox',
						name: 'recordgroup_new',
						readOnly: false,
						boxLabel: 'Nouveau formulaire ?',
						listeners: {
							change: function(field,value) {
								this.doChangeNew(value) ;
							},
							scope: this
						}
					},{
						xtype: 'combobox',
						name: 'recordgroup_code',
						readOnly: false,
						fieldLabel: 'Bordereau de remise',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['recordgroup_code'],
							data : [],
							sorters: [{
								property: 'recordgroup_code',
								direction: 'DESC'
							}]
						},
						queryMode: 'local',
						displayField: 'recordgroup_code',
						valueField: 'recordgroup_code',
						listeners: {
							select: function(cmb,record) {
								this.doSelectGroup(record.get('recordgroup_code')) ;
							},
							scope: this
						}
					},{
						xtype: 'textfield',
						name: 'recordgroup_text',
						readOnly: true,
						fieldLabel: 'Bordereau de remise',
						value: 'Nouveau bordereau'
					},{
						xtype: 'datefield',
						name: 'recordgroup_date',
						allowBlank: false,
						fieldLabel: 'Date remise',
						format: 'd/m/Y',
						anchor: '75%'
					}]
				}]
			},{
				xtype: 'container',
				flex: 1,
				layout: 'fit',
				itemId: 'pCenter'
			}]
		}) ;
		this.callParent() ;
		this.resetForm() ;
	},
	resetForm: function() {
		this.down('form').getForm().reset() ;
		this.doChangeNew(false) ;
		this.doBuildGrid(null) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_list'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var records = [] ;
				Ext.Array.each(ajaxResponse.data, function(row) {
					if( row.recordgroup_type=='input' ) {
						records.push({recordgroup_code: row.recordgroup_id}) ;
					}
				}) ;
				this.down('form').getForm().findField('recordgroup_code').getStore().loadData(records) ;
			},
			scope: this
		}) ;
	},
	
	onEditRecord: function(editor,context) {
		var recAccount = context.record.get('acc_id') ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleGrid',
				bible_code: 'LIB_ACCOUNT',
				filter: Ext.JSON.encode([{property: 'str_search',value:recAccount}])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					return ;
				}
				context.record.set('acc_txt',ajaxResponse.data[0]['field_ACC_NAME']) ;
				context.record.set('_phantom',false) ;
				context.record.commit() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onCancelEditRecord: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	handleNewRecord: function() {
		var stepGrid = this.down('#pCenter').down('grid') ;
		if( stepGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var newRecords = stepGrid.getStore().add( Ext.create(Optima5.Modules.Spec.RsiRecouveo.HelperCache.getRecordModel(),{
			_phantom: true
		}) ) ;
		stepGrid.getPlugin('rowediting').startEdit(newRecords[0]) ;
	},
	handleDeleteRecord: function() {
		var stepGrid = this.down('#pCenter').down('grid') ;
		if( stepGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var toDeleteRecords = stepGrid.getSelectionModel().getSelection() ;
		if( toDeleteRecords && toDeleteRecords.length>0 ) {
			stepGrid.getStore().remove(toDeleteRecords) ;
		}
	},
	
	doBuildGrid: function(gridData,readOnly) {
		var pCenter = this.down('#pCenter') ;
		pCenter.removeAll() ;
		if( !gridData ) {
			pCenter.add({
				xtype: 'box',
				cls: 'ux-noframe-bg'
			}) ;
			return ;
		}
		pCenter.add({
			xtype: 'grid',
			flex: 1,
			itemId: 'pCenter',
			store: {
				model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getRecordModel(),
				data: gridData,
				proxy: {
					type: 'memory'
				}
			},
			plugins: [{
				ptype: 'rowediting',
				pluginId: 'rowediting',
				listeners: {
					edit: this.onEditRecord,
					canceledit: this.onCancelEditRecord,
					scope: this
				}
			}],
			tbar: [{
				itemId: 'tbNew',
				icon: 'images/add.png',
				text: 'Ajouter',
				handler: function() {
					this.handleNewRecord();
				},
				scope: this
			},'-',{
				disabled: true,
				itemId: 'tbDelete',
				icon: 'images/delete.png',
				text: 'Supprimer',
				handler: function() {
					this.handleDeleteRecord();
				},
				scope: this
			},'->',{
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Valider la remise',
				handler: function() {
					this.handleSaveGroup();
				},
				scope: this
			}],
			columns: [{
				text: 'Compte acheteur',
				dataIndex: 'acc_id',
				width:300,
				editor: {
					xtype: 'op5crmbasebiblepicker',
					optimaModule: this.optimaModule,
					bibleId: 'LIB_ACCOUNT'
				},
				renderer: function(v,m,r) {
					if( Ext.isEmpty(v) ) {
						return ;
					}
					return '<b>'+r.get('acc_id')+'</b>'+'&#160;&#160;&#160;&#160;'+r.get('acc_txt') ;
				}
			},{
				text: 'Montant',
				dataIndex: 'amount',
				align: 'center',
				width: 120,
				tdCls: 'op5-spec-dbstracy-bigcolumn',
				editor: {
					xtype: 'numberfield',
					hideTrigger: true
				},
				renderer: Ext.util.Format.numberRenderer('0,000.00')
			}],
			listeners: {
				selectionchange: function(selModel,records) {
					this.down('#pCenter').down('grid').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0) ) ;
				},
				scope: this
			}
		});
		var editorGrid = pCenter.down('grid') ;
		editorGrid.getPlugin('rowediting')._disabled = readOnly ;
		editorGrid.down('toolbar').setVisible(!readOnly) ;
	},
	doChangeNew: function(isNew) {
		var form = this.down('form').getForm() ;
		form.findField('recordgroup_text').setVisible(isNew) ;
		form.findField('recordgroup_code').setVisible(!isNew) ;
		if( isNew ) {
			this.doBuildGrid([],false) ;
			this.doSelectGroup(null) ;
		} else {
			this.doBuildGrid(null) ;
			form.findField('recordgroup_code').reset() ;
		}
	},
	doSelectGroup: function( recordgroupCode ) {
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_input_get',
				recordgroup_code: recordgroupCode
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.down('form').getForm().setValues( ajaxResponse.data );
				this.doBuildGrid(ajaxResponse.data.records,ajaxResponse.readonly) ;
			},
			scope: this
		}) ;
	},
	
	
	
	handleSaveGroup: function() {
		var form = this.down('form').getForm(),
			grid = this.down('#pCenter').down('grid') ;
		if( !form.isValid() ) {
			return ;
		}
		
		var gridData = [] ;
		grid.getStore().each( function(gridRecord) {
			gridData.push( gridRecord.getData() ) ;
		}) ;
		
		var data = form.getFieldValues() ;
		data['records'] = gridData ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_input_set',
				_is_new: ( data.recordgroup_new ? 1 : 0 ),
				recordgroup_code: data.recordgroup_code,
				data: Ext.JSON.encode(data)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				this.resetForm() ;
			},
			scope: this
		}) ;
	}
}) ;
