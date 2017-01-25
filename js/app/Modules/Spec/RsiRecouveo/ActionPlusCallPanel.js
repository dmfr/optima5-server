Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'fieldset',
				title: 'Type d\'action',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Action',
					name: 'action_txt',
					value: ''
				},{
					hidden: true,
					xtype: 'displayfield',
					fieldLabel: 'Prévue le',
					name: 'action_sched',
					value: '',
					listeners: {
						change: function(field,val) {
							field.setVisible( !Ext.isEmpty(val) ) ;
						}
					}
				},{
					xtype: 'combobox',
					itemId: 'selectAdrTelName',
					fieldLabel: 'Numéro appel',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['adr_entity'],
						data : []
					},
					queryMode: 'local',
					displayField: 'adr_entity',
					valueField: 'adr_entity',
					listeners: {
						select: this.onSelectAdrTelName,
						scope: this
					}
				},{
					xtype: 'textfield',
					name: 'adrtel_txt',
					fieldLabel: 'No.Mobile'
				}]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'fieldset',
				padding: 10,
				title: 'Compte-rendu',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'textarea',
					name: 'txt',
					height: 150
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		var adrNames = [] ;
		this._accountRecord.adrbook().each( function(rec) {
			if( rec.get('adr_type') != 'TEL' || rec.get('status_is_invalid') ) {
				return ;
			}
			adrNames.push({adr_entity: rec.get('adr_entity')}) ;
		}) ;
		this.down('#selectAdrTelName').getStore().loadData(adrNames) ;
	},
	
	onSelectAdrTelName: function(cmb) {
		var adrEntity = cmb.getValue(),
			adrField = this.getForm().findField('adrtel_txt') ;
		adrField.reset() ;
		this._accountRecord.adrbook().each( function(rec) {
			if( rec.get('adr_type') != 'TEL' || rec.get('status_is_invalid') ) {
				return ;
			}
			if( rec.get('adr_entity') == adrEntity ) {
				adrField.setValue( rec.get('adr_txt') ) ;
			}
		}) ;
	}
}) ;
