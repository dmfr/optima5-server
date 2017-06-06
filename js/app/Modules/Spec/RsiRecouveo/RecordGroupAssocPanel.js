Ext.define('Optima5.Modules.Spec.RsiRecouveo.RecordGroupAssocPanel',{
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
						fieldLabel: 'Groupage VPC',
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
				_action: 'recordgroup_assoc_list'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var records = [] ;
				Ext.Array.each(ajaxResponse.data, function(group) {
					records.push({recordgroup_code: group}) ;
				}) ;
				this.down('form').getForm().findField('recordgroup_code').getStore().loadData(records) ;
				
				this.down('form').getForm().findField('recordgroup_text').setValue( ajaxResponse.next_txt ) ;
			},
			scope: this
		}) ;
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
			tbar: ['->',{
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Valider le groupage',
				handler: function() {
					this.handleSaveGroup();
				},
				scope: this
			}],
			columns: [{
				xtype: 'checkcolumn',
				dataIndex: '_checked',
				listeners: {
					beforecheckchange: function(col) {
						if( col._disabled ) {
							return false ;
						}
					}
				}
			},{
				text: 'Compte acheteur',
				dataIndex: 'acc_id',
				width:300,
				renderer: function(v,m,r) {
					return '<b>'+r.get('acc_id')+'</b>'+'&#160;&#160;&#160;&#160;'+r.get('acc_txt') ;
				}
			},{
				text: 'Libellé',
				dataIndex: 'record_id',
				width:200
			},{
				text: 'Montant',
				dataIndex: 'amount',
				align: 'center',
				width: 120,
				tdCls: 'op5-spec-dbstracy-bigcolumn',
				renderer: Ext.util.Format.numberRenderer('0,000.00')
			}]
		});
		var editorGrid = pCenter.down('grid') ;
		editorGrid.headerCt.down('[dataIndex="_checked"]')._disabled = readOnly ;
		editorGrid.down('toolbar').setVisible(!readOnly) ;
	},
	doChangeNew: function(isNew) {
		var form = this.down('form').getForm() ;
		form.findField('recordgroup_text').setVisible(isNew) ;
		form.findField('recordgroup_code').setVisible(!isNew) ;
		if( isNew ) {
			this.doBuildGrid(null) ;
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
				_action: 'recordgroup_assoc_get',
				recordgroup_code: (recordgroupCode || '')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				Ext.Array.each( ajaxResponse.data, function(row) {
					this.down('form').getForm().findField('recordgroup_date').setValue( Ext.Date.parse(row['date_record'],'Y-m-d H:i:s') ) ;
					return false ;
				},this) ;
				
				this.doBuildGrid(ajaxResponse.data,ajaxResponse.readonly) ;
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
		
		var ids = [] ;
		grid.getStore().each( function(gridRecord) {
			if( gridRecord.get('_checked') ) {
				ids.push(gridRecord.getId()) ;
			}
		}) ;
		
		var data = form.getFieldValues() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'recordgroup_assoc_set',
				_is_new: ( data.recordgroup_new ? 1 : 0 ),
				recordgroup_code: data.recordgroup_code,
				record_filerecord_ids: Ext.JSON.encode(ids)
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
