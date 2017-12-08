Ext.define('RsiRecouveoDevNotepalModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'nt_filerecord_id',  type: 'int', allowNull:true},
		{name: 'nt_class', type: 'string'},
		{name: 'nt_date', type: 'date',  dateFormat:'Y-m-d H:i:s'},
		{name: 'nt_text', type: 'string'},
		{name: 'nt_priority',  type: 'int'},
		{name: 'nt_done_ok',  type: 'boolean'},
		{name: 'nt_done_text',  type: 'string'},
		{name: '_phantom',  type: 'boolean'}
	]
});
Ext.define('Optima5.Modules.Spec.RsiRecouveo.DevNotepad', {
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'fit',
			items: [{
				border: false,
				itemId: 'gridNotepad',
				xtype: 'grid',
				store: {
					autoLoad: true,
					model: 'RsiRecouveoDevNotepalModel',
					proxy:  this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'dev_getNotepad'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				columns: [{
					dataIndex: 'nt_filerecord_id',
					text: 'No',
					width: 70
				},{
					dataIndex: 'nt_class',
					text: 'Catégorie',
					width: 200,
					editor: {
						xtype: 'combobox',
						allowBlank: false,
						forceSelection: false,
						editable: true,
						store: {
							autoLoad: false,
							fields: ['nt_class'],
							proxy : this.optimaModule.getConfiguredAjaxProxy({
								extraParams : {
									_moduleId: 'spec_rsi_recouveo',
									_action: 'dev_getNotepadClass'
								},
								reader: {
									type: 'json',
									rootProperty: 'data'
								}
							})
						},
						queryMode: 'local',
						displayField: 'nt_class',
						valueField: 'nt_class'
					}
				},{
					dataIndex: 'nt_date',
					text: 'Date demande',
					width: 120,
					renderer: Ext.util.Format.dateRenderer('d/m/Y'),
					editor: {
						xtype: 'datefield',
						format: 'Y-m-d'
					}
				},{
					dataIndex: 'nt_text',
					text: 'Note',
					width: 400,
					tdCls: 'multiline-row',
					editor: {
						xtype: 'textarea',
						enableKeyEvents : true,
						listeners       : {
								keydown : function(field, e) {
									if (e.getKey() == e.ENTER) {
										e.stopPropagation();
									}
								}
						}
					},
					renderer: function(v) {
						return Ext.util.Format.nl2br(v) ;
					}
				},{
					dataIndex: 'nt_done_ok',
					text: 'OK?',
					width: 65,
					editor: {
						xtype: 'checkboxfield'
					},
					renderer: function(v) {
						if( v ) {
							return '<b>'+'X'+'</b>' ;
						}
					}
				},{
					dataIndex: 'nt_done_text',
					text: 'Commentaire',
					width: 400,
					tdCls: 'multiline-row',
					editor: {
						xtype: 'textarea',
						enableKeyEvents : true,
						listeners       : {
								keydown : function(field, e) {
									if (e.getKey() == e.ENTER) {
										e.stopPropagation();
									}
								}
						}
					},
					renderer: function(v) {
						return Ext.util.Format.nl2br(v) ;
					}
				}],
				listeners: {
					selectionchange: function(selModel,records) {
						this.down('#gridNotepad').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0) ) ;
					},
					scope: this
				},
				plugins: [{
					ptype: 'rowediting',
					pluginId: 'rowediting',
					listeners: {
						beforeedit: this.onBeforeEdit,
						edit: this.onAfterEdit,
						canceledit: this.onCancelEdit,
						scope: this
					}
				}],
				tbar: [{
					itemId: 'tbNew',
					icon: 'images/add.png',
					text: 'Ajouter',
					handler: function() {
						this.handleNew();
					},
					scope: this
				},'-',{
					disabled: true,
					itemId: 'tbDelete',
					icon: 'images/delete.png',
					text: 'Supprimer',
					handler: function() {
						this.handleDelete();
					},
					scope: this
				}]
			}]
		}) ;
		this.callParent() ;
	},
	reload: function() {
		this.down('#gridNotepad').getStore().load() ;
	},
	onBeforeEdit: function(editor,context) {
		var notepad = this.down('#gridNotepad'),
			classCol = notepad.headerCt.down('[dataIndex="nt_class"]') ;
		classCol.getEditor().getStore().load() ;
	},
	onAfterEdit: function(editor,context) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'dev_setNotepadNote',
				data: Ext.JSON.encode( context.record.getData() ),
				nt_filerecord_id: context.record.get('nt_filerecord_id')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.reload() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onCancelEdit: function(editor,context) {
		var notepad = this.down('#gridNotepad') ;
		if( context.record.get('_phantom') ) {
			notepad.getStore().remove(context.record) ;
		}
	},
	handleDelete: function(doDelete) {
		if( !doDelete ) {
			Ext.Msg.confirm('Delete','Supprimer note ?',function(btn){
				if( btn=='yes' ) {
					this.handleDelete(true) ;
				}
			},this) ;
			return ;
		}
		var notepad = this.down('#gridNotepad') ;
		var toDeleteRecords = notepad.getSelectionModel().getSelection() ;
		if( toDeleteRecords && toDeleteRecords.length>0 ) {
			Ext.Array.each( toDeleteRecords, function(toDeleteRecord) {
				this.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_rsi_recouveo',
						_action: 'dev_setNotepadNote',
						data: null,
						nt_filerecord_id: toDeleteRecord.get('nt_filerecord_id')
					},
					success: function(response) {
						var ajaxResponse = Ext.decode(response.responseText) ;
						if( ajaxResponse.success == false ) {
							Ext.MessageBox.alert('Error','Error') ;
							return ;
						}
						this.reload() ;
					},
					callback: function() {
					},
					scope: this
				}) ;
			},this) ;
		}
	},
	handleNew: function() {
		var notepad = this.down('#gridNotepad') ;
		var newRecords = notepad.getStore().insert( 0, Ext.create('RsiRecouveoDevNotepalModel',{
			_phantom: true
		}) ) ;
		notepad.getPlugin('rowediting').startEdit(newRecords[0]) ;
	}
}) ;
