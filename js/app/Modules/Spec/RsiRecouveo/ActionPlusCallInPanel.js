Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',{
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
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Appel Entrant</b>'
				},{
					xtype: 'combobox',
					itemId: 'selectAdrTelName',
					fieldLabel: 'Destinataires',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['adr_name'],
						data : []
					},
					queryMode: 'local',
					displayField: 'adr_name',
					valueField: 'adr_name',
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
					name: 'mail_txt',
					height: 150
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		var adrNames = [] ;
		this._fileRecord.adr_tel().each( function(rec) {
			adrNames.push({adr_name: rec.get('adr_name')}) ;
		}) ;
		this.down('#selectAdrTelName').getStore().loadData(adrNames) ;
	},
	
	onSelectAdrTelName: function(cmb) {
		var adrName = cmb.getValue(),
			adrField = this.getForm().findField('adrtel_txt') ;
		adrField.reset() ;
		this._fileRecord.adr_tel().each( function(rec) {
			if( rec.get('adr_name') == adrName ) {
				adrField.setValue( rec.get('adr_tel_txt') ) ;
			}
		}) ;
	}
}) ;
