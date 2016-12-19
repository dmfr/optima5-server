Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionCallInForm',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
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
			},{
				xtype: 'fieldset',
				padding: 10,
				checkboxToggle: true,
				collapsed: false, // fieldset initially collapsed
				title: 'Changement statut',
				items:[{
					flex: 1,
					xtype: 'combobox',
					name: 'status_next',
					fieldLabel: 'Nouveau statut',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['txt'],
						data : [
							{id: '', txt:'<pas de changement>'},
							{id: 'S1_OPEN', txt:'Retour "En cours"'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.handleSubmitEvent() ;
				},
				scope: this
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
